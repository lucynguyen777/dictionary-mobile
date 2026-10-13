const storage = vi.hoisted(() => new Map<string, string>());

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

const storageMock = vi.hoisted(() => ({
  getStoredItem: vi.fn(async (key: string) => storage.get(key) ?? null),
  removeStoredItem: vi.fn(async (key: string) => { storage.delete(key); }),
  setStoredItem: vi.fn(async (key: string, value: string) => { storage.set(key, value); }),
}));

vi.mock('@/data/storageAdapter', () => storageMock);
vi.mock('../data/storageAdapter', () => storageMock);

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDefaultLibraryState, type Folder } from '../data/libraryStore';
import { loadLibraryStateFromUserDatabase, saveLibraryStateToUserDatabase } from '../data/userDatabaseRuntime';
import { planUserDatabaseMigration, SYNCED_LOCAL_TABLES, USER_DATABASE_SCHEMA_VERSION } from '../data/userDatabaseSchema';
import { createNodeSqliteUserDatabase } from './helpers/nodeSqliteUserDatabase';

const marker: Folder = {
  ...getDefaultLibraryState().folders[0],
  id: 'folder-upgrade-marker',
  name: 'Upgrade marker',
};

const CURRENT = USER_DATABASE_SCHEMA_VERSION;
const NEXT = CURRENT + 1;

async function seedCurrentDatabase() {
  const harness = createNodeSqliteUserDatabase();
  const library = getDefaultLibraryState();
  await saveLibraryStateToUserDatabase(
    { ...library, folders: [...library.folders, marker] },
    { openDatabase: harness.openDatabase }
  );
  // Simulate legacy cleanup: AsyncStorage no longer holds a copy of the data.
  storage.clear();
  return harness;
}

function schemaVersion(harness: ReturnType<typeof createNodeSqliteUserDatabase>) {
  return (harness.database.prepare(`SELECT value FROM user_database_meta WHERE key = 'schema_version'`).get() as
    { value: string }).value;
}

beforeEach(() => {
  storage.clear();
});

describe('planUserDatabaseMigration', () => {
  it.each([
    [null, 2, 'import-legacy'],
    ['1', 2, 'import-legacy'],
    ['garbage', 2, 'import-legacy'],
    ['2', 2, 'current'],
    ['2', 3, 'upgrade'],
    ['3', 2, 'newer-than-app'],
  ] as const)('stored %s with app %i plans %s', (stored, current, kind) => {
    expect(planUserDatabaseMigration(stored, current).kind).toBe(kind);
  });
});

describe('user database schema upgrades', () => {
  it('upgrades in place without re-importing from emptied AsyncStorage', async () => {
    const harness = await seedCurrentDatabase();

    const library = await loadLibraryStateFromUserDatabase({
      openDatabase: harness.openDatabase,
      schemaVersion: NEXT,
      upgrades: { [NEXT]: ['ALTER TABLE folders ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0'] },
    });

    expect(library.folders.map((folder) => folder.id)).toContain(marker.id);
    expect(schemaVersion(harness)).toBe(String(NEXT));
    const columns = harness.database.prepare('PRAGMA table_info(folders)').all() as { name: string }[];
    expect(columns.map((column) => column.name)).toContain('sort_order');
  });

  it('refuses to upgrade when a step is missing and leaves data untouched', async () => {
    const harness = await seedCurrentDatabase();

    await expect(loadLibraryStateFromUserDatabase({
      openDatabase: harness.openDatabase,
      schemaVersion: NEXT,
      upgrades: {},
    })).rejects.toThrow(`Missing user database upgrade to schema version ${NEXT}`);

    expect(schemaVersion(harness)).toBe(String(CURRENT));
    const library = await loadLibraryStateFromUserDatabase({ openDatabase: harness.openDatabase });
    expect(library.folders.map((folder) => folder.id)).toContain(marker.id);
  });

  it('rolls back a failing upgrade step', async () => {
    const harness = await seedCurrentDatabase();

    await expect(loadLibraryStateFromUserDatabase({
      openDatabase: harness.openDatabase,
      schemaVersion: NEXT,
      upgrades: { [NEXT]: ['ALTER TABLE folders ADD COLUMN extra TEXT', 'ALTER TABLE missing_table ADD COLUMN x TEXT'] },
    })).rejects.toThrow();

    expect(schemaVersion(harness)).toBe(String(CURRENT));
    const columns = harness.database.prepare('PRAGMA table_info(folders)').all() as { name: string }[];
    expect(columns.map((column) => column.name)).not.toContain('extra');
  });

  it('does not touch a database written by a newer app version', async () => {
    const harness = await seedCurrentDatabase();

    await expect(loadLibraryStateFromUserDatabase({ openDatabase: harness.openDatabase, schemaVersion: CURRENT - 1 }))
      .rejects.toThrow('newer than this app');

    expect(schemaVersion(harness)).toBe(String(CURRENT));
  });

  it('upgrades a real v2 database to v3 by adding last_pulled_at to every synced table', async () => {
    const harness = await seedCurrentDatabase();
    for (const table of SYNCED_LOCAL_TABLES) {
      harness.database.exec(`ALTER TABLE ${table} DROP COLUMN last_pulled_at`);
    }
    harness.database.exec(`UPDATE user_database_meta SET value = '2' WHERE key = 'schema_version'`);

    const library = await loadLibraryStateFromUserDatabase({ openDatabase: harness.openDatabase, schemaVersion: 3 });

    expect(library.folders.map((folder) => folder.id)).toContain(marker.id);
    expect(schemaVersion(harness)).toBe('3');
    for (const table of SYNCED_LOCAL_TABLES) {
      const columns = harness.database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
      expect(columns.map((column) => column.name)).toContain('last_pulled_at');
    }
  });
});
