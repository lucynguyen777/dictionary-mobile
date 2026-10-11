vi.mock('expo-file-system', () => ({
  File: class {
    uri = 'file://backup.json';

    create() {}

    write() {}
  },
  Paths: { document: '' },
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(false),
  shareAsync: vi.fn(),
}));

vi.mock('@/data/storageAdapter', () => ({
  getStoredItem: vi.fn().mockResolvedValue(null),
  removeStoredItem: vi.fn().mockResolvedValue(undefined),
  setStoredItem: vi.fn().mockResolvedValue(undefined),
}));

import { describe, expect, it, vi } from 'vitest';

import type { LibraryState } from '../data/libraryStore';
import type { UserProfile } from '../data/profileStore';
import type { ReaderState } from '../data/readerStore';
import {
  migrateAsyncStorageToUserDatabase,
  type UserDatabaseMigrationSource,
} from '../data/userDatabaseMigration';
import { USER_DATABASE_NAME, USER_DATABASE_SCHEMA_VERSION } from '../data/userDatabaseSchema';
import { createSqliteTestHarness } from './helpers/nodeSqliteUserDatabase';

const migratedAt = '2026-05-25T10:00:00.000Z';

describe('user database migration bridge', () => {
  it('writes normalized user data rows transactionally and reports parity counts', async () => {
    const harness = createSqliteTestHarness();
    const source = createFixtureSource();

    const result = await migrateAsyncStorageToUserDatabase({
      now: () => migratedAt,
      openDatabase: harness.openDatabase,
      source,
    });

    const database = harness.requireDatabase(USER_DATABASE_NAME);

    expect(source.exportLocalData).toHaveBeenCalledTimes(1);
    expect(database.execStatements.join('\n')).toContain('CREATE TABLE IF NOT EXISTS user_profile');
    expect(database.transactionCount).toBe(1);
    expect(result).toMatchObject({
      counts: {
        deletedEntities: 2,
        flashcards: 2,
        folders: 2,
        profile: 1,
        readerDocuments: 2,
        readerSettings: 1,
        savedWordFolders: 3,
        savedWords: 2,
        searchHistory: 2,
      },
      databaseName: USER_DATABASE_NAME,
      databaseUri: `sqlite://${USER_DATABASE_NAME}`,
      migratedAt,
      schemaVersion: USER_DATABASE_SCHEMA_VERSION,
    });
    expect(database.rows('user_profile')[0]).toMatchObject({
      app_lock_enabled: 1,
      daily_reminder_enabled: 0,
      display_name: 'Khách học tập',
      reminder_time: '07:30',
      weekly_summary_enabled: 1,
    });
    expect(database.rows('saved_word_folders')).toEqual([
      expect.objectContaining({ word_id: 'word-hello', folder_id: 'folder-travel', created_at: '2026-05-01T00:00:00.000Z' }),
      expect.objectContaining({ word_id: 'word-hello', folder_id: 'folder-work', created_at: '2026-05-01T00:00:00.000Z' }),
      expect.objectContaining({ word_id: 'word-plan', folder_id: 'folder-work', created_at: '2026-05-03T00:00:00.000Z' }),
    ]);
    // A first import is all new local data, so every synced row starts dirty for the first push.
    expect(database.rows('saved_words').every((row) => row.sync_status === 'dirty')).toBe(true);
    expect(database.rows('search_history')[0]).toMatchObject({
      id: 'search-hello-2026-05-10T00:00:00.000Z',
      normalized_word: 'hello',
    });
    expect(database.rows('flashcards')).toEqual([
      expect.objectContaining({
        id: 'card-hello',
        sync_status: 'dirty',
        version: 3,
      }),
      expect.objectContaining({
        id: 'card-plan',
        deleted_at: migratedAt,
        sync_status: 'dirty',
        version: 4,
      }),
    ]);
    expect(database.rows('reader_settings')[0]).toMatchObject({
      background_color: '#FFF7ED',
      selected_document_id: 'doc-a',
    });
    expect(database.rows('deleted_entities')).toEqual([
      expect.objectContaining({ entity_type: 'folder', entity_id: 'folder-old', deleted_at: migratedAt }),
      expect.objectContaining({ entity_type: 'folder', entity_id: 'folder-archive', deleted_at: migratedAt }),
    ]);
  });

  it('can run more than once without duplicating rows', async () => {
    const harness = createSqliteTestHarness();
    const source = createFixtureSource();

    await migrateAsyncStorageToUserDatabase({
      now: () => migratedAt,
      openDatabase: harness.openDatabase,
      source,
    });
    await migrateAsyncStorageToUserDatabase({
      now: () => migratedAt,
      openDatabase: harness.openDatabase,
      source,
    });

    const database = harness.requireDatabase(USER_DATABASE_NAME);

    expect(database.transactionCount).toBe(2);
    expect(database.rows('saved_words')).toHaveLength(2);
    expect(database.rows('saved_word_folders')).toHaveLength(3);
    expect(database.rows('flashcards')).toHaveLength(2);
    expect(database.rows('user_database_meta')).toEqual([
      { key: 'schema_version', value: String(USER_DATABASE_SCHEMA_VERSION) },
      { key: 'migrated_at', value: migratedAt },
    ]);
  });

  it('rolls back transaction writes when SQLite insertion fails', async () => {
    const harness = createSqliteTestHarness();

    await migrateAsyncStorageToUserDatabase({
      now: () => migratedAt,
      openDatabase: harness.openDatabase,
      source: createFixtureSource(),
    });

    const database = harness.requireDatabase(USER_DATABASE_NAME);
    const tables = ['user_profile', 'folders', 'saved_words', 'saved_word_folders', 'flashcards', 'reader_documents'];
    const previousRows = tables.map((table) => database.rows(table));
    database.failOnTable = 'flashcards';

    await expect(
      migrateAsyncStorageToUserDatabase({
        now: () => '2026-05-25T11:00:00.000Z',
        openDatabase: harness.openDatabase,
        source: createFixtureSource({
          library: {
            ...fixtureLibrary,
            savedWords: [],
          },
        }),
      })
    ).rejects.toThrow('fake insert failure for flashcards');

    expect(tables.map((table) => database.rows(table))).toEqual(previousRows);
    expect(database.closeCount).toBe(2);
  });

  it('stops before opening SQLite when export safety fails', async () => {
    const harness = createSqliteTestHarness();
    const source = createFixtureSource();
    source.exportLocalData = vi.fn(async () => ({ ok: false, message: 'backup denied' }));

    await expect(
      migrateAsyncStorageToUserDatabase({
        openDatabase: harness.openDatabase,
        source,
      })
    ).rejects.toThrow('User data export failed before SQLite migration: backup denied');

    expect(harness.openedDatabaseNames).toEqual([]);
  });
});

