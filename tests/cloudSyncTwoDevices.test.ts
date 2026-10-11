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

import type { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { Folder, LibraryState, SavedWord } from '../data/libraryStore';
import { runSupabaseCloudSyncOnce } from '../data/supabaseSyncRunner';
import {
  loadLibraryStateFromUserDatabase,
  loadUserProfileFromUserDatabase,
  saveLibraryStateToUserDatabase,
  saveUserProfileToUserDatabase,
} from '../data/userDatabaseRuntime';
import type { UserProfile } from '../data/profileStore';
import { createSqliteTestHarness } from './helpers/nodeSqliteUserDatabase';
import { createPgliteSupabaseClient } from './helpers/pgliteSupabaseClient';
import { createAuthUser, createSupabaseTestDatabase } from './helpers/supabaseTestDatabase';

const ALICE = '00000000-0000-4000-8000-0000000000a1';
const BOB = '00000000-0000-4000-8000-0000000000b0';

let db: PGlite;
let minute = 0;

// Monotonic test clock so local changes and syncs have a clear order.
function tick() {
  minute += 1;
  return new Date(Date.UTC(2026, 9, 11, 8, minute)).toISOString();
}

function createDevice(userId: string) {
  const harness = createSqliteTestHarness();
  const options = (at: string) => ({ now: () => at, openDatabase: harness.openDatabase });

  return {
    load: () => loadLibraryStateFromUserDatabase(options(tick())),
    loadProfile: () => loadUserProfileFromUserDatabase(options(tick())),
    saveProfile: (profile: UserProfile) => saveUserProfileToUserDatabase(profile, options(tick())),
    save: (library: LibraryState) => saveLibraryStateToUserDatabase(library, options(tick())),
    sync: async () => {
      const result = await runSupabaseCloudSyncOnce({
        createClient: () => ({
          client: createPgliteSupabaseClient(db, userId),
          config: { publishableKey: 'key', status: 'configured', url: 'https://example.supabase.co' },
          status: 'configured',
          storageKind: 'memory',
        }),
        isOnline: () => true,
        now: () => tick(),
        openDatabase: harness.openDatabase,
      });
      if (result.status !== 'synced') throw new Error(`sync failed: ${JSON.stringify(result)}`);
      return result;
    },
  };
}

function folder(id: string, name: string, at: string): Folder {
  return { color: '#7C3AED', colorNote: '', createdAt: at, id, isFavorite: false, name, tags: [], updatedAt: at };
}

function word(id: string, text: string, folderIds: string[], at: string): SavedWord {
  return { audio: '', createdAt: at, definition: `${text} definition`, folderIds, id, ipa: '', note: '', source: 'test', tags: [], updatedAt: at, word: text };
}

const folderNames = (library: LibraryState) => library.folders.map((item) => item.name);
const words = (library: LibraryState) => library.savedWords.map((item) => item.word).sort();

beforeAll(async () => {
  db = await createSupabaseTestDatabase();
  await createAuthUser(db, ALICE);
  await createAuthUser(db, BOB);
}, 60_000);

describe('Cloud Sync between two devices of one account', () => {
  const phone = createDevice(ALICE);
  const tablet = createDevice(ALICE);

  it('delivers folders, saved words and memberships created on one device to the other', async () => {
    const library = await phone.load();
    const at = tick();
    await phone.save({
      ...library,
      folders: [...library.folders, folder('trip', 'Trip to Japan', at)],
      savedWords: [...library.savedWords, word('w-ramen', 'ramen', ['trip'], at), word('w-sushi', 'sushi', ['trip'], at)],
    });
    await phone.sync();

    await tablet.load();
    await tablet.sync();

    const onTablet = await tablet.load();
    expect(folderNames(onTablet)).toContain('Trip to Japan');
    expect(words(onTablet)).toEqual(['ramen', 'sushi']);
    expect(onTablet.savedWords.find((item) => item.id === 'w-ramen')?.folderIds).toEqual(['trip']);
  });

  it('propagates an edit back to the original device', async () => {
    const library = await tablet.load();
    await tablet.save({
      ...library,
      folders: library.folders.map((item) => (item.id === 'trip' ? { ...item, name: 'Japan 2027' } : item)),
    });
    await tablet.sync();
    await phone.sync();

    expect(folderNames(await phone.load())).toContain('Japan 2027');
  });

  it('propagates deletions instead of resurrecting them', async () => {
    const library = await phone.load();
    await phone.save({ ...library, savedWords: library.savedWords.filter((item) => item.id !== 'w-sushi') });
    await phone.sync();
    await tablet.sync();

    expect(words(await tablet.load())).toEqual(['ramen']);

    // A later sync from the tablet must not push the word back.
    await tablet.sync();
    await phone.sync();
    expect(words(await phone.load())).toEqual(['ramen']);
  });

  it('resolves concurrent edits to the same row by the latest change', async () => {
    const onPhone = await phone.load();
    const onTablet = await tablet.load();
    await phone.save({
      ...onPhone,
      folders: onPhone.folders.map((item) => (item.id === 'trip' ? { ...item, name: 'Phone name' } : item)),
    });
    await tablet.save({
      ...onTablet,
      folders: onTablet.folders.map((item) => (item.id === 'trip' ? { ...item, name: 'Tablet name (later)' } : item)),
    });

    await phone.sync();
    await tablet.sync();
    await phone.sync();

    expect(folderNames(await phone.load())).toContain('Tablet name (later)');
    expect(folderNames(await tablet.load())).toContain('Tablet name (later)');
  });

  it('does not let a screen holding stale state delete words pulled after it loaded', async () => {
    const staleTabletScreen = await tablet.load();

    const library = await phone.load();
    const at = tick();
    await phone.save({ ...library, savedWords: [...library.savedWords, word('w-udon', 'udon', ['trip'], at)] });
    await phone.sync();
    await tablet.sync();

    // The stale screen saves an unrelated change without knowing about "udon".
    await tablet.save({
      ...staleTabletScreen,
      folders: staleTabletScreen.folders.map((item) => (item.id === 'trip' ? { ...item, colorNote: 'edited' } : item)),
    });
    await tablet.sync();
    await phone.sync();

    expect(words(await tablet.load())).toContain('udon');
    expect(words(await phone.load())).toContain('udon');
  });
});

describe('Cloud Sync of the profile', () => {
  it('shares learning settings but keeps device-only settings on each device', async () => {
    const phone = createDevice(ALICE);
    const tablet = createDevice(ALICE);
    await tablet.loadProfile();
    await tablet.saveProfile({ ...(await tablet.loadProfile()), appLockEnabled: true });

    const profile = await phone.loadProfile();
    await phone.saveProfile({ ...profile, dailyGoal: '30 phút', displayName: 'Lan' });
    await phone.sync();
    await tablet.sync();

    const onTablet = await tablet.loadProfile();
    expect(onTablet).toMatchObject({ dailyGoal: '30 phút', displayName: 'Lan' });
    expect(onTablet.appLockEnabled).toBe(true);
    expect((await phone.loadProfile()).appLockEnabled).toBe(false);
  });
});

describe('Cloud Sync of device-only profile settings', () => {
  it('does not let a device-only change push stale shared profile fields', async () => {
    const phone = createDevice(ALICE);
    const tablet = createDevice(ALICE);
    await phone.loadProfile();
    await tablet.loadProfile();
    await phone.sync();
    await tablet.sync();

    await phone.saveProfile({ ...(await phone.loadProfile()), displayName: 'Minh' });
    // Later, the tablet only toggles its own app lock before it has pulled the new name.
    await tablet.saveProfile({ ...(await tablet.loadProfile()), appLockEnabled: true });

    await phone.sync();
    await tablet.sync();
    await phone.sync();

    expect((await tablet.loadProfile()).displayName).toBe('Minh');
    expect((await phone.loadProfile()).displayName).toBe('Minh');
    expect((await tablet.loadProfile()).appLockEnabled).toBe(true);
  });
});

describe('Cloud Sync isolation between accounts', () => {
  it('never shows one account’s rows to another account', async () => {
    const bobPhone = createDevice(BOB);
    await bobPhone.load();
    await bobPhone.sync();

    const onBob = await bobPhone.load();
    expect(folderNames(onBob)).not.toContain('Tablet name (later)');
    expect(words(onBob)).toEqual([]);
  });
});
