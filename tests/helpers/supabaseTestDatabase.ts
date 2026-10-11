import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PGlite } from '@electric-sql/pglite';

const MIGRATIONS_DIR = resolve(process.cwd(), 'supabase/migrations');

// Minimal stand-in for the Supabase auth schema and API roles so migrations and RLS run unmodified.
const SUPABASE_BOOTSTRAP_SQL = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to service_role;
`;

export async function createSupabaseTestDatabase() {
  const db = new PGlite();
  await db.exec(SUPABASE_BOOTSTRAP_SQL);
  const migrations = readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql')).sort();
  for (const name of migrations) {
    await db.exec(readFileSync(resolve(MIGRATIONS_DIR, name), 'utf8'));
  }
  return db;
}

export async function createAuthUser(db: PGlite, id: string) {
  await db.query('insert into auth.users (id) values ($1)', [id]);
}

// Runs statements as the given API role inside a transaction that is always rolled back.
export async function asRole<T>(
  db: PGlite,
  role: 'anon' | 'authenticated' | 'service_role',
  userId: string | null,
  run: (tx: Pick<PGlite, 'query' | 'exec'>) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId ?? '']);
    await tx.exec(`set local role ${role}`);
    try {
      return await run(tx);
    } finally {
      await tx.rollback();
    }
  }) as Promise<T>;
}
