export const USER_DATABASE_NAME = 'dictionary-mobile-user.sqlite';
export const USER_DATABASE_SCHEMA_VERSION = 1;

export type UserSqliteBindValue = string | number | null | boolean | Uint8Array;
export type UserSqliteBindParams = UserSqliteBindValue[];

export type UserSqliteDatabase = {
  closeAsync?: () => Promise<void>;
  databasePath?: string;
  execAsync: (source: string) => Promise<void>;
  runAsync: (source: string, ...params: UserSqliteBindParams) => Promise<unknown>;
  withTransactionAsync: (task: () => Promise<void>) => Promise<void>;
};

export type OpenUserSqliteDatabase = (databaseName: string) => Promise<UserSqliteDatabase>;
export type DeleteUserSqliteDatabase = (databaseName: string) => Promise<void>;

export const USER_DATABASE_SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS user_database_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    username TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    login_method TEXT NOT NULL DEFAULT 'local',
    native_language TEXT NOT NULL,
    learning_language TEXT NOT NULL,
    proficiency_level TEXT NOT NULL,
    learning_goal TEXT NOT NULL,
    timezone TEXT NOT NULL,
    daily_goal TEXT NOT NULL,
    app_lock_enabled INTEGER NOT NULL DEFAULT 0,
    daily_reminder_enabled INTEGER NOT NULL DEFAULT 1,
    review_reminder_enabled INTEGER NOT NULL DEFAULT 1,
    weekly_summary_enabled INTEGER NOT NULL DEFAULT 0,
    reminder_time TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    color_note TEXT NOT NULL DEFAULT '',
    tags_json TEXT NOT NULL DEFAULT '[]',
    avatar_uri TEXT NOT NULL DEFAULT '',
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS saved_words (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL,
    ipa TEXT NOT NULL DEFAULT '',
    definition TEXT NOT NULL DEFAULT '',
    audio TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    tags_json TEXT NOT NULL DEFAULT '[]',
    source TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS saved_word_folders (
    word_id TEXT NOT NULL,
    folder_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (word_id, folder_id)
  )`,
  `CREATE TABLE IF NOT EXISTS search_history (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL,
    normalized_word TEXT NOT NULL,
    looked_up_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    word_id TEXT NOT NULL,
    type TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    created_at TEXT NOT NULL,
    review_state TEXT NOT NULL,
    interval INTEGER NOT NULL,
    repetition INTEGER NOT NULL,
    efactor REAL NOT NULL,
    due_date TEXT NOT NULL,
    sync_status TEXT,
    last_synced_at TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS deleted_entities (
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    deleted_at TEXT NOT NULL,
    PRIMARY KEY (entity_type, entity_id)
  )`,
  `CREATE TABLE IF NOT EXISTS reader_documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_format TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS reader_settings (
    id TEXT PRIMARY KEY,
    selected_document_id TEXT,
    font_size INTEGER NOT NULL,
    font_family TEXT NOT NULL,
    background_color TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS saved_words_word_idx ON saved_words(word)',
  'CREATE INDEX IF NOT EXISTS saved_word_folders_folder_idx ON saved_word_folders(folder_id)',
  'CREATE INDEX IF NOT EXISTS search_history_lookup_idx ON search_history(normalized_word, looked_up_at)',
  'CREATE INDEX IF NOT EXISTS flashcards_due_idx ON flashcards(due_date, review_state)',
  'CREATE INDEX IF NOT EXISTS reader_documents_updated_idx ON reader_documents(updated_at)',
] as const;

export async function ensureUserDatabaseSchema(database: UserSqliteDatabase) {
  for (const statement of USER_DATABASE_SCHEMA_SQL) {
    await database.execAsync(statement);
  }
}

export async function openExpoUserDatabase(databaseName = USER_DATABASE_NAME): Promise<UserSqliteDatabase> {
  const SQLite = await import('expo-sqlite');
  return SQLite.openDatabaseAsync(databaseName);
}

export async function deleteExpoUserDatabase(databaseName = USER_DATABASE_NAME) {
  const SQLite = await import('expo-sqlite');
  await SQLite.deleteDatabaseAsync(databaseName);
}
