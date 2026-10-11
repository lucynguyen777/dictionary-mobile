const device = vi.hoisted(() => ({ storage: new Map<string, string>() }));
vi.mock('../data/storageAdapter', () => ({
  getStoredItem: async (key: string) => device.storage.get(key) ?? null,
  removeStoredItem: async (key: string) => {
    device.storage.delete(key);
  },
  setStoredItem: async (key: string, value: string) => {
    device.storage.set(key, value);
  },
}));

import type { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  LEGACY_SPECIALIZED_GLOSSARY_STORAGE_KEY,
  loadSpecializedGlossaries,
  loadSpecializedGlossaryRecords,
  saveSpecializedGlossary,
} from '../data/specializedGlossaryStore';
import { createSupabaseGlossaryRemote, syncSpecializedGlossaries, type SpecializedGlossaryRemote } from '../data/specializedGlossarySync';
import { createPgliteQueryClient } from './helpers/pgliteQueryBuilder';
import { createAuthUser, createSupabaseTestDatabase } from './helpers/supabaseTestDatabase';

const ALICE = '00000000-0000-4000-8000-0000000000c1';
const BOB = '00000000-0000-4000-8000-0000000000c2';

let db: PGlite;
const phone = new Map<string, string>();
const laptop = new Map<string, string>();

beforeAll(async () => {
  db = await createSupabaseTestDatabase();
  await createAuthUser(db, ALICE);
  await createAuthUser(db, BOB);
}, 60_000);

function remoteFor(userId: string) {
  return createSupabaseGlossaryRemote(createPgliteQueryClient(db, userId));
}

async function on<T>(storage: Map<string, string>, run: () => Promise<T>) {
  device.storage = storage;
  return run();
}

describe('specialized glossary sync (Postgres + RLS)', () => {
  it('uploads from one device and downloads on another, carrying only valid terms', async () => {
    await on(phone, () => saveSpecializedGlossary('medical', '# my notes\nMRI → cộng hưởng từ\nECG → điện tâm đồ\nbroken', '2026-10-11T08:00:00.000Z'));
    expect(await on(phone, () => syncSpecializedGlossaries(remoteFor(ALICE)))).toEqual({ pulled: [], pushed: ['medical'] });

    expect(await on(laptop, () => syncSpecializedGlossaries(remoteFor(ALICE)))).toEqual({ pulled: ['medical'], pushed: [] });
    expect((await on(laptop, loadSpecializedGlossaries)).medical).toBe('ECG → điện tâm đồ\nMRI → cộng hưởng từ');

    // Nothing changed since: both devices are quiet, and the phone keeps its comment line.
    expect(await on(phone, () => syncSpecializedGlossaries(remoteFor(ALICE)))).toEqual({ pulled: [], pushed: [] });
    expect((await on(phone, loadSpecializedGlossaries)).medical).toContain('# my notes');
  });

  it('propagates edits and removed terms', async () => {
    await on(laptop, () => saveSpecializedGlossary('medical', 'MRI → chụp cộng hưởng từ', '2026-10-11T09:00:00.000Z'));
    await on(laptop, () => syncSpecializedGlossaries(remoteFor(ALICE)));
    await on(phone, () => syncSpecializedGlossaries(remoteFor(ALICE)));

    expect((await on(phone, loadSpecializedGlossaries)).medical).toBe('MRI → chụp cộng hưởng từ');
    const rows = await db.query('select source_term from public.user_glossary_entries where user_id = $1', [ALICE]);
    expect(rows.rows).toEqual([{ source_term: 'MRI' }]);
  });

  it('resolves concurrent edits by the latest change', async () => {
    await on(phone, () => saveSpecializedGlossary('legal', 'tort → phone version', '2026-10-11T10:00:00.000Z'));
    await on(laptop, () => saveSpecializedGlossary('legal', 'tort → laptop version', '2026-10-11T10:05:00.000Z'));

    // The older edit syncs first, then the newer one overwrites it everywhere.
    await on(phone, () => syncSpecializedGlossaries(remoteFor(ALICE)));
    expect(await on(laptop, () => syncSpecializedGlossaries(remoteFor(ALICE)))).toMatchObject({ pushed: ['legal'] });
    await on(phone, () => syncSpecializedGlossaries(remoteFor(ALICE)));
    expect((await on(phone, loadSpecializedGlossaries)).legal).toBe('tort → laptop version');

    // A stale edit that syncs after a newer remote version loses.
    await on(phone, () => saveSpecializedGlossary('tech', 'API → old', '2026-10-11T11:00:00.000Z'));
    await on(laptop, () => saveSpecializedGlossary('tech', 'API → new', '2026-10-11T11:30:00.000Z'));
    await on(laptop, () => syncSpecializedGlossaries(remoteFor(ALICE)));
    expect(await on(phone, () => syncSpecializedGlossaries(remoteFor(ALICE)))).toMatchObject({ pulled: ['tech'] });
    expect((await on(phone, loadSpecializedGlossaries)).tech).toBe('API → new');
  });

  it('keeps accounts apart', async () => {
    const bobDevice = new Map<string, string>();
    expect(await on(bobDevice, () => syncSpecializedGlossaries(remoteFor(BOB)))).toEqual({ pulled: [], pushed: [] });
    expect(await on(bobDevice, loadSpecializedGlossaries)).toEqual({});
  });

  it('never overwrites an edit made while the sync was uploading', async () => {
    const tablet = new Map<string, string>();
    await on(tablet, () => saveSpecializedGlossary('academic', 'thesis → luận văn', '2026-10-11T12:00:00.000Z'));
    const real = remoteFor(ALICE);
    const racing: SpecializedGlossaryRemote = {
      ...real,
      async replaceGlossary(domainId, terms, updatedAt) {
        await real.replaceGlossary(domainId, terms, updatedAt);
        await saveSpecializedGlossary('academic', 'thesis → luận án', '2026-10-11T12:00:05.000Z');
      },
    };

    // The tablet also receives Alice's other glossaries, but the racing upload is not marked synced.
    expect((await on(tablet, () => syncSpecializedGlossaries(racing))).pushed).toEqual([]);
    const record = (await on(tablet, loadSpecializedGlossaryRecords)).academic!;
    expect(record.text).toBe('thesis → luận án');
    expect(record.syncedAt).toBeNull();
    expect(await on(tablet, () => syncSpecializedGlossaries(real))).toMatchObject({ pushed: ['academic'] });
  });

  it('uploads glossaries saved by the previous app version', async () => {
    const oldPhone = new Map([[LEGACY_SPECIALIZED_GLOSSARY_STORAGE_KEY, JSON.stringify({ general: 'hello → xin chào', bogus: 'x → y' })]]);
    expect(await on(oldPhone, () => syncSpecializedGlossaries(remoteFor(BOB)))).toEqual({ pulled: [], pushed: ['general'] });
    expect(oldPhone.has(LEGACY_SPECIALIZED_GLOSSARY_STORAGE_KEY)).toBe(false);
  });
});
