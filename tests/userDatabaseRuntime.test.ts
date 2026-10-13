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
import { createSqliteTestHarness } from './helpers/nodeSqliteUserDatabase';

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
    const harness = createSqliteTestHarness();
    seedAsyncStorage();

    const profile = await loadUserProfileFromUserDatabase({ openDatabase: harness.openDatabase });
    const library = await loadLibraryStateFromUserDatabase({ openDatabase: harness.openDatabase });
    const reader = await loadReaderStateFromUserDatabase({ openDatabase: harness.openDatabase });

    expect(profile.displayName).toBe('Runtime Profile');
    expect(profile.notificationPreferences.reminderTime).toBe('06:45');
    expect(library.savedWords[0]).toMatchObject({
      folderIds: expect.arrayContaining(['folder-runtime', 'favorites']),
      id: 'word-runtime',
      tags: ['runtime'],
    });
    // Sync bookkeeping now lives in SQLite: imported cards are unsynced until a real push succeeds.
    expect(library.flashcards[0]).toMatchObject({
      id: 'card-runtime',
      lastSyncedAt: null,
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
    const harness = createSqliteTestHarness();
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
      folderIds: expect.arrayContaining(['folder-runtime', 'favorites']),
      note: 'updated note',
    });
    expect(reloaded.searchHistory).toEqual([{ word: 'updated', lookedUpAt: '2026-05-25T13:00:00.000Z' }]);
    expect(harness.requireDatabase('dictionary-mobile-user.sqlite').rows('saved_word_folders')).toHaveLength(2);
  });

  it('smokes Profile save/load through SQLite and keeps the AsyncStorage export backup readable', async () => {
    const harness = createSqliteTestHarness();
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
    const harness = createSqliteTestHarness();
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
        .rows('saved_word_folders').filter((row) => row.word_id === savedWord?.id)
    ).toHaveLength(1);
  });

  it('smokes Reader import, settings, selection, and selected-document fallback through SQLite', async () => {
    const harness = createSqliteTestHarness();
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
    const harness = createSqliteTestHarness();
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
