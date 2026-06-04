const writtenFiles = vi.hoisted(() => [] as string[]);

vi.mock('expo-file-system', () => ({
  File: class {
    uri = 'file://backup.json';

    create() {}

    write(value: string) {
      writtenFiles.push(value);
    }
  },
  Paths: { document: '' },
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(false),
  shareAsync: vi.fn(),
}));

const storage = vi.hoisted(() => new Map<string, string>());

const storageMock = vi.hoisted(() => ({
  getStoredItem: vi.fn(async (key: string) => storage.get(key) ?? null),
  removeStoredItem: vi.fn(async (key: string) => {
    storage.delete(key);
  }),
  setStoredItem: vi.fn(async (key: string, value: string) => {
    storage.set(key, value);
  }),
}));

vi.mock('@/data/storageAdapter', () => storageMock);
vi.mock('../data/storageAdapter', () => storageMock);

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DictionaryEntry } from '../data/dictionary';
import { exportAllLocalData } from '../data/exportAllData';
import type { LibraryState } from '../data/libraryStore';
import {
  addSearchHistory,
  clearLibraryState,
  createFlashcardsFromWordIds,
  createFolder,
  getDefaultLibraryState,
  loadLibraryState,
  saveWordToFolder,
} from '../data/libraryStore';
import {
  getDefaultOfflinePackInstallState,
  loadOfflinePackInstallState,
  markOfflinePackReady,
} from '../data/offlineDictionaryPackStore';
import { offlineDictionaryPacks } from '../data/offlineDictionaryPacks';
import type { UserProfile } from '../data/profileStore';
import { clearUserProfile, loadUserProfile, saveUserProfile } from '../data/profileStore';
import type { ReaderState } from '../data/readerStore';
import {
  clearReaderState,
  importReaderText,
  loadReaderState,
  selectReaderDocument,
  updateReaderSettings,
} from '../data/readerStore';
import {
  configureUserDatabaseRuntime,
  loadLibraryStateFromUserDatabase,
  loadReaderStateFromUserDatabase,
  loadUserProfileFromUserDatabase,
  saveLibraryStateToUserDatabase,
} from '../data/userDatabaseRuntime';
import type { UserSqliteBindParams, UserSqliteDatabase } from '../data/userDatabaseSchema';

const timestamp = '2026-05-25T12:00:00.000Z';

