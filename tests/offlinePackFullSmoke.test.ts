// Opt-in smoke for a full-size pack built from a whole dump (plan 6.3/6.4, sizing for D9). Skipped
// unless OFFLINE_PACK_DIR points at a build-offline-pack.mjs output directory:
//   OFFLINE_PACK_DIR=/path/to/ko-full OFFLINE_PACK_LANG=ko OFFLINE_PACK_PROBES=data/headword-lists/korean-promotion-100.txt \
//     npm test -- --run tests/offlinePackFullSmoke.test.ts
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

vi.mock('../data/storageAdapter', () => {
  const storage = new Map<string, string>();
  return {
    getStoredItem: async (key: string) => storage.get(key) ?? null,
    removeStoredItem: async (key: string) => void storage.delete(key),
    setStoredItem: async (key: string, value: string) => void storage.set(key, value),
  };
});

import type { LanguageCode } from '../data/languages';
import { importOfflineDictionaryPack } from '../data/offlineDictionaryImport';
import { readOfflinePackEntries } from '../data/offlineDictionaryPackActions';
import { getDefaultOfflinePackInstallState } from '../data/offlineDictionaryPackStore';
import { createExpoSqliteOfflineDictionaryStorage, type OfflineSqliteDatabase } from '../data/offlineDictionarySqliteStorage';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
const dir = process.env.OFFLINE_PACK_DIR;
const lang = (process.env.OFFLINE_PACK_LANG ?? '') as LanguageCode;
const probesPath = process.env.OFFLINE_PACK_PROBES;

describe.skipIf(!dir || !lang || !probesPath)('full offline pack smoke', () => {
  it('imports the whole pack into a SQLite file and finds the probes', async () => {
    const workDir = mkdtempSync(join(tmpdir(), 'offline-pack-'));
    const databases = new Map<string, InstanceType<typeof DatabaseSync>>();
    const openDatabase = async (name: string): Promise<OfflineSqliteDatabase> => {
      if (!databases.has(name)) databases.set(name, new DatabaseSync(join(workDir, name)));
      const database = databases.get(name)!;
      return {
        databasePath: join(workDir, name),
        execAsync: async (source) => void database.exec(source),
        getFirstAsync: async <T>(source: string, ...params: unknown[]) => (database.prepare(source).get(...(params as never[])) as T | undefined) ?? null,
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

    try {
      const manifest = JSON.parse(readFileSync(join(dir!, 'manifest.json'), 'utf8'));
      const started = Date.now();
      const entries = await readOfflinePackEntries(
        { readBytes: async () => new Uint8Array(readFileSync(join(dir!, 'entries.json.gz'))), readText: async () => '' },
        join(dir!, 'entries.json.gz'),
        lang
      );
      const decoded = Date.now();
      const storage = createExpoSqliteOfflineDictionaryStorage({ deleteDatabase: async () => undefined, openDatabase });
      const state = await importOfflineDictionaryPack({
        clock: () => new Date().toISOString(),
        entries,
        manifest,
        pack: {
          attribution: `Source: ${manifest.sourceName} via Kaikki/Wiktextract (CC-BY-SA-4.0/GFDL)`,
          estimatedCompressedSizeMb: { max: 1, min: 1 },
          id: manifest.packId,
          languageCode: lang,
          license: 'CC-BY-SA-4.0/GFDL',
          sourceName: manifest.sourceName,
          status: 'builder_ready',
        },
        state: getDefaultOfflinePackInstallState(),
        storage,
      });
      const imported = Date.now();
      expect(state.records.find((record) => record.packId === manifest.packId)?.status).toBe('ready');

      const probes = readFileSync(probesPath!, 'utf8').split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('#'))
        .map((line) => ({ kind: line.split('|')[2]?.trim() ?? 'headword', word: line.split('|')[0].trim() }));
      const lookupStarted = Date.now();
      const results = [];
      for (const probe of probes) results.push({ ...probe, found: Boolean(await storage.findEntry(probe.word, lang)) });
      const lookupMs = (Date.now() - lookupStarted) / probes.length;
      const headwords = results.filter((result) => result.kind === 'headword');
      const headwordRate = headwords.filter((result) => result.found).length / headwords.length;

      databases.forEach((database) => database.close());
      const databaseBytes = [...databases.keys()].reduce((sum, name) => sum + statSync(join(workDir, name)).size, 0);
      console.log(JSON.stringify({
        averageLookupMs: Math.round(lookupMs * 10) / 10,
        databaseMb: Math.round(databaseBytes / 1e5) / 10,
        decodeSeconds: (decoded - started) / 1000,
        downloadMb: Math.round(statSync(join(dir!, 'entries.json.gz')).size / 1e5) / 10,
        entries: entries.length,
        headwordProbesFound: `${Math.round(headwordRate * 100)}%`,
        importSeconds: (imported - decoded) / 1000,
        missing: results.filter((result) => !result.found).map((result) => result.word),
      }));
      expect(headwordRate).toBeGreaterThanOrEqual(0.95);
    } finally {
      rmSync(workDir, { force: true, recursive: true });
    }
  }, 600_000);
});
