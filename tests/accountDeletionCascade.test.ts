import type { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';

import { createAuthUser, createSupabaseTestDatabase } from './helpers/supabaseTestDatabase';

// Plan 2.6 groundwork, independent of owner decision D3 (when and how an account is deleted):
// whichever flow is chosen ends by deleting the auth user, so every table that holds user data
// must be removed with it. These tests run the real migrations.
let db: PGlite;

beforeAll(async () => {
  db = await createSupabaseTestDatabase();
}, 60_000);

describe('account deletion reaches every user table', () => {
  it('every public table with a user_id cascades from auth.users', async () => {
    const tables = await db.query<{ table_name: string }>(
      `select table_name from information_schema.columns
        where table_schema = 'public' and column_name = 'user_id' order by table_name`
    );
    const cascading = await db.query<{ table_name: string }>(
      `select distinct cl.relname as table_name
         from pg_constraint con
         join pg_class cl on cl.oid = con.conrelid
         join pg_namespace ns on ns.oid = cl.relnamespace
         join pg_class ref on ref.oid = con.confrelid
         join pg_namespace refns on refns.oid = ref.relnamespace
        where con.contype = 'f' and ns.nspname = 'public'
          and refns.nspname = 'auth' and ref.relname = 'users' and con.confdeltype = 'c'`
    );
    const cascadingNames = new Set(cascading.rows.map((row) => row.table_name));
    const missing = tables.rows.map((row) => row.table_name).filter((name) => !cascadingNames.has(name));

    expect(tables.rows.length).toBeGreaterThan(10);
    expect(missing).toEqual([]);
  });

  it('deleting the auth user leaves no rows behind', async () => {
    const userId = '00000000-0000-4000-8000-0000000000e1';
    const keepId = '00000000-0000-4000-8000-0000000000e2';
    await createAuthUser(db, userId);
    await createAuthUser(db, keepId);
    for (const id of [userId, keepId]) {
      await db.query(
        `insert into public.user_glossaries (user_id, id, name, source_lang, target_lang, provider) values ($1, 'g', 'G', 'EN', 'VI', 'openai')`,
        [id]
      );
      await db.query(
        `insert into public.user_glossary_entries (user_id, id, glossary_id, source_term, target_term) values ($1, 'e', 'g', 'a', 'b')`,
        [id]
      );
      await db.query(`insert into public.translation_datasets (user_id, id, name) values ($1, 'd', 'D')`, [id]);
      await db.query(`insert into public.translation_context_agents (user_id, id, name) values ($1, 'a', 'A')`, [id]);
    }

    await db.query('delete from auth.users where id = $1', [userId]);

    for (const table of ['user_glossaries', 'user_glossary_entries', 'translation_datasets', 'translation_context_agents']) {
      const remaining = await db.query<{ user_id: string }>(`select user_id from public.${table}`);
      expect(remaining.rows.map((row) => row.user_id), table).toEqual([keepId]);
    }
  });
});