describe('userDatabaseRuntime', () => {
  let resetRuntimeOptions: (() => void) | null = null;

  beforeEach(() => {
    resetRuntimeOptions?.();
    resetRuntimeOptions = null;
    storage.clear();
    writtenFiles.splice(0, writtenFiles.length);
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetRuntimeOptions?.();
    resetRuntimeOptions = null;
  });

  it('runs the AsyncStorage migration on first read and parses all store states from SQLite rows', async () => {
    const harness = createFakeUserDatabaseHarness();
    seedAsyncStorage();

    const profile = await loadUserProfileFromUserDatabase({ openDatabase: harness.openDatabase });
    const library = await loadLibraryStateFromUserDatabase({ openDatabase: harness.openDatabase });
    const reader = await loadReaderStateFromUserDatabase({ openDatabase: harness.openDatabase });

    expect(profile.displayName).toBe('Runtime Profile');
    expect(profile.notificationPreferences.reminderTime).toBe('06:45');
    expect(library.savedWords[0]).toMatchObject({
      folderIds: ['folder-runtime', 'favorites'],
      id: 'word-runtime',
      tags: ['runtime'],
    });
    expect(library.flashcards[0]).toMatchObject({
      id: 'card-runtime',
      lastSyncedAt: timestamp,
      syncStatus: 'pending_update',
      version: 2,
    });
    expect(library.deletedFolderIds).toEqual(['folder-deleted']);
    expect(reader.selectedDocumentId).toBe('reader-runtime');
    expect(reader.settings.fontFamily).toBe('mono');

    const database = harness.requireDatabase('dictionary-mobile-user.sqlite');
    expect(database.transactionCount).toBe(1);
    expect(storageMock.getStoredItem).toHaveBeenCalledWith('dictionary-mobile.profile.v1');
  });

  it('persists library changes through the SQLite runtime adapter without duplicating relations', async () => {
    const harness = createFakeUserDatabaseHarness();
    seedAsyncStorage();

    await loadLibraryStateFromUserDatabase({ openDatabase: harness.openDatabase });

    const nextLibrary: LibraryState = {
      ...fixtureLibrary,
      savedWords: [
        {
          ...fixtureLibrary.savedWords[0],
          folderIds: ['folder-runtime', 'folder-runtime', 'favorites'],
          note: 'updated note',
        },
      ],
      searchHistory: [{ word: 'updated', lookedUpAt: '2026-05-25T13:00:00.000Z' }],
    };

    await saveLibraryStateToUserDatabase(nextLibrary, {
      now: () => '2026-05-25T13:30:00.000Z',
      openDatabase: harness.openDatabase,
    });

    const reloaded = await loadLibraryStateFromUserDatabase({ openDatabase: harness.openDatabase });

    expect(reloaded.savedWords).toHaveLength(1);
    expect(reloaded.savedWords[0]).toMatchObject({
      folderIds: ['folder-runtime', 'favorites'],
      note: 'updated note',
    });
    expect(reloaded.searchHistory).toEqual([{ word: 'updated', lookedUpAt: '2026-05-25T13:00:00.000Z' }]);
    expect(harness.requireDatabase('dictionary-mobile-user.sqlite').rows.saved_word_folders).toHaveLength(2);
  });

  it('smokes Profile save/load through SQLite and keeps the AsyncStorage export backup readable', async () => {
    const harness = createFakeUserDatabaseHarness();
    seedAsyncStorage();
    resetRuntimeOptions = configureUserDatabaseRuntime({
      now: () => '2026-05-25T14:00:00.000Z',
      openDatabase: harness.openDatabase,
    });

    const savedProfile = await saveUserProfile({
      ...fixtureProfile,
      displayName: 'SQLite Profile',
      notificationPreferences: {
        dailyReminderEnabled: false,
        reminderTime: '08:15',
        reviewReminderEnabled: true,
        weeklySummaryEnabled: false,
      },
    });
    storage.set('dictionary-mobile.profile.v1', JSON.stringify({ ...fixtureProfile, displayName: 'Stale backup' }));

    const reloadedProfile = await loadUserProfile();

    expect(savedProfile.displayName).toBe('SQLite Profile');
    expect(reloadedProfile).toMatchObject({
      displayName: 'SQLite Profile',
      notificationPreferences: expect.objectContaining({ reminderTime: '08:15' }),
    });

    await saveUserProfile(savedProfile);
    const exportResult = await exportAllLocalData();
    const exportedPayload = JSON.parse(writtenFiles.at(-1) ?? '{}');

    expect(exportResult.ok).toBe(true);
    expect(exportedPayload.profile.displayName).toBe('SQLite Profile');
    expect(exportedPayload.library).not.toBeUndefined();
    expect(exportedPayload.reader).not.toBeUndefined();
  });

  it('smokes Library folder, saved-word, history, and flashcard flows through SQLite without duplicate relations', async () => {
    const harness = createFakeUserDatabaseHarness();
    seedAsyncStorage();
    resetRuntimeOptions = configureUserDatabaseRuntime({
      now: () => '2026-05-25T15:00:00.000Z',
      openDatabase: harness.openDatabase,
    });

    let state = await loadLibraryState();
    state = await createFolder(state, 'SQLite folder', { tags: ['sqlite'] });
    const folderId = state.folders[state.folders.length - 1].id;
    state = await saveWordToFolder(state, fixtureEntry, folderId, 'smoke note');
    state = await saveWordToFolder(state, fixtureEntry, folderId, 'smoke note');
    state = await addSearchHistory(state, 'SQLite');
    state = await createFlashcardsFromWordIds(state, [state.savedWords[0].id], ['bilingual', 'word-definition']);

    const reloaded = await loadLibraryState();

    expect(reloaded.folders.find((folder) => folder.id === folderId)).toMatchObject({
      name: 'SQLite folder',
      tags: ['sqlite'],
    });
    const savedWord = reloaded.savedWords.find((word) => word.word === 'sqlite');
    expect(savedWord).toMatchObject({
      folderIds: [folderId],
      note: 'smoke note',
      tags: ['B1', 'Technology'],
      word: 'sqlite',
    });
    expect(reloaded.searchHistory[0]).toEqual({ word: 'sqlite', lookedUpAt: expect.any(String) });
    expect(reloaded.flashcards.filter((card) => card.wordId === savedWord?.id)).toHaveLength(2);
    expect(
      harness
        .requireDatabase('dictionary-mobile-user.sqlite')
        .rows.saved_word_folders.filter((row) => row.word_id === savedWord?.id)
    ).toHaveLength(1);
  });

  it('smokes Reader import, settings, selection, and selected-document fallback through SQLite', async () => {
    const harness = createFakeUserDatabaseHarness();
    seedAsyncStorage();
    resetRuntimeOptions = configureUserDatabaseRuntime({
      now: () => '2026-05-25T16:00:00.000Z',
      openDatabase: harness.openDatabase,
    });

    let state = await loadReaderState();
    state = await importReaderText(state, 'SQLite Reader', 'Content for SQLite reader smoke.', 'txt');
    state = await importReaderText(state, 'Second Reader', 'Second document.', 'txt');
    state = await updateReaderSettings(state, {
      backgroundColor: '#FFF7ED',
      fontFamily: 'serif',
      fontSize: 22,
    });
    state = await selectReaderDocument(state, 'missing-reader-id');

    const reloaded = await loadReaderState();

    expect(reloaded.documents).toHaveLength(3);
    expect(reloaded.selectedDocumentId).toBe(reloaded.documents[0].id);
    expect(reloaded.settings).toMatchObject({
      backgroundColor: '#FFF7ED',
      fontFamily: 'serif',
      fontSize: 22,
    });
  });

  it('smokes reset and export boundaries without clearing offline pack metadata', async () => {
    const harness = createFakeUserDatabaseHarness();
    seedAsyncStorage();
    resetRuntimeOptions = configureUserDatabaseRuntime({
      now: () => '2026-05-25T17:00:00.000Z',
      openDatabase: harness.openDatabase,
    });
    await markOfflinePackReady(getDefaultOfflinePackInstallState(), offlineDictionaryPacks[0], () => timestamp);

    await loadUserProfile();
    await clearLibraryState();
    await clearUserProfile();
    await clearReaderState();

    expect((await loadOfflinePackInstallState()).records).toHaveLength(1);
    expect((await loadLibraryState()).savedWords).toHaveLength(0);
    expect((await loadLibraryState()).flashcards).toHaveLength(0);
    expect((await loadReaderState()).documents).toHaveLength(0);
    expect((await loadUserProfile()).displayName).toBe('Khách học tập');

    await exportAllLocalData();
    const exportedPayload = JSON.parse(writtenFiles.at(-1) ?? '{}');

    expect(exportedPayload.library).toBeNull();
    expect(exportedPayload.reader).toBeNull();
    expect(exportedPayload.profile).toBeNull();
    expect(storage.get('dictionary-mobile.offline-packs.v1')).toContain(offlineDictionaryPacks[0].id);
  });
});

