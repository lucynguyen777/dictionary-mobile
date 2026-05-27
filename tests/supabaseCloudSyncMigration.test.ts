import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationPath = resolve(process.cwd(), 'supabase/migrations/001_cloud_sync_mvp.sql');
const migrationSql = readFileSync(migrationPath, 'utf8');

const syncTables = [
  'user_profiles',
  'library_folders',
  'saved_words',
  'saved_word_folders',
  'search_history',
  'flashcards',
  'deleted_entities',
  'reader_documents',
  'reader_settings',
] as const;

const policyOperations = ['select', 'insert', 'update', 'delete'] as const;

describe('Supabase cloud sync migration draft', () => {
  it('creates every MVP sync table with auth-owned user scope', () => {
    for (const table of syncTables) {
      expect(migrationSql).toContain(`create table if not exists public.${table}`);
      expect(migrationSql).toContain('user_id uuid');
      expect(migrationSql).toContain('references auth.users(id) on delete cascade');
    }
  });

  it('enables RLS and own-row policies for every sync table', () => {
    for (const table of syncTables) {
      expect(migrationSql).toContain(`alter table public.${table} enable row level security`);

      for (const operation of policyOperations) {
        expect(migrationSql).toContain(
          `create policy ${table}_${operation}_own on public.${table} for ${operation} to authenticated`
        );
      }
    }
  });

  it('keeps policy checks scoped to auth uid and avoids service role references', () => {
    const policyCount = syncTables.length * policyOperations.length;
    const authScopeCount = migrationSql.match(/auth\.uid\(\) = user_id/g)?.length ?? 0;

    expect(authScopeCount).toBeGreaterThanOrEqual(policyCount);
    expect(migrationSql).not.toMatch(/service[_ -]?role/i);
  });

  it('preserves local-first sync metadata fields needed by the MVP contract', () => {
    expect(migrationSql).toContain('version integer not null default 1');
    expect(migrationSql).toContain('deleted_at timestamptz');
    expect(migrationSql).toContain('updated_at timestamptz not null');
    expect(migrationSql).toContain('primary key (user_id, entity_type, entity_id)');
    expect(migrationSql).toContain("local_profile_id text not null default 'local-profile'");
    expect(migrationSql).toContain("local_settings_id text not null default 'local-reader-settings'");
  });
});
