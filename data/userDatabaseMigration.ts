import { exportAllLocalData } from './exportAllData';
import type { LibraryState } from './libraryStore';
import { loadLibraryState } from './libraryStore';
import type { UserProfile } from './profileStore';
import { loadUserProfile } from './profileStore';
import type { ReaderState } from './readerStore';
import { loadReaderState } from './readerStore';
import {
  ensureUserDatabaseSchema,
  openExpoUserDatabase,
  USER_DATABASE_NAME,
  USER_DATABASE_SCHEMA_VERSION,
  type OpenUserSqliteDatabase,
  type UserSqliteDatabase,
} from './userDatabaseSchema';
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
  'DELETE FROM flashcards',
  'DELETE FROM search_history',
  'DELETE FROM saved_word_folders',
  'DELETE FROM saved_words',
  'DELETE FROM folders',
  'DELETE FROM user_profile',
  'DELETE FROM user_database_meta',
] as const;

const INSERT_META_SQL = 'INSERT OR REPLACE INTO user_database_meta (key, value) VALUES (?, ?)';

const INSERT_PROFILE_SQL = `INSERT OR REPLACE INTO user_profile (
  id,
  display_name,
  email,
  username,
  phone,
  avatar_url,
  login_method,
  native_language,
  learning_language,
  proficiency_level,
  learning_goal,
  timezone,
  daily_goal,
  app_lock_enabled,
  daily_reminder_enabled,
  review_reminder_enabled,
  weekly_summary_enabled,
  reminder_time,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const INSERT_FOLDER_SQL = `INSERT OR REPLACE INTO folders (
  id,
  name,
  color,
  color_note,
  tags_json,
  avatar_uri,
  is_favorite,
  created_at,
  updated_at,
  deleted_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const INSERT_SAVED_WORD_SQL = `INSERT OR REPLACE INTO saved_words (
  id,
  word,
  ipa,
  definition,
  audio,
  note,
  tags_json,
  source,
  created_at,
  updated_at,
  deleted_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const INSERT_SAVED_WORD_FOLDER_SQL = `INSERT OR REPLACE INTO saved_word_folders (
  word_id,
  folder_id,
  created_at
) VALUES (?, ?, ?)`;

const INSERT_SEARCH_HISTORY_SQL = `INSERT OR REPLACE INTO search_history (
  id,
  word,
  normalized_word,
  looked_up_at
) VALUES (?, ?, ?, ?)`;

const INSERT_FLASHCARD_SQL = `INSERT OR REPLACE INTO flashcards (
  id,
  word_id,
  type,
  front,
  back,
  created_at,
  review_state,
  interval,
  repetition,
  efactor,
  due_date,
  sync_status,
  last_synced_at,
  version,
  deleted_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const INSERT_DELETED_ENTITY_SQL = `INSERT OR REPLACE INTO deleted_entities (
  entity_type,
  entity_id,
  deleted_at
) VALUES (?, ?, ?)`;

const INSERT_READER_DOCUMENT_SQL = `INSERT OR REPLACE INTO reader_documents (
  id,
  title,
  content,
  source_format,
  created_at,
  updated_at,
  deleted_at
) VALUES (?, ?, ?, ?, ?, ?, ?)`;

const INSERT_READER_SETTINGS_SQL = `INSERT OR REPLACE INTO reader_settings (
  id,
  selected_document_id,
  font_size,
  font_family,
  background_color,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?)`;

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

export async function replaceUserDatabaseRows(database: UserSqliteDatabase, rows: SerializedUserDatabaseRows) {
  for (const statement of DELETE_TABLE_SQL) {
    await database.runAsync(statement);
  }

  for (const row of rows.meta) {
    await database.runAsync(INSERT_META_SQL, row.key, row.value);
  }

  await database.runAsync(
    INSERT_PROFILE_SQL,
    rows.profile.id,
    rows.profile.display_name,
    rows.profile.email,
    rows.profile.username,
    rows.profile.phone,
    rows.profile.avatar_url,
    rows.profile.login_method,
    rows.profile.native_language,
    rows.profile.learning_language,
    rows.profile.proficiency_level,
    rows.profile.learning_goal,
    rows.profile.timezone,
    rows.profile.daily_goal,
    rows.profile.app_lock_enabled,
    rows.profile.daily_reminder_enabled,
    rows.profile.review_reminder_enabled,
    rows.profile.weekly_summary_enabled,
    rows.profile.reminder_time,
    rows.profile.updated_at
  );

  for (const row of rows.folders) {
    await database.runAsync(
      INSERT_FOLDER_SQL,
      row.id,
      row.name,
      row.color,
      row.color_note,
      row.tags_json,
      row.avatar_uri,
      row.is_favorite,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }

  for (const row of rows.savedWords) {
    await database.runAsync(
      INSERT_SAVED_WORD_SQL,
      row.id,
      row.word,
      row.ipa,
      row.definition,
      row.audio,
      row.note,
      row.tags_json,
      row.source,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }

  for (const row of rows.savedWordFolders) {
    await database.runAsync(INSERT_SAVED_WORD_FOLDER_SQL, row.word_id, row.folder_id, row.created_at);
  }

  for (const row of rows.searchHistory) {
    await database.runAsync(INSERT_SEARCH_HISTORY_SQL, row.id, row.word, row.normalized_word, row.looked_up_at);
  }

  for (const row of rows.flashcards) {
    await database.runAsync(
      INSERT_FLASHCARD_SQL,
      row.id,
      row.word_id,
      row.type,
      row.front,
      row.back,
      row.created_at,
      row.review_state,
      row.interval,
      row.repetition,
      row.efactor,
      row.due_date,
      row.sync_status,
      row.last_synced_at,
      row.version,
      row.deleted_at
    );
  }

  for (const row of rows.deletedEntities) {
    await database.runAsync(INSERT_DELETED_ENTITY_SQL, row.entity_type, row.entity_id, row.deleted_at);
  }

  for (const row of rows.readerDocuments) {
    await database.runAsync(
      INSERT_READER_DOCUMENT_SQL,
      row.id,
      row.title,
      row.content,
      row.source_format,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }

  await database.runAsync(
    INSERT_READER_SETTINGS_SQL,
    rows.readerSettings.id,
    rows.readerSettings.selected_document_id,
    rows.readerSettings.font_size,
    rows.readerSettings.font_family,
    rows.readerSettings.background_color,
    rows.readerSettings.updated_at
  );
}

export function createAsyncStorageMigrationSource(): UserDatabaseMigrationSource {
  return {
    exportLocalData: exportAllLocalData,
    loadLibrary: loadLibraryState,
    loadProfile: loadUserProfile,
    loadReader: loadReaderState,
  };
}