function seedAsyncStorage() {
  storage.set('dictionary-mobile.profile.v1', JSON.stringify(fixtureProfile));
  storage.set('dictionary-mobile.library.v1', JSON.stringify(fixtureLibrary));
  storage.set('dictionary-mobile.reader.v1', JSON.stringify(fixtureReader));
}

const fixtureProfile: UserProfile = {
  appLockEnabled: false,
  avatarUrl: '',
  cloudSyncEnabled: false,
  dailyGoal: '10 từ/ngày',
  displayName: 'Runtime Profile',
  email: '',
  learningGoal: 'Runtime adoption',
  learningLanguage: 'en',
  loginMethod: 'local',
  nativeLanguage: 'vi',
  notificationPreferences: {
    dailyReminderEnabled: true,
    reminderTime: '06:45',
    reviewReminderEnabled: false,
    weeklySummaryEnabled: true,
  },
  phone: '',
  proficiencyLevel: 'B1',
  timezone: 'UTC',
  updatedAt: timestamp,
  username: '',
};

const fixtureLibrary: LibraryState = {
  deletedFolderIds: ['folder-deleted'],
  flashcards: [
    {
      back: 'runtime definition',
      createdAt: timestamp,
      dueDate: '2026-05-26T00:00:00.000Z',
      efactor: 2.3,
      front: 'runtime',
      id: 'card-runtime',
      interval: 2,
      lastSyncedAt: timestamp,
      repetition: 1,
      reviewState: 'learning',
      syncStatus: 'pending_update',
      type: 'word-definition',
      version: 2,
      wordId: 'word-runtime',
    },
  ],
  folders: [
    {
      color: '#2563EB',
      colorNote: '',
      createdAt: timestamp,
      id: 'folder-runtime',
      isFavorite: false,
      name: 'Runtime',
      tags: [],
      updatedAt: timestamp,
    },
  ],
  savedWords: [
    {
      audio: '',
      createdAt: timestamp,
      definition: 'runtime definition',
      folderIds: ['folder-runtime', 'favorites'],
      id: 'word-runtime',
      ipa: '',
      note: '',
      source: 'api',
      tags: ['runtime'],
      updatedAt: timestamp,
      word: 'runtime',
    },
  ],
  searchHistory: [{ word: 'runtime', lookedUpAt: timestamp }],
};

