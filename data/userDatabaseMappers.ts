import type { LibraryState } from './libraryStore';
import type { UserProfile } from './profileStore';
import type { ReaderState } from './readerStore';

export const USER_PROFILE_ROW_ID = 'local-profile';
export const READER_SETTINGS_ROW_ID = 'local-reader-settings';

export type UserDataSnapshot = {
  library: LibraryState;
  profile: UserProfile;
  reader: ReaderState;
};

export type UserDatabaseMetaRow = {
  key: string;
  value: string;
};

export type UserProfileRow = {
  id: string;
  display_name: string;
  email: string;
  username: string;
  phone: string;
  avatar_url: string;
  login_method: string;
  native_language: string;
  learning_language: string;
  proficiency_level: string;
  learning_goal: string;
  timezone: string;
  daily_goal: string;
  app_lock_enabled: number;
  daily_reminder_enabled: number;
  review_reminder_enabled: number;
  weekly_summary_enabled: number;
  reminder_time: string;
  updated_at: string;
};

export type FolderRow = {
  id: string;
  name: string;
  color: string;
  color_note: string;
  tags_json: string;
  avatar_uri: string;
  is_favorite: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SavedWordRow = {
  id: string;
  word: string;
  ipa: string;
  definition: string;
  audio: string;
  note: string;
  tags_json: string;
  source: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SavedWordFolderRow = {
  word_id: string;
  folder_id: string;
  created_at: string;
};

export type SearchHistoryRow = {
  id: string;
  word: string;
  normalized_word: string;
  looked_up_at: string;
};

export type FlashcardRow = {
  id: string;
  word_id: string;
  type: string;
  front: string;
  back: string;
  created_at: string;
  review_state: string;
  interval: number;
  repetition: number;
  efactor: number;
  due_date: string;
  sync_status: string | null;
  last_synced_at: string | null;
  version: number;
  deleted_at: string | null;
};

export type DeletedEntityRow = {
  entity_type: string;
  entity_id: string;
  deleted_at: string;
};

export type ReaderDocumentRow = {
  id: string;
  title: string;
  content: string;
  source_format: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ReaderSettingsRow = {
  id: string;
  selected_document_id: string | null;
  font_size: number;
  font_family: string;
  background_color: string;
  updated_at: string;
};

export type SerializedUserDatabaseRows = {
  deletedEntities: DeletedEntityRow[];
  flashcards: FlashcardRow[];
  folders: FolderRow[];
  meta: UserDatabaseMetaRow[];
  profile: UserProfileRow;
  readerDocuments: ReaderDocumentRow[];
  readerSettings: ReaderSettingsRow;
  savedWordFolders: SavedWordFolderRow[];
  savedWords: SavedWordRow[];
  searchHistory: SearchHistoryRow[];
};

export type UserDatabaseParityCounts = {
  deletedEntities: number;
  flashcards: number;
  folders: number;
  profile: number;
  readerDocuments: number;
  readerSettings: number;
  savedWordFolders: number;
  savedWords: number;
  searchHistory: number;
};

export function serializeUserDataForSqlite(
  snapshot: UserDataSnapshot,
  options: { migratedAt: string; schemaVersion: number }
): SerializedUserDatabaseRows {
  return {
    deletedEntities: serializeDeletedEntities(snapshot.library, options.migratedAt),
    flashcards: snapshot.library.flashcards.map((card) => ({
      id: card.id,
      word_id: card.wordId,
      type: card.type,
      front: card.front,
      back: card.back,
      created_at: card.createdAt,
      review_state: card.reviewState,
      interval: card.interval,
      repetition: card.repetition,
      efactor: card.efactor,
      due_date: card.dueDate,
      sync_status: card.syncStatus ?? null,
      last_synced_at: card.lastSyncedAt ?? null,
      version: card.version ?? 1,
      deleted_at: card.syncStatus === 'pending_delete' ? options.migratedAt : null,
    })),
    folders: snapshot.library.folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      color: folder.color,
      color_note: folder.colorNote ?? '',
      tags_json: JSON.stringify(folder.tags ?? []),
      avatar_uri: folder.avatarUri ?? '',
      is_favorite: folder.isFavorite ? 1 : 0,
      created_at: folder.createdAt,
      updated_at: folder.updatedAt,
      deleted_at: null,
    })),
    meta: [
      { key: 'schema_version', value: String(options.schemaVersion) },
      { key: 'migrated_at', value: options.migratedAt },
    ],
    profile: serializeProfile(snapshot.profile),
    readerDocuments: snapshot.reader.documents.map((document) => ({
      id: document.id,
      title: document.title,
      content: document.content,
      source_format: document.sourceFormat ?? null,
      created_at: document.createdAt,
      updated_at: document.updatedAt,
      deleted_at: null,
    })),
    readerSettings: serializeReaderSettings(snapshot.reader, options.migratedAt),
    savedWordFolders: snapshot.library.savedWords.flatMap((word) =>
      Array.from(new Set(word.folderIds)).map((folderId) => ({
        word_id: word.id,
        folder_id: folderId,
        created_at: word.createdAt,
      }))
    ),
    savedWords: snapshot.library.savedWords.map((word) => ({
      id: word.id,
      word: word.word,
      ipa: word.ipa,
      definition: word.definition,
      audio: word.audio,
      note: word.note,
      tags_json: JSON.stringify(word.tags ?? []),
      source: word.source,
      created_at: word.createdAt,
      updated_at: word.updatedAt,
      deleted_at: null,
    })),
    searchHistory: snapshot.library.searchHistory.map((item) => {
      const normalizedWord = normalizeLookupWord(item.word);

      return {
        id: `search-${normalizedWord}-${item.lookedUpAt}`,
        word: item.word,
        normalized_word: normalizedWord,
        looked_up_at: item.lookedUpAt,
      };
    }),
  };
}

