import { getDefaultLibraryState } from './libraryStore';
import type { LibraryState } from './libraryStore';
import { getDefaultProfile } from './profileStore';
import type { UserProfile } from './profileStore';
import { getDefaultReaderState } from './readerStore';
import type { ReaderState } from './readerStore';
import { migrateAsyncStorageToUserDatabase, replaceUserDatabaseRows } from './userDatabaseMigration';
import {
  parseLibraryStateFromSqliteRows,
  parseReaderStateFromSqliteRows,
  parseUserProfileFromSqliteRow,
  serializeUserDataForSqlite,
  type DeletedEntityRow,
  type FlashcardLearningSettingsRow,
  type FlashcardReviewEventRow,
  type FlashcardRow,
  type FolderRow,
  type ReaderDocumentRow,
  type ReaderSettingsRow,
  type SavedWordFolderRow,
  type SavedWordRow,
  type SearchHistoryRow,
  type UserProfileRow,
} from './userDatabaseMappers';
import {
  ensureUserDatabaseSchema,
  openExpoUserDatabase,
  USER_DATABASE_NAME,
  USER_DATABASE_SCHEMA_VERSION,
  type OpenUserSqliteDatabase,
  type UserSqliteBindParams,
  type UserSqliteDatabase,
} from './userDatabaseSchema';

export type UserDatabaseRuntimeOptions = {
  databaseName?: string;
  now?: () => string;
  openDatabase?: OpenUserSqliteDatabase;
};

type UserDataSnapshot = {
  library: LibraryState;
  profile: UserProfile;
  reader: ReaderState;
};

const SELECT_PROFILE_SQL = 'SELECT * FROM user_profile WHERE id = ? LIMIT 1';
const SELECT_META_SQL = 'SELECT value FROM user_database_meta WHERE key = ? LIMIT 1';
const SELECT_FOLDERS_SQL = 'SELECT * FROM folders ORDER BY created_at DESC';
const SELECT_SAVED_WORDS_SQL = 'SELECT * FROM saved_words ORDER BY created_at DESC';
const SELECT_SAVED_WORD_FOLDERS_SQL = 'SELECT * FROM saved_word_folders ORDER BY word_id, folder_id';
const SELECT_SEARCH_HISTORY_SQL = 'SELECT * FROM search_history ORDER BY looked_up_at DESC';
const SELECT_FLASHCARDS_SQL = 'SELECT * FROM flashcards ORDER BY created_at DESC';
const SELECT_FLASHCARD_REVIEW_EVENTS_SQL = 'SELECT * FROM flashcard_review_events ORDER BY reviewed_at DESC';
const SELECT_FLASHCARD_LEARNING_SETTINGS_SQL = 'SELECT * FROM flashcard_learning_settings WHERE id = ? LIMIT 1';
const SELECT_DELETED_ENTITIES_SQL = 'SELECT * FROM deleted_entities ORDER BY deleted_at DESC';
const SELECT_READER_DOCUMENTS_SQL = 'SELECT * FROM reader_documents ORDER BY updated_at DESC';
const SELECT_READER_SETTINGS_SQL = 'SELECT * FROM reader_settings WHERE id = ? LIMIT 1';

let runtimeOptions: UserDatabaseRuntimeOptions = {};

export function configureUserDatabaseRuntime(options: UserDatabaseRuntimeOptions = {}) {
  runtimeOptions = options;

  return () => {
    runtimeOptions = {};
  };
}

export async function loadUserProfileFromUserDatabase(options: UserDatabaseRuntimeOptions = {}) {
  return (await loadUserDataSnapshotFromUserDatabase(options)).profile;
}

export async function saveUserProfileToUserDatabase(profile: UserProfile, options: UserDatabaseRuntimeOptions = {}) {
  const snapshot = await loadUserDataSnapshotFromUserDatabase(options);
  await saveUserDataSnapshotToUserDatabase({ ...snapshot, profile }, options);
}

export async function clearUserProfileFromUserDatabase(options: UserDatabaseRuntimeOptions = {}) {
  const snapshot = await loadUserDataSnapshotFromUserDatabase(options);
  await saveUserDataSnapshotToUserDatabase({ ...snapshot, profile: getDefaultProfile() }, options);
}

export async function loadLibraryStateFromUserDatabase(options: UserDatabaseRuntimeOptions = {}) {
  return (await loadUserDataSnapshotFromUserDatabase(options)).library;
}

export async function saveLibraryStateToUserDatabase(library: LibraryState, options: UserDatabaseRuntimeOptions = {}) {
  const snapshot = await loadUserDataSnapshotFromUserDatabase(options);
  await saveUserDataSnapshotToUserDatabase({ ...snapshot, library }, options);
}

export async function clearLibraryStateFromUserDatabase(options: UserDatabaseRuntimeOptions = {}) {
  const snapshot = await loadUserDataSnapshotFromUserDatabase(options);
  await saveUserDataSnapshotToUserDatabase({ ...snapshot, library: getDefaultLibraryState() }, options);
}

export async function loadReaderStateFromUserDatabase(options: UserDatabaseRuntimeOptions = {}) {
  return (await loadUserDataSnapshotFromUserDatabase(options)).reader;
}

