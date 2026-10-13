import type { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';

import { asRole, createAuthUser, createSupabaseTestDatabase } from './helpers/supabaseTestDatabase';

const ALICE = '00000000-0000-4000-8000-0000000000f1';
const BOB = '00000000-0000-4000-8000-0000000000f2';
let db: PGlite;

beforeAll(async () => {
  db = await createSupabaseTestDatabase();
  await createAuthUser(db, ALICE);
  await createAuthUser(db, BOB);
}, 60_000);

describe('account deletion requests (migration 012)', () => {
  it('is server-only: signed-in users cannot read or write requests', async () => {
    await expect(asRole(db, 'authenticated', ALICE, (tx) => tx.query('select * from public.account_deletion_requests'))).rejects.toThrow();
    await expect(asRole(db, 'authenticated', ALICE, (tx) =>
      tx.query(`insert into public.account_deletion_requests (user_id, purge_after) values ($1, now())`, [ALICE])
    )).rejects.toThrow();
    await expect(asRole(db, 'authenticated', ALICE, (tx) => tx.query('select public.purge_due_account_deletions()'))).rejects.toThrow();
  });

  it('purges only users whose grace period has ended, with their data', async () => {
    await db.query(`insert into public.user_glossaries (user_id, id, name, source_lang, target_lang, provider) values ($1, 'g', 'G', 'EN', 'VI', 'openai')`, [ALICE]);
    await db.query(`insert into public.account_deletion_requests (user_id, purge_after) values ($1, now() - interval '1 minute'), ($2, now() + interval '30 days')`, [ALICE, BOB]);

    const purged = await db.query<{ purge_due_account_deletions: number }>('select public.purge_due_account_deletions()');
    expect(purged.rows[0].purge_due_account_deletions).toBe(1);

    const users = await db.query<{ id: string }>('select id from auth.users order by id');
    expect(users.rows.map((row) => row.id)).toEqual([BOB]);
    expect((await db.query('select * from public.user_glossaries where user_id = $1', [ALICE])).rows).toEqual([]);
    expect((await db.query<{ user_id: string }>('select user_id from public.account_deletion_requests')).rows).toEqual([{ user_id: BOB }]);
  });
});
