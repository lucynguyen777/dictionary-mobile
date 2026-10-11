import type { UserSqliteDatabase } from './userDatabaseSchema';

// Local bookkeeping columns. Everything else on a synced row is user content.
export const LOCAL_SYNC_COLUMNS = [
  'sync_status',
  'remote_version',
  'last_synced_at',
  'last_local_change_at',
  'last_pulled_at',
] as const;

export type SyncedTableName =
  | 'user_profile'
  | 'folders'
  | 'saved_words'
  | 'saved_word_folders'
  | 'search_history'
  | 'flashcards'
  | 'deleted_entities'
  | 'reader_documents'
  | 'reader_settings';

export type SnapshotSection = 'library' | 'profile' | 'reader';

type SyncedTableSpec = {
  keyColumns: readonly string[];
  // How a row missing from a new snapshot is handled: soft-delete it so the deletion can sync,
  // or keep it as-is (tombstones and singletons are never removed by a snapshot).
  missing: 'soft-delete' | 'keep';
  section: SnapshotSection;
  // Content that need not be kept once a row is soft-deleted (e.g. a whole Reader document).
  softDeleteClears?: Readonly<Record<string, unknown>>;
};

export const SYNCED_TABLE_SPECS: Record<SyncedTableName, SyncedTableSpec> = {
  user_profile: { keyColumns: ['id'], missing: 'keep', section: 'profile' },
  folders: { keyColumns: ['id'], missing: 'soft-delete', section: 'library' },
  saved_words: { keyColumns: ['id'], missing: 'soft-delete', section: 'library' },
  saved_word_folders: { keyColumns: ['word_id', 'folder_id'], missing: 'soft-delete', section: 'library' },
  search_history: { keyColumns: ['id'], missing: 'soft-delete', section: 'library' },
  flashcards: { keyColumns: ['id'], missing: 'soft-delete', section: 'library' },
  deleted_entities: { keyColumns: ['entity_type', 'entity_id'], missing: 'keep', section: 'library' },
  reader_documents: {
    keyColumns: ['id'],
    missing: 'soft-delete',
    section: 'reader',
    softDeleteClears: { content: '' },
  },
  reader_settings: { keyColumns: ['id'], missing: 'keep', section: 'reader' },
};

export type SqliteRow = Record<string, unknown>;

export type ReconcileContext = {
  // When each snapshot section was read from SQLite; null means the caller supplied fresh data (no guard).
  loadedAt: Partial<Record<SnapshotSection, string | null>>;
  now: string;
};

export function getRowKey(table: SyncedTableName, row: SqliteRow) {
  return SYNCED_TABLE_SPECS[table].keyColumns.map((column) => String(row[column] ?? '')).join(':');
}

/**
 * Merges a freshly serialized snapshot with the rows already in SQLite so sync bookkeeping survives saves:
 * - unchanged rows keep their sync columns;
 * - new or edited rows become dirty with last_local_change_at = now;
 * - rows that disappeared from the snapshot are soft-deleted (dirty) if the server has seen them,
 *   or dropped if they were never synced;
 * - rows pulled from the server after this snapshot was loaded win over the stale snapshot.
 */
export function reconcileSyncedRows(
  table: SyncedTableName,
  snapshotRows: SqliteRow[],
  previousRows: SqliteRow[],
  context: ReconcileContext
): SqliteRow[] {
  const spec = SYNCED_TABLE_SPECS[table];
  const loadedAt = context.loadedAt[spec.section] ?? null;
  const previousByKey = new Map(previousRows.map((row) => [getRowKey(table, row), row]));
  const seenKeys = new Set<string>();
  const result: SqliteRow[] = [];

  for (const row of snapshotRows) {
    const key = getRowKey(table, row);
    seenKeys.add(key);
    const previous = previousByKey.get(key);

    if (previous && wasPulledAfter(previous, loadedAt)) {
      result.push(previous);
    } else if (previous && hasSameContent(row, previous)) {
      result.push({ ...previous, ...row, ...pickSyncColumns(previous) });
    } else {
      result.push({
        ...row,
        last_local_change_at: context.now,
        last_pulled_at: previous?.last_pulled_at ?? null,
        last_synced_at: previous?.last_synced_at ?? null,
        remote_version: previous?.remote_version ?? null,
        sync_status: 'dirty',
      });
    }
  }

  for (const [key, previous] of previousByKey) {
    if (seenKeys.has(key)) continue;

    if (spec.missing === 'keep' || previous.deleted_at || wasPulledAfter(previous, loadedAt)) {
      result.push(previous);
    } else if (previous.last_synced_at) {
      result.push({
        ...previous,
        ...spec.softDeleteClears,
        deleted_at: context.now,
        last_local_change_at: context.now,
        sync_status: 'dirty',
      });
    }
    // Never-synced rows that vanished need no tombstone: the server never had them.
  }

  return result;
}

export async function readSyncedRows(database: UserSqliteDatabase, table: SyncedTableName): Promise<SqliteRow[]> {
  if (!database.getAllAsync) throw new Error('User SQLite database does not support getAllAsync.');
  return database.getAllAsync<SqliteRow>(`SELECT * FROM ${table}`);
}

export async function insertSqliteRows(database: UserSqliteDatabase, table: string, rows: SqliteRow[]) {
  for (const row of rows) {
    const columns = Object.keys(row);
    const placeholders = columns.map(() => '?').join(', ');
    await database.runAsync(
      `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      ...columns.map((column) => toBindValue(row[column]))
    );
  }
}

function wasPulledAfter(row: SqliteRow, loadedAt: string | null) {
  return Boolean(
    loadedAt &&
      row.sync_status === 'clean' &&
      typeof row.last_pulled_at === 'string' &&
      row.last_pulled_at > loadedAt
  );
}

function hasSameContent(snapshotRow: SqliteRow, previous: SqliteRow) {
  return Object.keys(snapshotRow).every((column) => {
    if ((LOCAL_SYNC_COLUMNS as readonly string[]).includes(column)) return true;
    return normalizeValue(snapshotRow[column]) === normalizeValue(previous[column]);
  });
}

function pickSyncColumns(row: SqliteRow) {
  return Object.fromEntries(LOCAL_SYNC_COLUMNS.map((column) => [column, row[column] ?? null]));
}

function normalizeValue(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return typeof value === 'number' ? value : String(value);
}

function toBindValue(value: unknown): string | number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number' || typeof value === 'string') return value;
  return String(value);
}