const fixtureReader: ReaderState = {
  documents: [
    {
      content: 'Runtime content',
      createdAt: timestamp,
      id: 'reader-runtime',
      sourceFormat: 'txt',
      title: 'Runtime Reader',
      updatedAt: timestamp,
    },
  ],
  selectedDocumentId: 'reader-runtime',
  settings: {
    backgroundColor: '#ECFDF5',
    backgroundPresetId: 'cool-mist',
    fontFamily: 'mono',
    fontSize: 21,
    sourceLanguage: 'en',
    targetLanguage: 'vi',
    themeMode: 'light',
  },
};

const fixtureEntry: DictionaryEntry = {
  antonyms: [],
  audio: '',
  collocations: [],
  conjugation: [],
  definitions: [
    {
      examples: [],
      meaning: 'A database engine used by the runtime smoke.',
      partOfSpeech: 'noun',
      vietnamese: 'SQLite',
    },
  ],
  etymology: '',
  idioms: [],
  ipa: '',
  level: 'B1',
  pronunciationTips: [],
  shortDefinition: 'A local database engine.',
  synonyms: [],
  topic: 'Technology',
  vietnamese: 'SQLite',
  word: 'SQLite',
};

function createFakeUserDatabaseHarness() {
  const databases = new Map<string, FakeUserSqliteDatabase>();

  return {
    openDatabase: async (databaseName: string) => {
      const database = databases.get(databaseName) ?? new FakeUserSqliteDatabase(databaseName);
      databases.set(databaseName, database);
      return database;
    },
    requireDatabase(databaseName: string) {
      const database = databases.get(databaseName);
      if (!database) throw new Error(`Missing fake database ${databaseName}`);
      return database;
    },
  };
}

type RowTableName = keyof ReturnType<typeof createEmptyRows>;