export function getUserDatabaseParityCounts(rows: SerializedUserDatabaseRows): UserDatabaseParityCounts {
  return {
    deletedEntities: rows.deletedEntities.length,
    flashcards: rows.flashcards.length,
    folders: rows.folders.length,
    profile: rows.profile ? 1 : 0,
    readerDocuments: rows.readerDocuments.length,
    readerSettings: rows.readerSettings ? 1 : 0,
    savedWordFolders: rows.savedWordFolders.length,
    savedWords: rows.savedWords.length,
    searchHistory: rows.searchHistory.length,
  };
}

function serializeProfile(profile: UserProfile): UserProfileRow {
  return {
    id: USER_PROFILE_ROW_ID,
    display_name: profile.displayName,
    email: profile.email,
    username: profile.username,
    phone: profile.phone,
    avatar_url: profile.avatarUrl,
    login_method: profile.loginMethod,
    native_language: profile.nativeLanguage,
    learning_language: profile.learningLanguage,
    proficiency_level: profile.proficiencyLevel,
    learning_goal: profile.learningGoal,
    timezone: profile.timezone,
    daily_goal: profile.dailyGoal,
    app_lock_enabled: profile.appLockEnabled ? 1 : 0,
    daily_reminder_enabled: profile.notificationPreferences.dailyReminderEnabled ? 1 : 0,
    review_reminder_enabled: profile.notificationPreferences.reviewReminderEnabled ? 1 : 0,
    weekly_summary_enabled: profile.notificationPreferences.weeklySummaryEnabled ? 1 : 0,
    reminder_time: profile.notificationPreferences.reminderTime,
    updated_at: profile.updatedAt,
  };
}

function serializeDeletedEntities(library: LibraryState, migratedAt: string): DeletedEntityRow[] {
  return library.deletedFolderIds.map((folderId) => ({
    entity_type: 'folder',
    entity_id: folderId,
    deleted_at: migratedAt,
  }));
}

function serializeReaderSettings(reader: ReaderState, migratedAt: string): ReaderSettingsRow {
  const selectedDocumentId = reader.documents.some((document) => document.id === reader.selectedDocumentId)
    ? reader.selectedDocumentId
    : reader.documents[0]?.id ?? null;

  return {
    id: READER_SETTINGS_ROW_ID,
    selected_document_id: selectedDocumentId || null,
    font_size: reader.settings.fontSize,
    font_family: reader.settings.fontFamily,
    background_color: reader.settings.backgroundColor,
    updated_at: migratedAt,
  };
}

function normalizeLookupWord(word: string) {
  return word.trim().toLocaleLowerCase();
}
