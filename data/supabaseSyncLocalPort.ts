import {
  ensureUserDatabaseSchema,
  openExpoUserDatabase,
  USER_DATABASE_NAME,
  type OpenUserSqliteDatabase,
  type UserSqliteBindParams,
  type UserSqliteDatabase,
} from './userDatabaseSchema';
import type {
  SupabaseSyncCursor,
  SupabaseSyncDirtyRow,
  SupabaseSyncDomain,
  SupabaseSyncLocalPort,
} from './supabaseSyncClient';
import {
  mapDeletedEntityFromRemote,
  mapDeletedEntityToRemote,
  mapFlashcardFromRemote,
  mapFlashcardToRemote,
  mapFolderFromRemote,
  mapFolderToRemote,
  mapReaderDocumentFromRemote,
  mapReaderDocumentToRemote,
  mapReaderSettingsFromRemote,
  mapReaderSettingsToRemote,
  mapSavedWordFolderFromRemote,
  mapSavedWordFolderToRemote,
  mapSavedWordFromRemote,
  mapSavedWordToRemote,
  mapSearchHistoryFromRemote,
  mapSearchHistoryToRemote,
  mapUserProfileFromRemote,
  mapUserProfileToRemote,
} from './supabaseSyncMappers';
import {
  getRowKey,
  hasSameContent,
  insertSqliteRows,
  SYNCED_TABLE_SPECS,
  type SqliteRow,
  type SyncedTableName,
} from './userDatabaseSyncReconcile';

type DomainCodec = {
  fromRemote: (row: SqliteRow) => SqliteRow;
  localTable: SyncedTableName;
  remoteTable: string;
  toRemote: (row: SqliteRow) => SqliteRow;
};

// The user id is set by the client adapter from the signed-in session, never trusted from local rows.
const owner = { userId: '' };

// Mappers are typed per table; SQLite rows arrive untyped, so they are cast at this single boundary.
function codec(
  localTable: SyncedTableName,
  remoteTable: string,
  toRemote: (row: never, ownerArg: typeof owner) => object,
  fromRemote: (row: never) => object
): DomainCodec {
  return {
    fromRemote: (row) => fromRemote(row as never) as SqliteRow,
    localTable,
    remoteTable,
    toRemote: (row) => toRemote(row as never, owner) as SqliteRow,
  };
}

const DOMAIN_CODECS: Record<SupabaseSyncDomain, DomainCodec> = {
  flashcards: codec('flashcards', 'flashcards', mapFlashcardToRemote, mapFlashcardFromRemote),
  folders: codec('folders', 'library_folders', mapFolderToRemote, mapFolderFromRemote),
  profile: codec('user_profile', 'user_profiles', mapUserProfileToRemote, mapUserProfileFromRemote),
  reader_documents: codec('reader_documents', 'reader_documents', mapReaderDocumentToRemote, mapReaderDocumentFromRemote),
  reader_settings: codec('reader_settings', 'reader_settings', mapReaderSettingsToRemote, mapReaderSettingsFromRemote),
  saved_word_folders: codec('saved_word_folders', 'saved_word_folders', mapSavedWordFolderToRemote, mapSavedWordFolderFromRemote),
  saved_words: codec('saved_words', 'saved_words', mapSavedWordToRemote, mapSavedWordFromRemote),
  search_history: codec('search_history', 'search_history', mapSearchHistoryToRemote, mapSearchHistoryFromRemote),
  tombstones: codec('deleted_entities', 'deleted_entities', mapDeletedEntityToRemote, mapDeletedEntityFromRemote),
};

const DIRTY_SYNC_STATUSES = ['dirty', 'deleting', 'conflicted', 'pending_create', 'pending_update', 'pending_delete'];

export type CreateUserDatabaseSyncLocalPortOptions = {
  databaseName?: string;
  openDatabase?: OpenUserSqliteDatabase;
};

const SELECT_CURSOR_SQL = `SELECT
  last_successful_sync_at,
  last_pull_cursor,
  last_push_cursor
FROM user_sync_cursors
WHERE domain = ?
LIMIT 1`;

