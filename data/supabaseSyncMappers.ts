import type {
  DeletedEntityRow,
  FlashcardRow,
  FolderRow,
  ReaderDocumentRow,
  ReaderSettingsRow,
  SavedWordFolderRow,
  SavedWordRow,
  SearchHistoryRow,
  UserProfileRow,
} from './userDatabaseMappers';

const REMOTE_USER_PROFILE_ROW_ID = 'local-profile';
const REMOTE_READER_SETTINGS_ROW_ID = 'local-reader-settings';

export type SupabaseSyncOwner = {
  userId: string;
};

export type RemoteUserProfileRow = {
  user_id: string;
  local_profile_id: string;
  display_name: string;
  email: string;
  username: string;
  phone: string;
  avatar_url: string;
  native_language: string;
  learning_language: string;
  proficiency_level: string;
  learning_goal: string;
  timezone: string;
  daily_goal: string;
  notification_preferences: {
    dailyReminderEnabled: boolean;
    reminderTime: string;
    reviewReminderEnabled: boolean;
    weeklySummaryEnabled: boolean;
  };
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
};

export type RemoteLibraryFolderRow = {
  user_id: string;
  id: string;
  name: string;
  color: string;
  color_note: string;
  tags: string[];
  avatar_uri: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
};

export type RemoteSavedWordRow = {
  user_id: string;
  id: string;
  word: string;
  ipa: string;
  definition: string;
  audio: string;
  note: string;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
};

export type RemoteSavedWordFolderRow = {
  user_id: string;
  word_id: string;
  folder_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
};

export type RemoteSearchHistoryRow = {
  user_id: string;
  id: string;
  word: string;
  normalized_word: string;
  looked_up_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
};

export type RemoteFlashcardRow = {
  user_id: string;
  id: string;
  word_id: string;
  type: string;
  front: string;
  back: string;
  review_state: string;
  interval: number;
  repetition: number;
  efactor: number;
  due_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
};

export type RemoteDeletedEntityRow = {
  user_id: string;
  entity_type: string;
  entity_id: string;
  deleted_at: string;
  created_at: string;
  updated_at: string;
  version: number;
};

export type RemoteReaderDocumentRow = {
  user_id: string;
  id: string;
  title: string;
  content: string;
  source_format: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
};

export type RemoteReaderSettingsRow = {
  user_id: string;
  local_settings_id: string;
  selected_document_id: string | null;
  font_size: number;
  font_family: string;
  background_color: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
};

export function mapUserProfileToRemote(row: UserProfileRow, { userId }: SupabaseSyncOwner): RemoteUserProfileRow {
  return {
    user_id: userId,
    local_profile_id: row.id,
    display_name: row.display_name,
    email: row.email,
    username: row.username,
    phone: row.phone,
    avatar_url: row.avatar_url,
    native_language: row.native_language,
    learning_language: row.learning_language,
    proficiency_level: row.proficiency_level,
    learning_goal: row.learning_goal,
    timezone: row.timezone,
    daily_goal: row.daily_goal,
    notification_preferences: {
      dailyReminderEnabled: Boolean(row.daily_reminder_enabled),
      reminderTime: row.reminder_time,
      reviewReminderEnabled: Boolean(row.review_reminder_enabled),
      weeklySummaryEnabled: Boolean(row.weekly_summary_enabled),
    },
    created_at: row.updated_at,
    updated_at: row.updated_at,
    deleted_at: null,
    version: 1,
  };
}

export function mapUserProfileFromRemote(row: RemoteUserProfileRow): UserProfileRow {
  return {
    id: row.local_profile_id || REMOTE_USER_PROFILE_ROW_ID,
    display_name: row.display_name,
    email: row.email,
    username: row.username,
    phone: row.phone,
    avatar_url: row.avatar_url,
    login_method: 'email',
    native_language: row.native_language,
    learning_language: row.learning_language,
    proficiency_level: row.proficiency_level,
    learning_goal: row.learning_goal,
    timezone: row.timezone,
    daily_goal: row.daily_goal,
    app_lock_enabled: 0,
    daily_reminder_enabled: row.notification_preferences.dailyReminderEnabled ? 1 : 0,
    review_reminder_enabled: row.notification_preferences.reviewReminderEnabled ? 1 : 0,
    weekly_summary_enabled: row.notification_preferences.weeklySummaryEnabled ? 1 : 0,
    reminder_time: row.notification_preferences.reminderTime,
    updated_at: row.updated_at,
  };
}

export function mapFolderToRemote(row: FolderRow, { userId }: SupabaseSyncOwner): RemoteLibraryFolderRow {
  return {
    user_id: userId,
    id: row.id,
    name: row.name,
    color: row.color,
    color_note: row.color_note,
    tags: parseJsonStringArray(row.tags_json),
    avatar_uri: row.avatar_uri,
    is_favorite: Boolean(row.is_favorite),
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    version: 1,
  };
}

export function mapFolderFromRemote(row: RemoteLibraryFolderRow): FolderRow {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    color_note: row.color_note,
    tags_json: JSON.stringify(row.tags),
    avatar_uri: row.avatar_uri,
    is_favorite: row.is_favorite ? 1 : 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}

