const storage = vi.hoisted(() => new Map<string, string>());
const storageMock = vi.hoisted(() => ({
  getStoredItem: vi.fn(async (key: string) => storage.get(key) ?? null),
  removeStoredItem: vi.fn(async (key: string) => { storage.delete(key); }),
  setStoredItem: vi.fn(async (key: string, value: string) => { storage.set(key, value); }),
}));

vi.mock('expo-file-system', () => ({
  File: class {
    uri = 'file://backup.json';
    create() {}
    write() {}
  },
  Paths: { document: '' },
}));
vi.mock('expo-sharing', () => ({ isAvailableAsync: vi.fn().mockResolvedValue(false), shareAsync: vi.fn() }));
vi.mock('@/data/storageAdapter', () => storageMock);
vi.mock('../data/storageAdapter', () => storageMock);

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDefaultLibraryState, type Folder } from '../data/libraryStore';
import { createUserDatabaseSyncLocalPort } from '../data/supabaseSyncLocalPort';
import { loadLibraryStateFromUserDatabase, saveLibraryStateToUserDatabase } from '../data/userDatabaseRuntime';
import { createSqliteTestHarness } from './helpers/nodeSqliteUserDatabase';

const DB = 'dictionary-mobile-user.sqlite';
const T1 = '2026-10-01T10:00:00.000Z';
const T2 = '2026-10-01T11:00:00.000Z';
const T3 = '2026-10-01T12:00:00.000Z';

function folder(id: string, name: string): Folder {
  return { ...getDefaultLibraryState().folders[0], id, name };
}

async function setup() {
  const harness = createSqliteTestHarness();
  const options = { now: () => T1, openDatabase: harness.openDatabase };
  const library = getDefaultLibraryState();
  await saveLibraryStateToUserDatabase({ ...library, folders: [...library.folders, folder('f1', 'Travel')] }, options);
  const port = createUserDatabaseSyncLocalPort({ openDatabase: harness.openDatabase });
  const database = harness.requireDatabase(DB);
  const row = (id: string) => database.rows('folders').find((candidate) => candidate.id === id);
  return { database, harness, options, port, row };
}

function remoteFolder(id: string, name: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    row: {
      avatar_uri: '',
      color: '#7C3AED',
      color_note: '',
      created_at: T1,
      deleted_at: null,
      id,
      is_favorite: false,
      name,
      synced_at: T2,
      tags: [],
      updated_at: T2,
      user_id: 'user-1',
      version: 3,
      ...overrides,
    },
    table: 'library_folders',
  };
}

beforeEach(() => storage.clear());

describe('createUserDatabaseSyncLocalPort', () => {
  it('records and reloads per-domain cursors', async () => {
    const { port } = await setup();
    await port.recordDomainCursor('folders', { lastPullCursor: 'pull-2', lastPushCursor: 'push-2', lastSuccessfulSyncAt: T2 });
    await expect(port.loadDomainCursor('folders')).resolves.toEqual({
      lastPullCursor: 'pull-2',
      lastPushCursor: 'push-2',
      lastSuccessfulSyncAt: T2,
    });
  });

  it('loads dirty rows as full server-shaped rows stamped with the local change time', async () => {
    const { port } = await setup();
    const dirty = await port.loadDirtyRows('folders');
    const travel = dirty.find((row) => row.id === 'f1');

    expect(travel).toMatchObject({
      localChangeAt: T1,
      remoteRow: { color: expect.any(String), id: 'f1', name: 'Travel', tags: [], updated_at: T1, version: 1 },
      table: 'library_folders',
    });
  });

  it('marks pushed rows clean but keeps rows edited during the push dirty', async () => {
    const { options, port, row } = await setup();
    const dirty = await port.loadDirtyRows('folders');

    // An edit lands between loading dirty rows and the push completing.
    const library = await loadLibraryStateFromUserDatabase(options);
    await saveLibraryStateToUserDatabase(
      { ...library, folders: library.folders.map((item) => (item.id === 'f1' ? { ...item, name: 'Trips' } : item)) },
      { ...options, now: () => T2 }
    );

    await port.markPushedRows('folders', dirty, T3);

    expect(row('f1')).toMatchObject({ name: 'Trips', sync_status: 'dirty', last_local_change_at: T2 });
    const otherFolder = dirty.find((candidate) => candidate.id !== 'f1');
    expect(row(otherFolder!.id)).toMatchObject({ sync_status: 'clean', last_synced_at: T3, remote_version: 1 });
  });

  it('removes the local soft-deleted copy once its deletion is pushed', async () => {
    const { options, port, row } = await setup();
    await port.markPushedRows('folders', await port.loadDirtyRows('folders'), T2);

    const library = await loadLibraryStateFromUserDatabase(options);
    await saveLibraryStateToUserDatabase(
      { ...library, folders: library.folders.filter((item) => item.id !== 'f1') },
      { ...options, now: () => T3 }
    );
    expect(row('f1')).toMatchObject({ deleted_at: T3, sync_status: 'dirty' });

    const dirty = await port.loadDirtyRows('folders');
    expect(dirty.find((candidate) => candidate.id === 'f1')?.remoteRow.deleted_at).toBe(T3);
    await port.markPushedRows('folders', dirty, T3);

    expect(row('f1')).toBeUndefined();
  });

  it('applies remote inserts and updates as clean pulled rows', async () => {
    const { port, row } = await setup();
    await port.markPushedRows('folders', await port.loadDirtyRows('folders'), T1);

    await port.applyRemoteChanges('folders', [remoteFolder('f1', 'Renamed remotely'), remoteFolder('f2', 'New remotely')], T3);

    expect(row('f1')).toMatchObject({ name: 'Renamed remotely', sync_status: 'clean', last_pulled_at: T3, remote_version: 3 });
    expect(row('f2')).toMatchObject({ name: 'New remotely', sync_status: 'clean' });
  });

  it('keeps a newer unpushed local edit over an older remote change', async () => {
    const { options, port, row } = await setup();
    const library = await loadLibraryStateFromUserDatabase(options);
    await saveLibraryStateToUserDatabase(
      { ...library, folders: library.folders.map((item) => (item.id === 'f1' ? { ...item, name: 'Local edit' } : item)) },
      { ...options, now: () => T3 }
    );

    await port.applyRemoteChanges('folders', [remoteFolder('f1', 'Older remote', { updated_at: T2 })], T3);

    expect(row('f1')).toMatchObject({ name: 'Local edit', sync_status: 'dirty' });
  });

  it('applies remote deletions by removing the local row', async () => {
    const { port, row } = await setup();
    await port.applyRemoteChanges('folders', [remoteFolder('f1', 'Travel', { deleted_at: T2, updated_at: T2 })], T3);
    expect(row('f1')).toBeUndefined();
  });

  it('does not rewrite rows whose pulled content is unchanged', async () => {
    const { port, row } = await setup();
    await port.markPushedRows('folders', await port.loadDirtyRows('folders'), T1);
    const before = row('f1');

    await port.applyRemoteChanges('folders', [remoteFolder('f1', 'Travel', {
      avatar_uri: before?.avatar_uri,
      color: before?.color,
      color_note: before?.color_note,
      created_at: before?.created_at,
      is_favorite: Boolean(before?.is_favorite),
      updated_at: before?.updated_at,
    })], T3);

    expect(row('f1')).toEqual(before);
  });
});