const UPSERT_CURSOR_SQL = `INSERT OR REPLACE INTO user_sync_cursors (
  domain,
  last_successful_sync_at,
  last_pull_cursor,
  last_push_cursor,
  updated_at
) VALUES (?, ?, ?, ?, ?)`;

export function createUserDatabaseSyncLocalPort({
  databaseName = USER_DATABASE_NAME,
  openDatabase = openExpoUserDatabase,
}: CreateUserDatabaseSyncLocalPortOptions = {}): SupabaseSyncLocalPort {
  return {
    async applyRemoteChanges(domain, rows, pulledAt) {
      const { fromRemote, localTable } = DOMAIN_CODECS[domain];

      await withUserSyncDatabase({ databaseName, openDatabase }, async (database) => {
        await database.withTransactionAsync(async () => {
          for (const change of rows) {
            const incoming = fromRemote(change.row);
            const existing = await findLocalRow(database, localTable, incoming);
            const remoteUpdatedAt = String(change.row.updated_at ?? '');

            // Last writer wins on the time of the change; a newer unpushed local edit is kept and pushed later.
            if (existing && isDirty(existing) && String(existing.last_local_change_at ?? '') > remoteUpdatedAt) continue;

            if (change.row.deleted_at) {
              if (existing) await deleteLocalRow(database, localTable, existing);
              continue;
            }

            const merged: SqliteRow = { ...existing, ...incoming };
            // Device-only settings (e.g. app lock) stay as this device set them.
            for (const column of SYNCED_TABLE_SPECS[localTable].deviceOnlyColumns ?? []) {
              if (existing) merged[column] = existing[column];
            }

            // Re-pulling our own push (or an unchanged row) must not touch the row: rewriting it would
            // bump last_pulled_at and make open screens treat their still-valid state as stale.
            if (existing && !isDirty(existing) && hasSameContent(merged, existing)) continue;

            await insertSqliteRows(database, localTable, [{
              ...merged,
              last_local_change_at: null,
              last_pulled_at: pulledAt,
              last_synced_at: pulledAt,
              remote_version: typeof change.row.version === 'number' ? change.row.version : null,
              sync_status: 'clean',
            }]);
          }
        });
      });
    },

    async loadDirtyRows(domain) {
      const { localTable, remoteTable, toRemote } = DOMAIN_CODECS[domain];

      return withUserSyncDatabase({ databaseName, openDatabase }, async (database) => {
        const placeholders = DIRTY_SYNC_STATUSES.map(() => '?').join(', ');
        const rows = await getAllRequired<SqliteRow>(
          database,
          `SELECT * FROM ${localTable} WHERE sync_status IN (${placeholders})`,
          ...DIRTY_SYNC_STATUSES
        );

        return rows.map((row): SupabaseSyncDirtyRow => {
          const localChangeAt = String(row.last_local_change_at ?? row.updated_at ?? row.deleted_at ?? '');
          return {
            id: getRowKey(localTable, row),
            localChangeAt,
            remoteRow: {
              ...toRemote(row),
              // updated_at carries the time of the local change so other devices can resolve conflicts.
              updated_at: localChangeAt,
              version: (typeof row.remote_version === 'number' ? row.remote_version : 0) + 1,
            },
            table: remoteTable,
          };
        });
      });
    },

    async loadDomainCursor(domain) {
      return withUserSyncDatabase({ databaseName, openDatabase }, async (database) => {
        const row = await getFirstRequired<{
          last_pull_cursor: string | null;
          last_push_cursor: string | null;
          last_successful_sync_at: string | null;
        }>(database, SELECT_CURSOR_SQL, domain);

        if (!row) return null;

        return {
          lastPullCursor: row.last_pull_cursor,
          lastPushCursor: row.last_push_cursor,
          lastSuccessfulSyncAt: row.last_successful_sync_at,
        } satisfies SupabaseSyncCursor;
      });
    },

    async markPushedRows(domain, rows, pushedAt) {
      const { localTable } = DOMAIN_CODECS[domain];
      const keyWhere = SYNCED_TABLE_SPECS[localTable].keyColumns.map((column) => `${column} = ?`).join(' AND ');

      await withUserSyncDatabase({ databaseName, openDatabase }, async (database) => {
        await database.withTransactionAsync(async () => {
          for (const row of rows) {
            const keyValues = SYNCED_TABLE_SPECS[localTable].keyColumns.map((column) => String(row.remoteRow[localKeyToRemote(localTable, column)] ?? ''));
            const unchangedSincePush = `${keyWhere} AND COALESCE(last_local_change_at, '') = ?`;

            if (row.remoteRow.deleted_at && localTable !== 'deleted_entities') {
              // The server now holds the deletion; the local soft-deleted copy is no longer needed.
              await database.runAsync(`DELETE FROM ${localTable} WHERE ${unchangedSincePush}`, ...keyValues, row.localChangeAt);
              continue;
            }

            await database.runAsync(
              `UPDATE ${localTable}
               SET sync_status = 'clean',
                   last_synced_at = ?,
                   last_local_change_at = NULL,
                   remote_version = ?
               WHERE ${unchangedSincePush}`,
              pushedAt,
              typeof row.remoteRow.version === 'number' ? row.remoteRow.version : null,
              ...keyValues,
              row.localChangeAt
            );
          }
        });
      });
    },

    async recordDomainCursor(domain, cursor) {
      await withUserSyncDatabase({ databaseName, openDatabase }, async (database) => {
        await database.runAsync(
          UPSERT_CURSOR_SQL,
          domain,
          cursor.lastSuccessfulSyncAt,
          cursor.lastPullCursor,
          cursor.lastPushCursor,
          cursor.lastSuccessfulSyncAt ?? new Date().toISOString()
        );
      });
    },
  };
}

