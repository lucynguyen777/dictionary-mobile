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
import { USER_DATABASE_NAME, type UserSqliteBindParams, type UserSqliteDatabase } from '../data/userDatabaseSchema';

const migratedAt = '2026-05-25T10:00:00.000Z';

describe('user database migration bridge', () => {
  it('writes normalized user data rows transactionally and reports parity counts', async () => {
    const harness = createFakeUserDatabaseHarness();
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
      schemaVersion: 2,
    });
    expect(database.rows.user_profile[0]).toMatchObject({
      app_lock_enabled: 1,
      daily_reminder_enabled: 0,
      display_name: 'Mai Anh',
      reminder_time: '07:30',
      weekly_summary_enabled: 1,
    });
    expect(database.rows.saved_word_folders).toEqual([
      { word_id: 'word-hello', folder_id: 'folder-travel', created_at: '2026-05-01T00:00:00.000Z' },
      { word_id: 'word-hello', folder_id: 'folder-work', created_at: '2026-05-01T00:00:00.000Z' },
      { word_id: 'word-plan', folder_id: 'folder-work', created_at: '2026-05-03T00:00:00.000Z' },
    ]);
    expect(database.rows.search_history[0]).toMatchObject({
      id: 'search-hello-2026-05-10T00:00:00.000Z',
      normalized_word: 'hello',
    });
    expect(database.rows.flashcards).toEqual([
      expect.objectContaining({
        id: 'card-hello',
        last_synced_at: '2026-05-12T00:00:00.000Z',
        sync_status: 'synced',
        version: 3,
      }),
      expect.objectContaining({
        id: 'card-plan',
        deleted_at: migratedAt,
        sync_status: 'pending_delete',
        version: 4,
      }),
    ]);
    expect(database.rows.reader_settings[0]).toMatchObject({
      background_color: '#FFF7ED',
      selected_document_id: 'doc-a',
    });
    expect(database.rows.deleted_entities).toEqual([
      { entity_type: 'folder', entity_id: 'folder-old', deleted_at: migratedAt },
      { entity_type: 'folder', entity_id: 'folder-archive', deleted_at: migratedAt },
    ]);
  });

  it('can run more than once without duplicating rows', async () => {
    const harness = createFakeUserDatabaseHarness();
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
    expect(database.rows.saved_words).toHaveLength(2);
    expect(database.rows.saved_word_folders).toHaveLength(3);
    expect(database.rows.flashcards).toHaveLength(2);
    expect(database.rows.user_database_meta).toEqual([
      { key: 'schema_version', value: '2' },
      { key: 'migrated_at', value: migratedAt },
    ]);
  });

  it('rolls back transaction writes when SQLite insertion fails', async () => {
    const harness = createFakeUserDatabaseHarness();

    await migrateAsyncStorageToUserDatabase({
      now: () => migratedAt,
      openDatabase: harness.openDatabase,
      source: createFixtureSource(),
    });

    const database = harness.requireDatabase(USER_DATABASE_NAME);
    const previousRows = database.snapshotRows();
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

    expect(database.rows).toEqual(previousRows);
    expect(database.closeCount).toBe(2);
  });

  it('stops before opening SQLite when export safety fails', async () => {
    const harness = createFakeUserDatabaseHarness();
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
  displayName: 'Mai Anh',
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
    fontFamily: 'serif',
    fontSize: 20,
  },
};

function createFakeUserDatabaseHarness() {
  const databases = new Map<string, FakeUserSqliteDatabase>();
  const openedDatabaseNames: string[] = [];

  return {
    openDatabase: async (databaseName: string) => {
      openedDatabaseNames.push(databaseName);
      const database = databases.get(databaseName) ?? new FakeUserSqliteDatabase(databaseName);
      databases.set(databaseName, database);

      return database;
    },
    openedDatabaseNames,
    requireDatabase(databaseName: string) {
      const database = databases.get(databaseName);
      if (!database) throw new Error(`Missing fake database ${databaseName}`);

      return database;
    },
  };
}

type RowTableName = keyof FakeUserSqliteDatabase['rows'];

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
  failOnTable: RowTableName | null = null;
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

  async runAsync(source: string, ...params: UserSqliteBindParams) {
    const tableName = parseTargetTable(source);

    if (!tableName) return;
    if (this.failOnTable === tableName && source.trim().toLocaleUpperCase().startsWith('INSERT')) {
      throw new Error(`fake insert failure for ${tableName}`);
    }

    if (source.trim().toLocaleUpperCase().startsWith('DELETE')) {
      this.rows[tableName] = [];
      return;
    }

    const columns = insertColumns[tableName];
    this.rows[tableName].push(Object.fromEntries(columns.map((column, index) => [column, params[index]])));
  }

  snapshotRows() {
    return structuredClone(this.rows);
  }

  async withTransactionAsync(task: () => Promise<void>) {
    this.transactionCount += 1;
    const snapshot = this.snapshotRows();

    try {
      await task();
    } catch (error) {
      this.rows = snapshot;
      throw error;
    }
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
