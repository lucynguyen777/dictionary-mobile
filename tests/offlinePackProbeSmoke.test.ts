import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

const installStorage = vi.hoisted(() => new Map<string, string>());
vi.mock('../data/storageAdapter', () => ({
  getStoredItem: async (key: string) => installStorage.get(key) ?? null,
  removeStoredItem: async (key: string) => {
    installStorage.delete(key);
  },
  setStoredItem: async (key: string, value: string) => {
    installStorage.set(key, value);
  },
}));

import type { LanguageCode } from '../data/languages';
import { importOfflineDictionaryPack } from '../data/offlineDictionaryImport';
import { readOfflinePackEntries } from '../data/offlineDictionaryPackActions';
import type { OfflineDictionaryPack } from '../data/offlineDictionaryPacks';
import { getDefaultOfflinePackInstallState } from '../data/offlineDictionaryPackStore';
import { createExpoSqliteOfflineDictionaryStorage, type OfflineSqliteDatabase } from '../data/offlineDictionarySqliteStorage';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

// Packs built from the real French/Spanish Wiktionary dumps, scoped to the 100 promotion probes
// (scripts/extract-kaikki-candidate.mjs --headwords …, then scripts/build-offline-pack.mjs).
const PACKS = [
  { dir: 'tests/fixtures/offline-packs/fr-probe-smoke', lang: 'fr', probes: 'data/headword-lists/french-promotion-100.txt' },
  { dir: 'tests/fixtures/offline-packs/es-probe-smoke', lang: 'es', probes: 'data/headword-lists/spanish-promotion-100.txt' },
] as const;

// The expo-sqlite subset the offline storage uses, on Node's built-in SQLite (FTS5 included).
function createNodeSqliteFiles() {
  const files = new Map<string, InstanceType<typeof DatabaseSync>>();
  const openDatabase = async (name: string): Promise<OfflineSqliteDatabase> => {
    if (!files.has(name)) files.set(name, new DatabaseSync(':memory:'));
    const database = files.get(name)!;
    return {
      databasePath: `sqlite://${name}`,
      execAsync: async (source) => {
        database.exec(source);
      },
      getFirstAsync: async <T>(source: string, ...params: unknown[]) =>
        (database.prepare(source).get(...(params as never[])) as T | undefined) ?? null,
      runAsync: async (source, ...params) => database.prepare(source).run(...(params.map((value) => (typeof value === 'boolean' ? Number(value) : value)) as never[])),
      withTransactionAsync: async (task) => {
        database.exec('BEGIN');
        try {
          await task();
          database.exec('COMMIT');
        } catch (error) {
          database.exec('ROLLBACK');
          throw error;
        }
      },
    };
  };
  return { deleteDatabase: async (name: string) => void files.delete(name), files, openDatabase };
}

function readProbes(path: string) {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const [word, , kind] = line.split('|');
      return { kind: kind?.trim() ?? 'headword', word: word.trim() };
    });
}

describe.each(PACKS)('offline pack smoke: $lang probes from Wiktionary', ({ dir, lang, probes }) => {
  it('imports, finds the promotion probes, keeps attribution, and deletes cleanly', async () => {
    const manifest = JSON.parse(readFileSync(`${dir}/manifest.json`, 'utf8'));
    const entries = await readOfflinePackEntries(
      { readBytes: async () => new Uint8Array(readFileSync(`${dir}/entries.json.gz`)), readText: async () => '' },
      `${dir}/entries.json.gz`,
      lang
    );
    expect(entries.length).toBe(manifest.entryCount);

    const sqlite = createNodeSqliteFiles();
    const storage = createExpoSqliteOfflineDictionaryStorage({ deleteDatabase: sqlite.deleteDatabase, openDatabase: sqlite.openDatabase });
    const pack: OfflineDictionaryPack = {
      attribution: `Source: ${manifest.sourceName} via Kaikki/Wiktextract (CC-BY-SA-4.0/GFDL)`,
      estimatedCompressedSizeMb: { max: 1, min: 1 },
      id: manifest.packId,
      languageCode: lang as LanguageCode,
      license: 'CC-BY-SA-4.0/GFDL',
      sourceName: manifest.sourceName,
      status: 'builder_ready',
    };
    const state = await importOfflineDictionaryPack({
      clock: () => '2026-10-11T00:00:00.000Z',
      entries,
      manifest,
      pack,
      state: getDefaultOfflinePackInstallState(),
      storage,
    });
    expect(state.records.find((record) => record.packId === pack.id)?.status).toBe('ready');

    const probeList = readProbes(probes);
    const results = await Promise.all(probeList.map(async (probe) => ({ ...probe, entry: await storage.findEntry(probe.word, lang as LanguageCode) })));
    const headwords = results.filter((result) => result.kind === 'headword');
    const inflected = results.filter((result) => result.kind !== 'headword');
    const found = (list: typeof results) => list.filter((result) => result.entry).length / Math.max(1, list.length);

    expect(found(headwords), `missing: ${headwords.filter((r) => !r.entry).map((r) => r.word).join(', ')}`).toBeGreaterThanOrEqual(0.95);
    if (inflected.length) {
      expect(found(inflected), `missing: ${inflected.filter((r) => !r.entry).map((r) => r.word).join(', ')}`).toBeGreaterThanOrEqual(0.85);
    }
    for (const { entry } of results) {
      if (!entry) continue;
      expect(entry.license).toBe('CC-BY-SA-4.0/GFDL');
      expect(entry.attribution).toContain('wiktionary');
      expect(entry.definitions.length).toBeGreaterThan(0);
    }

    await storage.deletePack(pack.id);
    expect(sqlite.files.size).toBe(0);
    await expect(storage.findEntry(probeList[0].word, lang as LanguageCode)).resolves.toBeNull();
  });
});