// Local and remote rows share key column names except the singleton tables, whose local id is a fixed
// local row id and whose remote key is user_id (one row per user).
function localKeyToRemote(table: SyncedTableName, column: string) {
  if (table === 'user_profile' && column === 'id') return 'local_profile_id';
  if (table === 'reader_settings' && column === 'id') return 'local_settings_id';
  return column;
}

function isDirty(row: SqliteRow) {
  return DIRTY_SYNC_STATUSES.includes(String(row.sync_status));
}

async function findLocalRow(database: UserSqliteDatabase, table: SyncedTableName, row: SqliteRow) {
  const keyColumns = SYNCED_TABLE_SPECS[table].keyColumns;
  return getFirstRequired<SqliteRow>(
    database,
    `SELECT * FROM ${table} WHERE ${keyColumns.map((column) => `${column} = ?`).join(' AND ')} LIMIT 1`,
    ...keyColumns.map((column) => String(row[column] ?? ''))
  );
}

async function deleteLocalRow(database: UserSqliteDatabase, table: SyncedTableName, row: SqliteRow) {
  const keyColumns = SYNCED_TABLE_SPECS[table].keyColumns;
  await database.runAsync(
    `DELETE FROM ${table} WHERE ${keyColumns.map((column) => `${column} = ?`).join(' AND ')}`,
    ...keyColumns.map((column) => String(row[column] ?? ''))
  );
}

async function withUserSyncDatabase<T>(
  { databaseName, openDatabase }: Required<CreateUserDatabaseSyncLocalPortOptions>,
  task: (database: UserSqliteDatabase) => Promise<T>
) {
  const database = await openDatabase(databaseName);
  try {
    await ensureUserDatabaseSchema(database);
    return await task(database);
  } finally {
    await database.closeAsync?.();
  }
}

async function getAllRequired<T>(database: UserSqliteDatabase, source: string, ...params: UserSqliteBindParams) {
  if (!database.getAllAsync) {
    throw new Error('User SQLite database does not support getAllAsync.');
  }

  return database.getAllAsync<T>(source, ...params);
}

async function getFirstRequired<T>(database: UserSqliteDatabase, source: string, ...params: UserSqliteBindParams) {
  if (!database.getFirstAsync) {
    throw new Error('User SQLite database does not support getFirstAsync.');
  }

  return database.getFirstAsync<T>(source, ...params);
}
