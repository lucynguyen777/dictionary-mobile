import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/007_authenticated_table_grants.sql'),
  'utf8'
).toLowerCase();

const appTables = [
  'user_profiles',
  'library_folders',
  'saved_words',
  'saved_word_folders',
  'search_history',
  'flashcards',
  'deleted_entities',
  'reader_documents',
  'reader_settings',
  'user_provider_connections',
  'user_provider_secret_envelopes',
  'proxy_usage_events',
  'user_glossaries',
  'user_glossary_entries',
  'translation_datasets',
  'translation_dataset_entries',
  'translation_dataset_documents',
  'translation_context_agents',
  'translation_agent_usage_events',
];

describe('authenticated table grants migration', () => {
  it('lets authenticated users reach RLS-protected app tables', () => {
    expect(migration).toContain('grant select, insert, update, delete on table');
    expect(migration).toContain('to authenticated;');

    for (const table of appTables) {
      expect(migration).toContain(`public.${table}`);
    }
  });

  it('does not grant app-table privileges to anon or service_role', () => {
    expect(migration).not.toMatch(/to\s+anon\b/);
    expect(migration).not.toMatch(/to\s+service_role\b/);
  });
});
