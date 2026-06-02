import type { LibraryState } from './libraryStore';
import { getDefaultFlashcardLearningSettings, normalizeLibraryState } from './libraryStore';
import type { UserProfile } from './profileStore';
import { normalizeProfile } from './profileStore';
import type { ReaderState } from './readerStore';
import { normalizeReaderState } from './readerStore';

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
  cloud_sync_enabled: number;
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
  final_status?: string | null;
  completed_at?: string | null;
  interval: number;
  repetition: number;
  efactor: number;
  due_date: string;
  sync_status: string | null;
  last_synced_at: string | null;
  version: number;
  deleted_at: string | null;
};

export type FlashcardReviewEventRow = {
  id: string;
  flashcard_id: string;
  word_id: string;
  quality: number;
  reviewed_at: string;
  scheduled_due_date_after_review: string;
};

export type FlashcardLearningSettingsRow = {
  id: string;
  completion_min_average_quality: number;
  completion_min_review_count: number;
  updated_at: string;
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
  flashcardLearningSettings: FlashcardLearningSettingsRow;
  flashcardReviewEvents: FlashcardReviewEventRow[];
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
  flashcardReviewEvents: number;
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
    flashcardLearningSettings: serializeFlashcardLearningSettings(snapshot.library, options.migratedAt),
    flashcardReviewEvents: (snapshot.library.flashcardReviewEvents ?? []).map((event) => ({
      id: event.id,
      flashcard_id: event.flashcardId,
      word_id: event.wordId,
      quality: event.quality,
      reviewed_at: event.reviewedAt,
      scheduled_due_date_after_review: event.scheduledDueDateAfterReview,
    })),
    flashcards: snapshot.library.flashcards.map((card) => ({
      id: card.id,
      word_id: card.wordId,
      type: card.type,
      front: card.front,
      back: card.back,
      created_at: card.createdAt,
      review_state: card.reviewState,
      final_status: card.finalStatus,
      completed_at: card.completedAt ?? null,
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
    flashcardReviewEvents: rows.flashcardReviewEvents.length,
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

export function parseUserProfileFromSqliteRow(row: UserProfileRow): UserProfile {
  return normalizeProfile({
    appLockEnabled: Boolean(row.app_lock_enabled),
    cloudSyncEnabled: Boolean(row.cloud_sync_enabled),
    avatarUrl: row.avatar_url,
    dailyGoal: row.daily_goal,
    displayName: row.display_name,
    email: row.email,
    learningGoal: row.learning_goal,
    learningLanguage: row.learning_language as UserProfile['learningLanguage'],
    loginMethod: row.login_method as UserProfile['loginMethod'],
    nativeLanguage: row.native_language as UserProfile['nativeLanguage'],
    notificationPreferences: {
      dailyReminderEnabled: Boolean(row.daily_reminder_enabled),
      reminderTime: row.reminder_time,
      reviewReminderEnabled: Boolean(row.review_reminder_enabled),
      weeklySummaryEnabled: Boolean(row.weekly_summary_enabled),
    },
    phone: row.phone,
    proficiencyLevel: row.proficiency_level as UserProfile['proficiencyLevel'],
    timezone: row.timezone,
    updatedAt: row.updated_at,
    username: row.username,
  });
}

export function parseLibraryStateFromSqliteRows(rows: {
  deletedEntities: DeletedEntityRow[];
  flashcardLearningSettings?: FlashcardLearningSettingsRow | null;
  flashcardReviewEvents?: FlashcardReviewEventRow[];
  flashcards: FlashcardRow[];
  folders: FolderRow[];
  savedWordFolders: SavedWordFolderRow[];
  savedWords: SavedWordRow[];
  searchHistory: SearchHistoryRow[];
}): LibraryState {
  const folderIdsByWordId = rows.savedWordFolders.reduce((acc, row) => {
    const folderIds = acc.get(row.word_id) ?? [];
    folderIds.push(row.folder_id);
    acc.set(row.word_id, folderIds);
    return acc;
  }, new Map<string, string[]>());

  return normalizeLibraryState({
    deletedFolderIds: rows.deletedEntities
      .filter((row) => row.entity_type === 'folder')
      .map((row) => row.entity_id),
    flashcards: rows.flashcards
      .filter((row) => !row.deleted_at || row.sync_status === 'pending_delete')
      .map((row) => ({
        back: row.back,
        createdAt: row.created_at,
        dueDate: row.due_date,
        efactor: row.efactor,
        front: row.front,
        id: row.id,
        completedAt: row.completed_at,
        finalStatus: (row.final_status || undefined) as LibraryState['flashcards'][number]['finalStatus'],
        interval: row.interval,
        lastSyncedAt: row.last_synced_at,
        repetition: row.repetition,
        reviewState: row.review_state as LibraryState['flashcards'][number]['reviewState'],
        syncStatus: row.sync_status as LibraryState['flashcards'][number]['syncStatus'],
        type: row.type as LibraryState['flashcards'][number]['type'],
        version: row.version,
        wordId: row.word_id,
      })),
    flashcardLearningSettings: rows.flashcardLearningSettings
      ? {
          completionMinAverageQuality: rows.flashcardLearningSettings.completion_min_average_quality,
          completionMinReviewCount: rows.flashcardLearningSettings.completion_min_review_count,
        }
      : getDefaultFlashcardLearningSettings(),
    flashcardReviewEvents: (rows.flashcardReviewEvents ?? []).map((row) => ({
      id: row.id,
      flashcardId: row.flashcard_id,
      wordId: row.word_id,
      quality: row.quality,
      reviewedAt: row.reviewed_at,
      scheduledDueDateAfterReview: row.scheduled_due_date_after_review,
    })),
    folders: rows.folders
      .filter((row) => !row.deleted_at)
      .map((row) => ({
        avatarUri: row.avatar_uri,
        color: row.color,
        colorNote: row.color_note,
        createdAt: row.created_at,
        id: row.id,
        isFavorite: Boolean(row.is_favorite),
        name: row.name,
        tags: parseJsonStringArray(row.tags_json),
        updatedAt: row.updated_at,
      })),
    savedWords: rows.savedWords
      .filter((row) => !row.deleted_at)
      .map((row) => ({
        audio: row.audio,
        createdAt: row.created_at,
        definition: row.definition,
        folderIds: Array.from(new Set(folderIdsByWordId.get(row.id) ?? [])),
        id: row.id,
        ipa: row.ipa,
        note: row.note,
        source: row.source,
        tags: parseJsonStringArray(row.tags_json),
        updatedAt: row.updated_at,
        word: row.word,
      })),
    searchHistory: rows.searchHistory.map((row) => ({
      lookedUpAt: row.looked_up_at,
      word: row.word,
    })),
  });
}

export function parseReaderStateFromSqliteRows(rows: {
  documents: ReaderDocumentRow[];
  settings: ReaderSettingsRow | null;
}): ReaderState {
  return normalizeReaderState({
    documents: rows.documents
      .filter((row) => !row.deleted_at)
      .map((row) => ({
        content: row.content,
        createdAt: row.created_at,
        id: row.id,
        sourceFormat: row.source_format as ReaderState['documents'][number]['sourceFormat'],
        title: row.title,
        updatedAt: row.updated_at,
      })),
    selectedDocumentId: rows.settings?.selected_document_id ?? '',
    settings: rows.settings
      ? {
          backgroundColor: rows.settings.background_color as ReaderState['settings']['backgroundColor'],
          fontFamily: rows.settings.font_family as ReaderState['settings']['fontFamily'],
          fontSize: rows.settings.font_size,
        }
      : undefined,
  });
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
    cloud_sync_enabled: profile.cloudSyncEnabled ? 1 : 0,
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

function serializeFlashcardLearningSettings(library: LibraryState, migratedAt: string): FlashcardLearningSettingsRow {
  const settings = library.flashcardLearningSettings ?? getDefaultFlashcardLearningSettings();

  return {
    id: 'local-flashcard-learning-settings',
    completion_min_average_quality: settings.completionMinAverageQuality,
    completion_min_review_count: settings.completionMinReviewCount,
    updated_at: migratedAt,
  };
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

function parseJsonStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}
