import { describe, expect, it, vi } from 'vitest';

const storageAdapter = vi.hoisted(() => new Map<string, string>());

vi.mock('../data/storageAdapter', () => ({
  getStoredItem: vi.fn(async (key: string) => storageAdapter.get(key) ?? null),
  removeStoredItem: vi.fn(async (key: string) => {
    storageAdapter.delete(key);
  }),
  setStoredItem: vi.fn(async (key: string, value: string) => {
    storageAdapter.set(key, value);
  }),
}));

import type { OfflineDictionaryEntry } from '../data/offlineDictionaryLookup';
import {
  OFFLINE_DICTIONARY_SCHEMA_SQL,
  OfflinePackManifest,
  createMemoryOfflineDictionaryStorage,
  importOfflineDictionaryPack,
  parseOfflineEntryFromSqliteRow,
  serializeOfflineEntryForSqlite,
  validateOfflinePackManifest,
} from '../data/offlineDictionaryImport';
import { getDefaultOfflinePackInstallState, getOfflinePackInstallRecord } from '../data/offlineDictionaryPackStore';
import { offlineDictionaryPacks } from '../data/offlineDictionaryPacks';

const pack = offlineDictionaryPacks[0];
const timestamp = '2026-05-21T15:30:00.000Z';

const manifest: OfflinePackManifest = {
  entryCount: 1,
  generatedAt: timestamp,
  langCode: 'en',
  license: 'CC-BY-SA-4.0/GFDL',
  packId: pack.id,
  schemaVersion: 1,
  sourceName: 'enwiktionary',
  sourceUrl: 'https://kaikki.org/dictionary/rawdata.html',
};

const entry: OfflineDictionaryEntry = {
  attribution: 'Source: enwiktionary (CC-BY-SA-4.0/GFDL)',
  audio: ['book.mp3'],
  definitions: [
    {
      gloss: 'A set of written or printed pages.',
      tags: ['countable'],
      topics: ['education'],
    },
  ],
  etymology: '',
  examples: [{ source: 'I read a book.', translation: 'Tôi đọc một cuốn sách.' }],
  id: 'en:book',
  ipa: '/bʊk/',
  langCode: 'en',
  license: 'CC-BY-SA-4.0/GFDL',
  normalizedWord: 'book',
  partOfSpeech: 'noun',
  relations: {
    antonyms: [],
    synonyms: ['volume'],
  },
  sourceName: 'enwiktionary',
  sourceUrl: 'https://kaikki.org/dictionary/rawdata.html',
  updatedAt: timestamp,
  word: 'Book',
};

describe('offlineDictionaryImport', () => {
  it('keeps SQLite schema statements aligned with the documented pack tables', () => {
    expect(OFFLINE_DICTIONARY_SCHEMA_SQL.join('\n')).toContain('CREATE TABLE IF NOT EXISTS offline_pack_meta');
    expect(OFFLINE_DICTIONARY_SCHEMA_SQL.join('\n')).toContain('CREATE TABLE IF NOT EXISTS dictionary_entry');
    expect(OFFLINE_DICTIONARY_SCHEMA_SQL.join('\n')).toContain('CREATE VIRTUAL TABLE IF NOT EXISTS dictionary_entry_fts');
    expect(OFFLINE_DICTIONARY_SCHEMA_SQL.join('\n')).toContain('dictionary_entry_lang_word_idx');
  });

  it('serializes and parses entries through the SQLite row shape', () => {
    const row = serializeOfflineEntryForSqlite(entry);

    expect(row).toMatchObject({
      audio_json: '["book.mp3"]',
      definitions_json: JSON.stringify(entry.definitions),
      lang_code: 'en',
      normalized_word: 'book',
      relations_json: JSON.stringify(entry.relations),
    });
    expect(parseOfflineEntryFromSqliteRow(row)).toEqual(entry);
  });

  it('validates manifest compatibility before import', () => {
    expect(validateOfflinePackManifest(pack, manifest, [entry])).toEqual([]);
    expect(
      validateOfflinePackManifest(
        pack,
        {
          ...manifest,
          entryCount: 2,
          schemaVersion: 99,
        },
        [entry]
      )
    ).toEqual([
      'Unsupported offline pack schema version 99.',
      'Entry count mismatch: manifest has 2, entries file has 1.',
    ]);
  });

  it('imports a downloaded pack into storage and marks it ready', async () => {
    const storage = createMemoryOfflineDictionaryStorage();
    const state = await importOfflineDictionaryPack({
      clock: () => timestamp,
      entries: [entry],
      manifest,
      pack,
      state: getDefaultOfflinePackInstallState(),
      storage,
    });
    const record = getOfflinePackInstallRecord(state, pack);

    expect(record).toMatchObject({
      downloadProgress: 1,
      entryCount: 1,
      installedAt: timestamp,
      localUri: `memory://${pack.id}.sqlite`,
      status: 'ready',
      updatedAt: timestamp,
    });
    await expect(storage.findEntry('books', 'en')).resolves.toMatchObject({
      normalizedWord: 'book',
      word: 'Book',
    });
  });

  it('marks the pack failed when manifest validation or storage import fails', async () => {
    const invalidState = await importOfflineDictionaryPack({
      clock: () => timestamp,
      entries: [],
      manifest,
      pack,
      state: getDefaultOfflinePackInstallState(),
      storage: createMemoryOfflineDictionaryStorage(),
    });

    expect(getOfflinePackInstallRecord(invalidState, pack)).toMatchObject({
      errorMessage: 'Entry count mismatch: manifest has 1, entries file has 0.',
      status: 'failed',
    });

    const failingStorage = {
      deletePack: vi.fn(),
      findEntry: vi.fn(),
      importPack: vi.fn(async () => {
        throw new Error('SQLite transaction failed');
      }),
    };
    const failedState = await importOfflineDictionaryPack({
      clock: () => timestamp,
      entries: [entry],
      manifest,
      pack,
      state: getDefaultOfflinePackInstallState(),
      storage: failingStorage,
    });

    expect(getOfflinePackInstallRecord(failedState, pack)).toMatchObject({
      errorMessage: 'SQLite transaction failed',
      status: 'failed',
      updatedAt: timestamp,
    });
  });
});