export function mapSavedWordToRemote(row: SavedWordRow, { userId }: SupabaseSyncOwner): RemoteSavedWordRow {
  return {
    user_id: userId,
    id: row.id,
    word: row.word,
    ipa: row.ipa,
    definition: row.definition,
    audio: row.audio,
    note: row.note,
    tags: parseJsonStringArray(row.tags_json),
    source: row.source,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    version: 1,
  };
}

export function mapSavedWordFromRemote(row: RemoteSavedWordRow): SavedWordRow {
  return {
    id: row.id,
    word: row.word,
    ipa: row.ipa,
    definition: row.definition,
    audio: row.audio,
    note: row.note,
    tags_json: JSON.stringify(row.tags),
    source: row.source,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}

export function mapSavedWordFolderToRemote(
  row: SavedWordFolderRow,
  { userId }: SupabaseSyncOwner
): RemoteSavedWordFolderRow {
  return {
    user_id: userId,
    word_id: row.word_id,
    folder_id: row.folder_id,
    created_at: row.created_at,
    updated_at: row.created_at,
    deleted_at: null,
    version: 1,
  };
}

export function mapSavedWordFolderFromRemote(row: RemoteSavedWordFolderRow): SavedWordFolderRow {
  return {
    word_id: row.word_id,
    folder_id: row.folder_id,
    created_at: row.created_at,
  };
}

export function mapSearchHistoryToRemote(row: SearchHistoryRow, { userId }: SupabaseSyncOwner): RemoteSearchHistoryRow {
  return {
    user_id: userId,
    id: row.id,
    word: row.word,
    normalized_word: row.normalized_word,
    looked_up_at: row.looked_up_at,
    created_at: row.looked_up_at,
    updated_at: row.looked_up_at,
    deleted_at: null,
    version: 1,
  };
}

export function mapSearchHistoryFromRemote(row: RemoteSearchHistoryRow): SearchHistoryRow {
  return {
    id: row.id,
    word: row.word,
    normalized_word: row.normalized_word,
    looked_up_at: row.looked_up_at,
  };
}

export function mapFlashcardToRemote(row: FlashcardRow, { userId }: SupabaseSyncOwner): RemoteFlashcardRow {
  return {
    user_id: userId,
    id: row.id,
    word_id: row.word_id,
    type: row.type,
    front: row.front,
    back: row.back,
    review_state: row.review_state,
    interval: row.interval,
    repetition: row.repetition,
    efactor: row.efactor,
    due_date: row.due_date,
    created_at: row.created_at,
    updated_at: row.last_synced_at ?? row.created_at,
    deleted_at: row.deleted_at,
    version: row.version,
  };
}

export function mapFlashcardFromRemote(row: RemoteFlashcardRow): FlashcardRow {
  return {
    id: row.id,
    word_id: row.word_id,
    type: row.type,
    front: row.front,
    back: row.back,
    created_at: row.created_at,
    review_state: row.review_state,
    interval: row.interval,
    repetition: row.repetition,
    efactor: row.efactor,
    due_date: row.due_date,
    sync_status: row.deleted_at ? 'pending_delete' : 'synced',
    last_synced_at: row.updated_at,
    version: row.version,
    deleted_at: row.deleted_at,
  };
}

export function mapDeletedEntityToRemote(row: DeletedEntityRow, { userId }: SupabaseSyncOwner): RemoteDeletedEntityRow {
  return {
    user_id: userId,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    deleted_at: row.deleted_at,
    created_at: row.deleted_at,
    updated_at: row.deleted_at,
    version: 1,
  };
}

export function mapDeletedEntityFromRemote(row: RemoteDeletedEntityRow): DeletedEntityRow {
  return {
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    deleted_at: row.deleted_at,
  };
}

export function mapReaderDocumentToRemote(
  row: ReaderDocumentRow,
  { userId }: SupabaseSyncOwner
): RemoteReaderDocumentRow {
  return {
    user_id: userId,
    id: row.id,
    title: row.title,
    content: row.content,
    source_format: row.source_format,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    version: 1,
  };
}

export function mapReaderDocumentFromRemote(row: RemoteReaderDocumentRow): ReaderDocumentRow {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    source_format: row.source_format,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}

export function mapReaderSettingsToRemote(
  row: ReaderSettingsRow,
  { userId }: SupabaseSyncOwner
): RemoteReaderSettingsRow {
  return {
    user_id: userId,
    local_settings_id: row.id,
    selected_document_id: row.selected_document_id,
    font_size: row.font_size,
    font_family: row.font_family,
    background_color: row.background_color,
    created_at: row.updated_at,
    updated_at: row.updated_at,
    deleted_at: null,
    version: 1,
  };
}

export function mapReaderSettingsFromRemote(row: RemoteReaderSettingsRow): ReaderSettingsRow {
  return {
    id: row.local_settings_id || REMOTE_READER_SETTINGS_ROW_ID,
    selected_document_id: row.selected_document_id,
    font_size: row.font_size,
    font_family: row.font_family,
    background_color: row.background_color,
    updated_at: row.updated_at,
  };
}

function parseJsonStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}
