import { exportAllLocalData } from './exportAllData';
import type { LibraryState } from './libraryStore';
import { loadLibraryStateFromAsyncStorage } from './libraryStore';
import type { UserProfile } from './profileStore';
import { loadUserProfileFromAsyncStorage } from './profileStore';
import type { ReaderState } from './readerStore';
import { loadReaderStateFromAsyncStorage } from './readerStore';
import {
  ensureUserDatabaseSchema,
  openExpoUserDatabase,
  USER_DATABASE_NAME,
  USER_DATABASE_SCHEMA_VERSION,
  type OpenUserSqliteDatabase,
  type UserSqliteDatabase,
} from './userDatabaseSchema';
import {
  insertSqliteRows,
  readSyncedRows,
  reconcileSyncedRows,
  type ReconcileContext,
  type SqliteRow,
  type SyncedTableName,
} from './userDatabaseSyncReconcile';
import {
  getUserDatabaseParityCounts,
  serializeUserDataForSqlite,
  type SerializedUserDatabaseRows,
  type UserDatabaseParityCounts,
} from './userDatabaseMappers';

type ExportSafetyResult = {
  ok: boolean;
  message: string;
  uri?: string;
};

export type UserDatabaseMigrationSource = {
  exportLocalData?: () => Promise<ExportSafetyResult>;
  loadLibrary: () => Promise<LibraryState>;
  loadProfile: () => Promise<UserProfile>;
  loadReader: () => Promise<ReaderState>;
};

export type MigrateAsyncStorageToUserDatabaseOptions = {
  databaseName?: string;
  now?: () => string;
  openDatabase?: OpenUserSqliteDatabase;
  source?: UserDatabaseMigrationSource;
};

export type UserDatabaseMigrationResult = {
  counts: UserDatabaseParityCounts;
  databaseName: string;
  databaseUri: string;
  migratedAt: string;
  schemaVersion: number;
};

const DELETE_TABLE_SQL = [
  'DELETE FROM reader_settings',
  'DELETE FROM reader_documents',
  'DELETE FROM deleted_entities',
  'DELETE FROM flashcard_learning_settings',
  'DELETE FROM flashcard_review_events',
  'DELETE FROM flashcards',
  'DELETE FROM search_history',
  'DELETE FROM saved_word_folders',
  'DELETE FROM saved_words',
  'DELETE FROM folders',
  'DELETE FROM user_profile',
  'DELETE FROM user_database_meta',
] as const;

const INSERT_META_SQL = 'INSERT OR REPLACE INTO user_database_meta (key, value) VALUES (?, ?)';

const INSERT_FLASHCARD_REVIEW_EVENT_SQL = `INSERT OR REPLACE INTO flashcard_review_events (
  id,
  flashcard_id,
  word_id,
  quality,
  reviewed_at,
  scheduled_due_date_after_review
) VALUES (?, ?, ?, ?, ?, ?)`;

const INSERT_FLASHCARD_LEARNING_SETTINGS_SQL = `INSERT OR REPLACE INTO flashcard_learning_settings (
  id,
  completion_min_average_quality,
  completion_min_review_count,
  updated_at
) VALUES (?, ?, ?, ?)`;

export async function migrateAsyncStorageToUserDatabase({
  databaseName = USER_DATABASE_NAME,
  now = () => new Date().toISOString(),
  openDatabase = openExpoUserDatabase,
  source = createAsyncStorageMigrationSource(),
}: MigrateAsyncStorageToUserDatabaseOptions = {}): Promise<UserDatabaseMigrationResult> {
  const exportResult = await source.exportLocalData?.();
  if (exportResult && !exportResult.ok) {
    throw new Error(`User data export failed before SQLite migration: ${exportResult.message}`);
  }

  const [profile, library, reader] = await Promise.all([
    source.loadProfile(),
    source.loadLibrary(),
    source.loadReader(),
  ]);
  const migratedAt = now();
  const rows = serializeUserDataForSqlite(
    { library, profile, reader },
    { migratedAt, schemaVersion: USER_DATABASE_SCHEMA_VERSION }
  );

  const database = await openDatabase(databaseName);
  try {
    await ensureUserDatabaseSchema(database);
    await database.withTransactionAsync(async () => {
      await replaceUserDatabaseRows(database, rows);
    });

    return {
      counts: getUserDatabaseParityCounts(rows),
      databaseName,
      databaseUri: database.databasePath || `sqlite://${databaseName}`,
      migratedAt,
      schemaVersion: USER_DATABASE_SCHEMA_VERSION,
    };
  } finally {
    await database.closeAsync?.();
  }
}

export type ReplaceUserDatabaseRowsOptions = {
  // When each snapshot section was loaded; omitted sections are treated as fresh (no stale-snapshot guard).
  loadedAt?: ReconcileContext['loadedAt'];
  now?: string;
};

// Writes a full snapshot. Synced tables are reconciled against existing rows so dirty tracking,
// soft-deleted rows, and rows pulled after the snapshot was loaded survive the rewrite.
export async function replaceUserDatabaseRows(
  database: UserSqliteDatabase,
  rows: SerializedUserDatabaseRows,
  { loadedAt = {}, now = new Date().toISOString() }: ReplaceUserDatabaseRowsOptions = {}
) {
  const snapshotRowsByTable: Record<SyncedTableName, SqliteRow[]> = {
    user_profile: [rows.profile],
    folders: rows.folders,
    saved_words: rows.savedWords,
    saved_word_folders: rows.savedWordFolders,
    search_history: rows.searchHistory,
    flashcards: rows.flashcards,
    deleted_entities: rows.deletedEntities,
    reader_documents: rows.readerDocuments,
    reader_settings: [rows.readerSettings],
  };
  const tables = Object.keys(snapshotRowsByTable) as SyncedTableName[];
  const previousRowsByTable = new Map<SyncedTableName, SqliteRow[]>();
  for (const table of tables) {
    previousRowsByTable.set(table, await readSyncedRows(database, table));
  }

  for (const statement of DELETE_TABLE_SQL) {
    await database.runAsync(statement);
  }

  for (const row of rows.meta) {
    await database.runAsync(INSERT_META_SQL, row.key, row.value);
  }

  await database.runAsync(
    INSERT_FLASHCARD_LEARNING_SETTINGS_SQL,
    rows.flashcardLearningSettings.id,
    rows.flashcardLearningSettings.completion_min_average_quality,
    rows.flashcardLearningSettings.completion_min_review_count,
    rows.flashcardLearningSettings.updated_at
  );

  for (const row of rows.flashcardReviewEvents) {
    await database.runAsync(
      INSERT_FLASHCARD_REVIEW_EVENT_SQL,
      row.id,
      row.flashcard_id,
      row.word_id,
      row.quality,
      row.reviewed_at,
      row.scheduled_due_date_after_review
    );
  }

  for (const table of tables) {
    const reconciled = reconcileSyncedRows(
      table,
      snapshotRowsByTable[table] as SqliteRow[],
      previousRowsByTable.get(table) ?? [],
      { loadedAt, now }
    );
    await insertSqliteRows(database, table, reconciled);
  }
}

export function createAsyncStorageMigrationSource(): UserDatabaseMigrationSource {
  return {
    exportLocalData: exportAllLocalData,
    loadLibrary: loadLibraryStateFromAsyncStorage,
    loadProfile: loadUserProfileFromAsyncStorage,
    loadReader: loadReaderStateFromAsyncStorage,
  };
}
