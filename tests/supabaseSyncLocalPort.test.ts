import { describe, expect, it } from 'vitest';

import { createUserDatabaseSyncLocalPort } from '../data/supabaseSyncLocalPort';
import type { UserSqliteBindParams, UserSqliteDatabase } from '../data/userDatabaseSchema';

describe('createUserDatabaseSyncLocalPort', () => {
  it('loads and records per-domain cursors through SQLite metadata', async () => {
    const database = new FakeSyncDatabase();
    database.cursorRows.set('folders', {
      last_pull_cursor: 'pull-1',
      last_push_cursor: 'push-1',
      last_successful_sync_at: '2026-05-27T10:00:00.000Z',
    });
    const port = createUserDatabaseSyncLocalPort({ openDatabase: async () => database });

    await expect(port.loadDomainCursor('folders')).resolves.toEqual({
      lastPullCursor: 'pull-1',
      lastPushCursor: 'push-1',
      lastSuccessfulSyncAt: '2026-05-27T10:00:00.000Z',
    });

    await port.recordDomainCursor('folders', {
      lastPullCursor: 'pull-2',
      lastPushCursor: 'push-2',
      lastSuccessfulSyncAt: '2026-05-27T11:00:00.000Z',
    });

    expect(database.cursorRows.get('folders')).toEqual({
      last_pull_cursor: 'pull-2',
      last_push_cursor: 'push-2',
      last_successful_sync_at: '2026-05-27T11:00:00.000Z',
    });
  });

  it('loads dirty rows in deterministic local-change order', async () => {
    const database = new FakeSyncDatabase();
    database.dirtyRows.set('saved_words', [
      { sync_local_change_at: '2026-05-27T10:10:00.000Z', sync_row_id: 'word-b' },
      { sync_local_change_at: '2026-05-27T10:00:00.000Z', sync_row_id: 'word-a' },
    ]);
    const port = createUserDatabaseSyncLocalPort({ openDatabase: async () => database });

    await expect(port.loadDirtyRows('saved_words')).resolves.toEqual([
      { id: 'word-a', localChangeAt: '2026-05-27T10:00:00.000Z', table: 'saved_words' },
      { id: 'word-b', localChangeAt: '2026-05-27T10:10:00.000Z', table: 'saved_words' },
    ]);
    expect(database.lastGetAll?.source).toContain('FROM saved_words');
    expect(database.lastGetAll?.params).toEqual([
      'dirty',
      'deleting',
      'conflicted',
      'pending_create',
      'pending_update',
      'pending_delete',
    ]);
  });

  it('marks pushed rows clean without deleting local data', async () => {
    const database = new FakeSyncDatabase();
    const port = createUserDatabaseSyncLocalPort({ openDatabase: async () => database });

    await port.markPushedRows('folders', ['folder-1'], '2026-05-27T12:00:00.000Z');

    expect(database.runStatements.at(-1)).toMatchObject({
      params: ['2026-05-27T12:00:00.000Z', 'folder-1'],
    });
    expect(database.runStatements.at(-1)?.source).toContain("sync_status = 'clean'");
    expect(database.runStatements.at(-1)?.source).toContain('WHERE id = ?');
  });

  it('applies remote tombstones as local soft deletes', async () => {
    const database = new FakeSyncDatabase();
    const port = createUserDatabaseSyncLocalPort({ openDatabase: async () => database });

    await port.applyRemoteChanges('folders', [
      {
        deletedAt: '2026-05-27T13:00:00.000Z',
        id: 'folder-1',
        table: 'library_folders',
      },
      {
        id: 'folder-2',
        table: 'library_folders',
      },
    ]);

    expect(database.runStatements).toHaveLength(1);
    expect(database.runStatements[0]).toMatchObject({
      params: ['2026-05-27T13:00:00.000Z', '2026-05-27T13:00:00.000Z', 'folder-1'],
    });
    expect(database.runStatements[0].source).toContain('SET deleted_at = ?');
  });
});

class FakeSyncDatabase implements UserSqliteDatabase {
  closeCount = 0;
  cursorRows = new Map<string, Record<string, string | null>>();
  dirtyRows = new Map<string, { sync_local_change_at: string; sync_row_id: string }[]>();
  execStatements: string[] = [];
  lastGetAll: { params: UserSqliteBindParams; source: string } | null = null;
  runStatements: { params: UserSqliteBindParams; source: string }[] = [];

  async closeAsync() {
    this.closeCount += 1;
  }

  async execAsync(source: string) {
    this.execStatements.push(source);
  }

  async getAllAsync<T>(source: string, ...params: UserSqliteBindParams) {
    this.lastGetAll = { params, source };
    const table = source.match(/FROM\s+([a-z_]+)/i)?.[1] ?? '';
    const rows = [...(this.dirtyRows.get(table) ?? [])].sort((a, b) =>
      a.sync_local_change_at.localeCompare(b.sync_local_change_at)
    );

    return rows as T[];
  }

  async getFirstAsync<T>(_source: string, ...params: UserSqliteBindParams) {
    return (this.cursorRows.get(String(params[0])) ?? null) as T | null;
  }

  async runAsync(source: string, ...params: UserSqliteBindParams) {
    this.runStatements.push({ params, source });

    if (source.includes('INSERT OR REPLACE INTO user_sync_cursors')) {
      const [domain, lastSuccessfulSyncAt, lastPullCursor, lastPushCursor] = params;
      this.cursorRows.set(String(domain), {
        last_pull_cursor: lastPullCursor as string | null,
        last_push_cursor: lastPushCursor as string | null,
        last_successful_sync_at: lastSuccessfulSyncAt as string | null,
      });
    }
  }

  async withTransactionAsync(task: () => Promise<void>) {
    await task();
  }
}