type FixtureSourceOverrides = Partial<UserDatabaseMigrationSource> & {
  library?: LibraryState;
  profile?: UserProfile;
  reader?: ReaderState;
};

function createFixtureSource(overrides: FixtureSourceOverrides = {}): UserDatabaseMigrationSource {
  const { library = fixtureLibrary, profile = fixtureProfile, reader = fixtureReader, ...sourceOverrides } = overrides;

  return {
    exportLocalData: vi.fn(async () => ({ ok: true, message: 'exported', uri: 'file://backup.json' })),
    loadLibrary: vi.fn(async () => library),
    loadProfile: vi.fn(async () => profile),
    loadReader: vi.fn(async () => reader),
    ...sourceOverrides,
  };
}

const fixtureProfile: UserProfile = {
  appLockEnabled: true,
  cloudSyncEnabled: false,
  avatarUrl: '',
  dailyGoal: '20 từ/ngày',
  displayName: 'Khách học tập',
  email: '',
  learningGoal: 'Travel',
  learningLanguage: 'en',
  loginMethod: 'local',
  nativeLanguage: 'vi',
  notificationPreferences: {
    dailyReminderEnabled: false,
    reminderTime: '07:30',
    reviewReminderEnabled: true,
    weeklySummaryEnabled: true,
  },
  phone: '',
  proficiencyLevel: 'B2',
  timezone: 'Asia/Ho_Chi_Minh',
  updatedAt: '2026-05-01T00:00:00.000Z',
  username: '',
};

