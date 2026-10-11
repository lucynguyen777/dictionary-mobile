import type { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';

import { asRole, createAuthUser, createSupabaseTestDatabase } from './helpers/supabaseTestDatabase';

const ALICE = '00000000-0000-4000-8000-00000000000a';
const BOB = '00000000-0000-4000-8000-00000000000b';

let db: PGlite;

type Tx = Parameters<Parameters<typeof asRole>[3]>[0];

// Expects the statement to be denied, using a savepoint so the surrounding transaction stays usable.
async function rejects(tx: Tx, sql: string, params: unknown[] = []) {
  await tx.exec('savepoint denied');
  await expect(tx.query(sql, params)).rejects.toThrow(/permission denied|row-level security/);
  await tx.exec('rollback to savepoint denied');
}

beforeAll(async () => {
  db = await createSupabaseTestDatabase();
  await createAuthUser(db, ALICE);
  await createAuthUser(db, BOB);
  await db.exec(`
    insert into public.user_provider_connections (user_id, id, provider, purpose)
      values ('${ALICE}', 'google-sheets', 'google', 'sheets-export'),
             ('${BOB}', 'google-sheets', 'google', 'sheets-export');
    insert into public.user_provider_secret_envelopes (user_id, connection_id, algorithm, nonce, ciphertext)
      values ('${ALICE}', 'google-sheets', 'aes-256-gcm', 'n', 'c');
    insert into public.proxy_usage_events (user_id, feature, provider, input_size, output_size, status)
      values ('${ALICE}', 'translate', 'deepl', 10, 10, 'ok');
    insert into public.feedback (user_id, category, message)
      values ('${ALICE}', 'bug', 'Something is broken here');
  `);
}, 60_000);

describe('server-only tables', () => {
  it('hides secret envelopes from clients entirely', async () => {
    await asRole(db, 'authenticated', ALICE, async (tx) => {
      await rejects(tx, 'select * from public.user_provider_secret_envelopes');
      await rejects(tx,
        `insert into public.user_provider_secret_envelopes (user_id, connection_id, algorithm, nonce, ciphertext)
         values ($1, 'google-sheets', 'x', 'x', 'x')`, [ALICE]);
    });
  });

  it('lets owners read but not write provider connections', async () => {
    await asRole(db, 'authenticated', ALICE, async (tx) => {
      const rows = await tx.query<{ user_id: string }>('select user_id from public.user_provider_connections');
      expect(rows.rows).toEqual([{ user_id: ALICE }]);
      await rejects(tx, `delete from public.user_provider_connections where user_id = $1`, [ALICE]);
      await rejects(tx, `update public.user_provider_connections set status = 'revoked'`);
    });
  });

  it('keeps usage events read-only for owners', async () => {
    await asRole(db, 'authenticated', ALICE, async (tx) => {
      expect((await tx.query('select id from public.proxy_usage_events')).rows).toHaveLength(1);
      await rejects(tx, 'delete from public.proxy_usage_events');
      await rejects(tx,
        `insert into public.translation_agent_usage_events (user_id, agent_id) values ($1, 'a')`, [ALICE]);
    });
    await asRole(db, 'authenticated', BOB, async (tx) => {
      expect((await tx.query('select id from public.proxy_usage_events')).rows).toHaveLength(0);
    });
  });

  it('forces feedback submissions through the backend', async () => {
    await asRole(db, 'authenticated', ALICE, async (tx) => {
      expect((await tx.query('select id from public.feedback')).rows).toHaveLength(1);
      await rejects(tx,
        `insert into public.feedback (user_id, category, message) values ($1, 'bug', 'Direct insert attempt')`, [ALICE]);
    });
    await asRole(db, 'authenticated', BOB, async (tx) => {
      expect((await tx.query('select id from public.feedback')).rows).toHaveLength(0);
    });
  });

  it('still lets the service role write server-owned rows', async () => {
    await asRole(db, 'service_role', null, async (tx) => {
      await tx.query(
        `insert into public.feedback (user_id, category, message) values ($1, 'bug', 'Backend submission ok')`, [BOB]);
      await tx.query(`delete from public.user_provider_secret_envelopes where user_id = $1`, [ALICE]);
    });
  });

  it('blocks anonymous access to app tables', async () => {
    await asRole(db, 'anon', null, async (tx) => {
      await rejects(tx, 'select * from public.saved_words');
      await rejects(tx, 'select * from public.feedback');
    });
  });
});

describe('user-owned sync tables', () => {
  it('isolates rows between users', async () => {
    await asRole(db, 'authenticated', ALICE, async (tx) => {
      await tx.query(`insert into public.search_history (user_id, id, word, normalized_word, looked_up_at, created_at, updated_at)
        values ($1, 'h1', 'hello', 'hello', now(), now(), now())`, [ALICE]);
      await rejects(tx, `insert into public.search_history (user_id, id, word, normalized_word, looked_up_at, created_at, updated_at)
        values ($1, 'h2', 'spoof', 'spoof', now(), now(), now())`, [BOB]);
    });
  });
});

describe('translation agent connection foreign key', () => {
  it('clears only connection_id when a connection is deleted', async () => {
    await asRole(db, 'service_role', null, async (tx) => {
      await tx.query(`insert into public.translation_context_agents (user_id, id, name, connection_id)
        values ($1, 'agent-1', 'Agent', 'google-sheets')`, [BOB]);
      await tx.query(`delete from public.user_provider_connections where user_id = $1`, [BOB]);
      const agent = await tx.query<{ user_id: string; connection_id: string | null }>(
        `select user_id, connection_id from public.translation_context_agents where id = 'agent-1'`);
      expect(agent.rows).toEqual([{ user_id: BOB, connection_id: null }]);
    });
  });
});