export async function saveReaderStateToUserDatabase(reader: ReaderState, options: UserDatabaseRuntimeOptions = {}) {
  const snapshot = await loadUserDataSnapshotFromUserDatabase(options);
  await saveUserDataSnapshotToUserDatabase({ ...snapshot, reader }, options);
}

export async function clearReaderStateFromUserDatabase(options: UserDatabaseRuntimeOptions = {}) {
  const snapshot = await loadUserDataSnapshotFromUserDatabase(options);
  await saveUserDataSnapshotToUserDatabase({ ...snapshot, reader: getDefaultReaderState() }, options);
}

export async function loadUserDataSnapshotFromUserDatabase(options: UserDatabaseRuntimeOptions = {}): Promise<UserDataSnapshot> {
  const {
    databaseName = USER_DATABASE_NAME,
    openDatabase = openExpoUserDatabase,
  } = resolveRuntimeOptions(options);

  await ensureUserDatabaseMigrated({ databaseName, openDatabase });

  const database = await openDatabase(databaseName);
  try {
    const [
      profileRow,
      folders,
      savedWords,
      savedWordFolders,
      searchHistory,
      flashcards,
      flashcardReviewEvents,
      flashcardLearningSettings,
      deletedEntities,
      documents,
      settings,
    ] =
      await Promise.all([
        getFirstRequired<UserProfileRow>(database, SELECT_PROFILE_SQL, 'local-profile'),
        getAllRequired<FolderRow>(database, SELECT_FOLDERS_SQL),
        getAllRequired<SavedWordRow>(database, SELECT_SAVED_WORDS_SQL),
        getAllRequired<SavedWordFolderRow>(database, SELECT_SAVED_WORD_FOLDERS_SQL),
        getAllRequired<SearchHistoryRow>(database, SELECT_SEARCH_HISTORY_SQL),
        getAllRequired<FlashcardRow>(database, SELECT_FLASHCARDS_SQL),
        getAllRequired<FlashcardReviewEventRow>(database, SELECT_FLASHCARD_REVIEW_EVENTS_SQL),
        getFirstRequired<FlashcardLearningSettingsRow>(
          database,
          SELECT_FLASHCARD_LEARNING_SETTINGS_SQL,
          'local-flashcard-learning-settings'
        ),
        getAllRequired<DeletedEntityRow>(database, SELECT_DELETED_ENTITIES_SQL),
        getAllRequired<ReaderDocumentRow>(database, SELECT_READER_DOCUMENTS_SQL),
        getFirstRequired<ReaderSettingsRow>(database, SELECT_READER_SETTINGS_SQL, 'local-reader-settings'),
      ]);

    return {
      library: parseLibraryStateFromSqliteRows({
        deletedEntities,
        flashcardLearningSettings,
        flashcardReviewEvents,
        flashcards,
        folders,
        savedWordFolders,
        savedWords,
        searchHistory,
      }),
      profile: profileRow ? parseUserProfileFromSqliteRow(profileRow) : getDefaultProfile(),
      reader: parseReaderStateFromSqliteRows({ documents, settings }),
    };
  } finally {
    await database.closeAsync?.();
  }
}

export async function saveUserDataSnapshotToUserDatabase(
  snapshot: UserDataSnapshot,
  options: UserDatabaseRuntimeOptions = {}
) {
  const {
    databaseName = USER_DATABASE_NAME,
    now = () => new Date().toISOString(),
    openDatabase = openExpoUserDatabase,
  } = resolveRuntimeOptions(options);

  await ensureUserDatabaseMigrated({ databaseName, openDatabase });

  const database = await openDatabase(databaseName);
  try {
    const rows = serializeUserDataForSqlite(snapshot, {
      migratedAt: now(),
      schemaVersion: USER_DATABASE_SCHEMA_VERSION,
    });

    await ensureUserDatabaseSchema(database);
    await database.withTransactionAsync(async () => {
      await replaceUserDatabaseRows(database, rows);
    });
  } finally {
    await database.closeAsync?.();
  }
}

async function ensureUserDatabaseMigrated({
  databaseName,
  openDatabase,
}: Pick<UserDatabaseRuntimeOptions, 'databaseName' | 'openDatabase'> = {}) {
  ({
    databaseName = USER_DATABASE_NAME,
    openDatabase = openExpoUserDatabase,
  } = resolveRuntimeOptions({ databaseName, openDatabase }));

  const database = await openDatabase(databaseName);
  try {
    await ensureUserDatabaseSchema(database);
    const meta = await getFirstRequired<{ value: string }>(database, SELECT_META_SQL, 'schema_version');
    if (meta?.value === String(USER_DATABASE_SCHEMA_VERSION)) return;
  } finally {
    await database.closeAsync?.();
  }

  await migrateAsyncStorageToUserDatabase({ databaseName, openDatabase });
}

function resolveRuntimeOptions(options: UserDatabaseRuntimeOptions): UserDatabaseRuntimeOptions {
  return {
    ...runtimeOptions,
    ...options,
  };
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