const fixtureLibrary: LibraryState = {
  deletedFolderIds: ['folder-old', 'folder-archive'],
  flashcards: [
    {
      back: 'greeting',
      createdAt: '2026-05-04T00:00:00.000Z',
      dueDate: '2026-05-20T00:00:00.000Z',
      efactor: 2.4,
      front: 'hello',
      id: 'card-hello',
      interval: 6,
      lastSyncedAt: '2026-05-12T00:00:00.000Z',
      repetition: 2,
      reviewState: 'learning',
      syncStatus: 'synced',
      type: 'word-definition',
      version: 3,
      wordId: 'word-hello',
    },
    {
      back: 'kế hoạch',
      createdAt: '2026-05-05T00:00:00.000Z',
      dueDate: '2026-05-21T00:00:00.000Z',
      efactor: 2.1,
      front: 'plan',
      id: 'card-plan',
      interval: 3,
      lastSyncedAt: null,
      repetition: 1,
      reviewState: 'reviewed',
      syncStatus: 'pending_delete',
      type: 'bilingual',
      version: 4,
      wordId: 'word-plan',
    },
  ],
  folders: [
    {
      color: '#2563EB',
      colorNote: 'blue',
      createdAt: '2026-04-01T00:00:00.000Z',
      id: 'folder-travel',
      isFavorite: false,
      name: 'Travel',
      tags: ['trip'],
      updatedAt: '2026-04-02T00:00:00.000Z',
    },
    {
      avatarUri: 'file://folder-work.png',
      color: '#16A34A',
      createdAt: '2026-04-03T00:00:00.000Z',
      id: 'folder-work',
      isFavorite: true,
      name: 'Work',
      tags: [],
      updatedAt: '2026-04-04T00:00:00.000Z',
    },
  ],
  savedWords: [
    {
      audio: '',
      createdAt: '2026-05-01T00:00:00.000Z',
      definition: 'greeting',
      folderIds: ['folder-travel', 'folder-work', 'folder-work'],
      id: 'word-hello',
      ipa: '/həˈloʊ/',
      note: 'common',
      source: 'api',
      tags: ['basic'],
      updatedAt: '2026-05-02T00:00:00.000Z',
      word: 'hello',
    },
    {
      audio: '',
      createdAt: '2026-05-03T00:00:00.000Z',
      definition: 'a detailed proposal',
      folderIds: ['folder-work'],
      id: 'word-plan',
      ipa: '',
      note: '',
      source: 'import',
      tags: [],
      updatedAt: '2026-05-04T00:00:00.000Z',
      word: 'plan',
    },
  ],
  searchHistory: [
    { lookedUpAt: '2026-05-10T00:00:00.000Z', word: ' Hello ' },
    { lookedUpAt: '2026-05-11T00:00:00.000Z', word: 'plan' },
  ],
};

const fixtureReader: ReaderState = {
  documents: [
    {
      content: 'Alpha content',
      createdAt: '2026-05-06T00:00:00.000Z',
      id: 'doc-a',
      sourceFormat: 'txt',
      title: 'Alpha',
      updatedAt: '2026-05-07T00:00:00.000Z',
    },
    {
      content: 'Beta content',
      createdAt: '2026-05-08T00:00:00.000Z',
      id: 'doc-b',
      sourceFormat: 'pdf',
      title: 'Beta',
      updatedAt: '2026-05-09T00:00:00.000Z',
    },
  ],
  selectedDocumentId: 'missing-doc',
  settings: {
    backgroundColor: '#FFF7ED',
    backgroundPresetId: 'sepia',
    fontFamily: 'serif',
    fontSize: 20,
    sourceLanguage: 'en',
    targetLanguage: 'vi',
    themeMode: 'sepia',
  },
};
