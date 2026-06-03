import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const proxyMigrationSql = readFileSync(resolve(process.cwd(), 'supabase/migrations/002_ai_translation_proxy.sql'), 'utf8');
const datasetAgentMigrationSql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/006_specialized_translation_datasets.sql'),
  'utf8'
);

const translationTables = [
  'translation_datasets',
  'translation_dataset_entries',
  'translation_dataset_documents',
  'translation_context_agents',
] as const;

describe('Supabase translation proxy migrations', () => {
  it('keeps 002 as the canonical create-table migration for translation dataset tables', () => {
    for (const table of translationTables) {
      expect(proxyMigrationSql).toContain(`create table if not exists public.${table}`);
      expect(datasetAgentMigrationSql).not.toMatch(new RegExp(`create\\s+table\\s+(if\\s+not\\s+exists\\s+)?public\\.${table}`, 'i'));
    }
  });

  it('keeps owner-scoped RLS policies with insert/update checks on canonical tables', () => {
    for (const table of translationTables) {
      expect(proxyMigrationSql).toContain(`alter table public.${table} enable row level security`);
      expect(proxyMigrationSql).toContain(
        `create policy ${table}_all_own on public.${table} for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)`
      );
    }
  });

  it('adds specialized agent fields without changing canonical id types', () => {
    expect(datasetAgentMigrationSql).toContain('alter table public.translation_datasets');
    expect(datasetAgentMigrationSql).toContain('add column if not exists description text');
    expect(datasetAgentMigrationSql).toContain('add column if not exists revision_history jsonb');
    expect(datasetAgentMigrationSql).toContain('add column if not exists dataset_ids jsonb');
    expect(datasetAgentMigrationSql).not.toMatch(/id uuid primary key/i);
    expect(datasetAgentMigrationSql).not.toMatch(/dataset_id uuid/i);
  });
});
