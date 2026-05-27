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
  SupabaseSyncRemoteChange,
} from './supabaseSyncClient';

type LocalSyncDomainConfig = {
  idWhere: string;
  localChangeAtExpression: string;
  localTable: string;
  remoteTable: string;
};

export type CreateUserDatabaseSyncLocalPortOptions = {
  databaseName?: string;
  openDatabase?: OpenUserSqliteDatabase;
};

const DIRTY_SYNC_STATUSES = ['dirty', 'deleting', 'conflicted', 'pending_create', 'pending_update', 'pending_delete'];

const LOCAL_SYNC_DOMAIN_CONFIG: Record<SupabaseSyncDomain, LocalSyncDomainConfig> = {
  flashcards: {
    idWhere: 'id = ?',
    localChangeAtExpression: "COALESCE(last_local_change_at, last_synced_at, created_at, '')",
    localTable: 'flashcards',
    remoteTable: 'flashcards',
  },
  folders: {
    idWhere: 'id = ?',
    localChangeAtExpression: "COALESCE(last_local_change_at, updated_at, created_at, deleted_at, '')",
    localTable: 'folders',
    remoteTable: 'library_folders',
  },
  profile: {
    idWhere: 'id = ?',
    localChangeAtExpression: "COALESCE(last_local_change_at, updated_at, '')",
    localTable: 'user_profile',
    remoteTable: 'user_profiles',
  },
  reader_documents: {
    idWhere: 'id = ?',
    localChangeAtExpression: "COALESCE(last_local_change_at, updated_at, created_at, deleted_at, '')",
    localTable: 'reader_documents',
    remoteTable: 'reader_documents',
  },
  reader_settings: {
    idWhere: 'id = ?',
    localChangeAtExpression: "COALESCE(last_local_change_at, updated_at, '')",
    localTable: 'reader_settings',
    remoteTable: 'reader_settings',
  },
  saved_word_folders: {
    idWhere: "word_id || ':' || folder_id = ?",
    localChangeAtExpression: "COALESCE(last_local_change_at, updated_at, created_at, deleted_at, '')",
    localTable: 'saved_word_folders',
    remoteTable: 'saved_word_folders',
  },
  saved_words: {
    idWhere: 'id = ?',
    localChangeAtExpression: "COALESCE(last_local_change_at, updated_at, created_at, deleted_at, '')",
    localTable: 'saved_words',
    remoteTable: 'saved_words',
  },
  search_history: {
    idWhere: 'id = ?',
    localChangeAtExpression: "COALESCE(last_local_change_at, updated_at, created_at, looked_up_at, '')",
    localTable: 'search_history',
    remoteTable: 'search_history',
  },
  tombstones: {
    idWhere: "entity_type || ':' || entity_id = ?",
    localChangeAtExpression: "COALESCE(last_local_change_at, deleted_at, '')",
    localTable: 'deleted_entities',
    remoteTable: 'deleted_entities',
  },
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
    async applyRemoteChanges(domain, rows) {
      await withUserSyncDatabase({ databaseName, openDatabase }, async (database) => {
        for (const row of rows) {
          if (!row.deletedAt) continue;

          await database.runAsync(createApplyRemoteDeleteSql(domain), row.deletedAt, row.deletedAt, row.id);
        }
      });
    },

    async loadDirtyRows(domain) {
      return withUserSyncDatabase({ databaseName, openDatabase }, async (database) => {
        return getAllRequired<{
          sync_local_change_at: string;
          sync_row_id: string;
        }>(database, createLoadDirtyRowsSql(domain), ...DIRTY_SYNC_STATUSES).then((rows) =>
          rows.map((row): SupabaseSyncDirtyRow => ({
            id: row.sync_row_id,
            localChangeAt: row.sync_local_change_at,
            table: LOCAL_SYNC_DOMAIN_CONFIG[domain].remoteTable,
          }))
        );
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

    async markPushedRows(domain, rowIds, pushedAt) {
      await withUserSyncDatabase({ databaseName, openDatabase }, async (database) => {
        for (const rowId of rowIds) {
          await database.runAsync(createMarkPushedSql(domain), pushedAt, rowId);
        }
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

function createLoadDirtyRowsSql(domain: SupabaseSyncDomain) {
  const config = LOCAL_SYNC_DOMAIN_CONFIG[domain];
  const idExpression = getIdExpression(domain);
  const placeholders = DIRTY_SYNC_STATUSES.map(() => '?').join(', ');

  return `SELECT
    ${idExpression} AS sync_row_id,
    ${config.localChangeAtExpression} AS sync_local_change_at
  FROM ${config.localTable}
  WHERE sync_status IN (${placeholders})
  ORDER BY sync_local_change_at ASC`;
}

function createApplyRemoteDeleteSql(domain: SupabaseSyncDomain) {
  const config = LOCAL_SYNC_DOMAIN_CONFIG[domain];

  return `UPDATE ${config.localTable}
  SET deleted_at = ?,
      sync_status = 'clean',
      last_synced_at = ?,
      last_local_change_at = NULL
  WHERE ${config.idWhere}`;
}

function createMarkPushedSql(domain: SupabaseSyncDomain) {
  const config = LOCAL_SYNC_DOMAIN_CONFIG[domain];

  return `UPDATE ${config.localTable}
  SET sync_status = 'clean',
      last_synced_at = ?,
      last_local_change_at = NULL
  WHERE ${config.idWhere}`;
}

function getIdExpression(domain: SupabaseSyncDomain) {
  switch (domain) {
    case 'saved_word_folders':
      return "word_id || ':' || folder_id";
    case 'tombstones':
      return "entity_type || ':' || entity_id";
    default:
      return 'id';
  }
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