const insertColumns: Record<RowTableName, string[]> = {
  deleted_entities: ['entity_type', 'entity_id', 'deleted_at'],
  flashcard_learning_settings: ['id', 'completion_min_average_quality', 'completion_min_review_count', 'updated_at'],
  flashcard_review_events: ['id', 'flashcard_id', 'word_id', 'quality', 'reviewed_at', 'scheduled_due_date_after_review'],
  flashcards: [
    'id',
    'word_id',
    'type',
    'front',
    'back',
    'created_at',
    'review_state',
    'final_status',
    'completed_at',
    'interval',
    'repetition',
    'efactor',
    'due_date',
    'sync_status',
    'last_synced_at',
    'version',
    'deleted_at',
  ],
  folders: [
    'id',
    'name',
    'color',
    'color_note',
    'tags_json',
    'avatar_uri',
    'is_favorite',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
  reader_documents: ['id', 'title', 'content', 'source_format', 'created_at', 'updated_at', 'deleted_at'],
  reader_settings: ['id', 'selected_document_id', 'font_size', 'font_family', 'background_color', 'updated_at'],
  saved_word_folders: ['word_id', 'folder_id', 'created_at'],
  saved_words: ['id', 'word', 'ipa', 'definition', 'audio', 'note', 'tags_json', 'source', 'created_at', 'updated_at', 'deleted_at'],
  search_history: ['id', 'word', 'normalized_word', 'looked_up_at'],
  user_database_meta: ['key', 'value'],
  user_profile: [
    'id',
    'display_name',
    'email',
    'username',
    'phone',
    'avatar_url',
    'login_method',
    'native_language',
    'learning_language',
    'proficiency_level',
    'learning_goal',
    'timezone',
    'daily_goal',
    'app_lock_enabled',
    'cloud_sync_enabled',
    'daily_reminder_enabled',
    'review_reminder_enabled',
    'weekly_summary_enabled',
    'reminder_time',
    'updated_at',
  ],
};

class FakeUserSqliteDatabase implements UserSqliteDatabase {
  readonly databasePath: string;
  readonly execStatements: string[] = [];
  closeCount = 0;
  rows = createEmptyRows();
  transactionCount = 0;

  constructor(databaseName: string) {
    this.databasePath = `sqlite://${databaseName}`;
  }

  async closeAsync() {
    this.closeCount += 1;
  }

  async execAsync(source: string) {
    this.execStatements.push(source);
  }

  async getAllAsync<T>(source: string) {
    return [...this.rows[requireSelectTable(source)]] as T[];
  }

  async getFirstAsync<T>(source: string, ...params: UserSqliteBindParams) {
    const table = requireSelectTable(source);
    const key = params[0];

    if (table === 'user_database_meta') {
      return (this.rows.user_database_meta.find((row) => row.key === key) ?? null) as T | null;
    }

    if (table === 'user_profile') {
      return (this.rows.user_profile.find((row) => row.id === key) ?? null) as T | null;
    }

    if (table === 'reader_settings') {
      return (this.rows.reader_settings.find((row) => row.id === key) ?? null) as T | null;
    }

    return (this.rows[table][0] ?? null) as T | null;
  }

  async runAsync(source: string, ...params: UserSqliteBindParams) {
    const tableName = parseTargetTable(source);
    if (!tableName) return;

    if (source.trim().toLocaleUpperCase().startsWith('DELETE')) {
      this.rows[tableName] = [];
      return;
    }

    const columns = insertColumns[tableName];
    this.rows[tableName].push(Object.fromEntries(columns.map((column, index) => [column, params[index]])));
  }

  async withTransactionAsync(task: () => Promise<void>) {
    this.transactionCount += 1;
    await task();
  }
}

function createEmptyRows() {
  return {
    deleted_entities: [] as Record<string, unknown>[],
    flashcard_learning_settings: [] as Record<string, unknown>[],
    flashcard_review_events: [] as Record<string, unknown>[],
    flashcards: [] as Record<string, unknown>[],
    folders: [] as Record<string, unknown>[],
    reader_documents: [] as Record<string, unknown>[],
    reader_settings: [] as Record<string, unknown>[],
    saved_word_folders: [] as Record<string, unknown>[],
    saved_words: [] as Record<string, unknown>[],
    search_history: [] as Record<string, unknown>[],
    user_database_meta: [] as Record<string, unknown>[],
    user_profile: [] as Record<string, unknown>[],
  };
}

function parseTargetTable(source: string): RowTableName | null {
  const match = source.trim().match(/^(?:INSERT OR REPLACE INTO|DELETE FROM)\s+([a-z_]+)/i);
  const tableName = match?.[1] as RowTableName | undefined;

  return tableName && tableName in insertColumns ? tableName : null;
}

function requireSelectTable(source: string): RowTableName {
  const match = source.match(/FROM\s+([a-z_]+)/i);
  const tableName = match?.[1] as RowTableName | undefined;

  if (!tableName || !(tableName in insertColumns)) {
    throw new Error(`Unsupported fake SELECT: ${source}`);
  }

  return tableName;
}
