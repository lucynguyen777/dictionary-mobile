import { describe, expect, it } from 'vitest';

import { USER_DATABASE_SCHEMA_SQL, USER_SYNC_DOMAINS } from '../data/userDatabaseSchema';

const schemaSql = USER_DATABASE_SCHEMA_SQL.join('\n');

const syncMetadataTables = [
  'user_profile',
  'folders',
  'saved_words',
  'saved_word_folders',
  'search_history',
  'flashcards',
  'deleted_entities',
  'reader_documents',
  'reader_settings',
] as const;

describe('user database sync metadata schema', () => {
  it('defines the domain cursors required before runtime cloud sync', () => {
    expect(USER_SYNC_DOMAINS).toEqual([
      'profile',
      'folders',
      'saved_words',
      'saved_word_folders',
      'flashcards',
      'reader_documents',
      'reader_settings',
      'search_history',
      'tombstones',
    ]);
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS user_sync_cursors');
    expect(schemaSql).toContain('domain TEXT PRIMARY KEY');
    expect(schemaSql).toContain('last_successful_sync_at TEXT');
    expect(schemaSql).toContain('last_pull_cursor TEXT');
    expect(schemaSql).toContain('last_push_cursor TEXT');
  });

  it('adds sync metadata fields to every local syncable table', () => {
    for (const table of syncMetadataTables) {
      const tableSql = requireCreateTableSql(table);

      expect(tableSql).toContain('sync_status TEXT');
      expect(tableSql).toContain('remote_version INTEGER');
      expect(tableSql).toContain('last_synced_at TEXT');
      expect(tableSql).toContain('last_local_change_at TEXT');
    }
  });

  it('keeps dirty-row indexes for high-churn sync domains', () => {
    expect(schemaSql).toContain('CREATE INDEX IF NOT EXISTS folders_sync_status_idx ON folders(sync_status, updated_at)');
    expect(schemaSql).toContain('CREATE INDEX IF NOT EXISTS saved_words_sync_status_idx ON saved_words(sync_status, updated_at)');
    expect(schemaSql).toContain('CREATE INDEX IF NOT EXISTS flashcards_sync_status_idx ON flashcards(sync_status, due_date)');
    expect(schemaSql).toContain(
      'CREATE INDEX IF NOT EXISTS reader_documents_sync_status_idx ON reader_documents(sync_status, updated_at)'
    );
  });
});

function requireCreateTableSql(table: string) {
  const statement = USER_DATABASE_SCHEMA_SQL.find((sql) => sql.includes(`CREATE TABLE IF NOT EXISTS ${table} (`));
  if (!statement) throw new Error(`Missing schema statement for ${table}`);

  return statement;
}
