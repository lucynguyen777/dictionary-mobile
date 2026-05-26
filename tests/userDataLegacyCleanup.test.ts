import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('../data/storageAdapter', () => ({
  getStoredItem: vi.fn().mockResolvedValue(null),
  removeStoredItem: vi.fn().mockResolvedValue(undefined),
  setStoredItem: vi.fn().mockResolvedValue(undefined),
}));

import {
  cleanupLegacyUserDataAsyncStorage,
  LEGACY_USER_DATA_CLEANUP_BACKUP_MARKER_KEY,
  LEGACY_USER_DATA_KEYS,
} from '../data/userDataLegacyCleanup';
import type { UserSqliteBindParams, UserSqliteDatabase } from '../data/userDatabaseSchema';

const cleanupAt = '2026-05-26T10:00:00.000Z';

describe('legacy user-data AsyncStorage cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports a rollback backup marker and removes only Profile, Library, and Reader legacy keys', async () => {
    const storage = createLegacyStorage();
    const source = createCleanupSource(storage);
    const database = createEligibleDatabase();

    const result = await cleanupLegacyUserDataAsyncStorage({
      now: () => cleanupAt,
      openDatabase: async () => database,
      source,
    });

    expect(result).toMatchObject({
      backupUri: 'file://backup.json',
      eligible: true,
      removedKeys: LEGACY_USER_DATA_KEYS,
    });
    expect(source.exportLocalData).toHaveBeenCalledTimes(1);
    expect(storage.get('dictionary-mobile.profile.v1')).toBeUndefined();
    expect(storage.get('dictionary-mobile.library.v1')).toBeUndefined();
    expect(storage.get('dictionary-mobile.reader.v1')).toBeUndefined();
    expect(storage.get('dictionary-mobile.offline-packs.v1')).toBe('offline-pack-state');
    expect(storage.get('dictionary-mobile.offline-pack-db-uri.v1')).toBe('sqlite://pack.sqlite');

    const marker = JSON.parse(storage.get(LEGACY_USER_DATA_CLEANUP_BACKUP_MARKER_KEY) ?? '{}');
    expect(marker).toMatchObject({
      backupUri: 'file://backup.json',
      createdAt: cleanupAt,
      schemaVersion: 1,
    });
    expect(marker.legacyKeys).toEqual(LEGACY_USER_DATA_KEYS);
  });

  it('is idempotent and reuses an existing backup marker', async () => {
    const storage = createLegacyStorage();
    storage.set(
      LEGACY_USER_DATA_CLEANUP_BACKUP_MARKER_KEY,
      JSON.stringify({ backupUri: 'file://existing-backup.json' })
    );
    const source = createCleanupSource(storage);
    const database = createEligibleDatabase();

    const firstResult = await cleanupLegacyUserDataAsyncStorage({
      openDatabase: async () => database,
      source,
    });
    const secondResult = await cleanupLegacyUserDataAsyncStorage({
      openDatabase: async () => database,
      source,
    });

    expect(firstResult.removedKeys).toEqual(LEGACY_USER_DATA_KEYS);
    expect(firstResult.backupUri).toBe('file://existing-backup.json');
    expect(secondResult.removedKeys).toEqual([]);
    expect(source.exportLocalData).not.toHaveBeenCalled();
  });

  it('skips cleanup when SQLite schema metadata is missing', async () => {
    const storage = createLegacyStorage();
    const source = createCleanupSource(storage);
    const database = createEligibleDatabase({ schemaVersion: null });

    const result = await cleanupLegacyUserDataAsyncStorage({
      openDatabase: async () => database,
      source,
    });

    expect(result).toMatchObject({
      eligible: false,
      reason: 'schema-version-missing',
      removedKeys: [],
    });
    expect(storage.get('dictionary-mobile.profile.v1')).toBe('profile');
    expect(source.exportLocalData).not.toHaveBeenCalled();
    expect(source.removeStoredItem).not.toHaveBeenCalled();
  });

  it('skips cleanup when required user rows are missing', async () => {
    const storage = createLegacyStorage();
    const source = createCleanupSource(storage);
    const database = createEligibleDatabase({ hasProfile: false });

    const result = await cleanupLegacyUserDataAsyncStorage({
      openDatabase: async () => database,
      source,
    });

    expect(result).toMatchObject({
      eligible: false,
      reason: 'profile-row-missing',
    });
    expect(storage.get('dictionary-mobile.library.v1')).toBe('library');
    expect(source.exportLocalData).not.toHaveBeenCalled();
  });

  it('does not remove legacy keys if backup export fails', async () => {
    const storage = createLegacyStorage();
    const source = createCleanupSource(storage);
    source.exportLocalData = vi.fn(async () => ({ ok: false, message: 'backup unavailable', uri: '' }));

    await expect(
      cleanupLegacyUserDataAsyncStorage({
        openDatabase: async () => createEligibleDatabase(),
        source,
      })
    ).rejects.toThrow('Legacy user-data cleanup backup failed: backup unavailable');

    expect(storage.get('dictionary-mobile.reader.v1')).toBe('reader');
    expect(source.removeStoredItem).not.toHaveBeenCalled();
  });
});

function createLegacyStorage() {
  return new Map<string, string>([
    ['dictionary-mobile.profile.v1', 'profile'],
    ['dictionary-mobile.library.v1', 'library'],
    ['dictionary-mobile.reader.v1', 'reader'],
    ['dictionary-mobile.offline-packs.v1', 'offline-pack-state'],
    ['dictionary-mobile.offline-pack-db-uri.v1', 'sqlite://pack.sqlite'],
  ]);
}

function createCleanupSource(storage: Map<string, string>) {
  return {
    exportLocalData: vi.fn(async () => ({ ok: true, message: 'exported', uri: 'file://backup.json' })),
    getStoredItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    removeStoredItem: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
    setStoredItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  };
}

function createEligibleDatabase({
  hasProfile = true,
  hasReaderSettings = true,
  schemaVersion = '1',
}: {
  hasProfile?: boolean;
  hasReaderSettings?: boolean;
  schemaVersion?: string | null;
} = {}) {
  return new FakeCleanupDatabase({ hasProfile, hasReaderSettings, schemaVersion });
}

class FakeCleanupDatabase implements UserSqliteDatabase {
  closeCount = 0;

  constructor(
    private readonly rows: {
      hasProfile: boolean;
      hasReaderSettings: boolean;
      schemaVersion: string | null;
    }
  ) {}

  async closeAsync() {
    this.closeCount += 1;
  }

  async execAsync() {}

  async getAllAsync<T>() {
    return [] as T[];
  }

  async getFirstAsync<T>(source: string, ...params: UserSqliteBindParams) {
    const id = params[0];

    if (source.includes('user_database_meta')) {
      return (this.rows.schemaVersion ? { value: this.rows.schemaVersion } : null) as T | null;
    }

    if (source.includes('user_profile')) {
      return (this.rows.hasProfile ? { id } : null) as T | null;
    }

    if (source.includes('reader_settings')) {
      return (this.rows.hasReaderSettings ? { id } : null) as T | null;
    }

    return null;
  }

  async runAsync() {}

  async withTransactionAsync(task: () => Promise<void>) {
    await task();
  }
}
