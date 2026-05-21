import { describe, expect, it } from 'vitest';

import type { OfflineDictionarySqliteRow, OfflinePackManifest } from '../data/offlineDictionaryImport';
import type { OfflineDictionaryEntry } from '../data/offlineDictionaryLookup';
import {
  type OfflineSqliteDatabase,
  createExpoSqliteOfflineDictionaryStorage,
  getOfflineDictionaryDatabaseName,
} from '../data/offlineDictionarySqliteStorage';
import { offlineDictionaryPacks } from '../data/offlineDictionaryPacks';

const pack = offlineDictionaryPacks[0];
const timestamp = '2026-05-21T18:00:00.000Z';

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
  examples: [{ source: 'I borrowed two books.' }],
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

describe('offlineDictionarySqliteStorage', () => {
  it('uses deterministic SQLite database names for pack ids', () => {
    expect(getOfflineDictionaryDatabaseName(' EN Wiktionary Pack / v1 ')).toBe('offline-en-wiktionary-pack-v1.sqlite');
    expect(getOfflineDictionaryDatabaseName('!!!')).toBe('offline-pack.sqlite');
  });

  it('imports a pack through schema setup and a SQLite transaction', async () => {
    const harness = createFakeSqliteHarness();
    const storage = createExpoSqliteOfflineDictionaryStorage({
      deleteDatabase: harness.deleteDatabase,
      openDatabase: harness.openDatabase,
    });

    await expect(storage.importPack(manifest, [entry])).resolves.toEqual({
      databaseUri: `sqlite://${getOfflineDictionaryDatabaseName(pack.id)}`,
      entryCount: 1,
    });

    const database = harness.requireDatabase(getOfflineDictionaryDatabaseName(pack.id));

    expect(database.execStatements.join('\n')).toContain('CREATE TABLE IF NOT EXISTS offline_pack_meta');
    expect(database.transactionCount).toBe(1);
    expect(database.metaRows.get('pack_id')).toBe(pack.id);
    expect(database.metaRows.get('entry_count')).toBe('1');
    expect(database.rows).toHaveLength(1);
    expect(database.rows[0]).toMatchObject({
      lang_code: 'en',
      normalized_word: 'book',
      word: 'Book',
    });
  });

  it('queries persisted rows by exact and morphology lookup candidates', async () => {
    const harness = createFakeSqliteHarness();
    const storage = createExpoSqliteOfflineDictionaryStorage({
      deleteDatabase: harness.deleteDatabase,
      openDatabase: harness.openDatabase,
    });

    await storage.importPack(manifest, [entry]);

    const restartedStorage = createExpoSqliteOfflineDictionaryStorage({
      deleteDatabase: harness.deleteDatabase,
      initialManifests: [manifest],
      openDatabase: harness.openDatabase,
    });

    await expect(restartedStorage.findEntry('Book', 'en')).resolves.toMatchObject({
      normalizedWord: 'book',
      word: 'Book',
    });
    await expect(restartedStorage.findEntry('books', 'en')).resolves.toMatchObject({
      normalizedWord: 'book',
      word: 'Book',
    });
    await expect(restartedStorage.findEntry('book', 'fr')).resolves.toBeNull();
  });

  it('deletes pack databases and clears lookup routing state', async () => {
    const harness = createFakeSqliteHarness();
    const storage = createExpoSqliteOfflineDictionaryStorage({
      deleteDatabase: harness.deleteDatabase,
      openDatabase: harness.openDatabase,
    });

    await storage.importPack(manifest, [entry]);
    await storage.deletePack(pack.id);

    expect(harness.deletedDatabaseNames).toEqual([getOfflineDictionaryDatabaseName(pack.id)]);
    await expect(storage.findEntry('book', 'en')).resolves.toBeNull();
  });
});

function createFakeSqliteHarness() {
  const databases = new Map<string, FakeOfflineSqliteDatabase>();
  const deletedDatabaseNames: string[] = [];

  const openDatabase = async (databaseName: string) => {
    const database = databases.get(databaseName) ?? new FakeOfflineSqliteDatabase(databaseName);
    databases.set(databaseName, database);
    return database;
  };

  const deleteDatabase = async (databaseName: string) => {
    deletedDatabaseNames.push(databaseName);
    databases.delete(databaseName);
  };

  return {
    deleteDatabase,
    deletedDatabaseNames,
    openDatabase,
    requireDatabase(databaseName: string) {
      const database = databases.get(databaseName);
      if (!database) throw new Error(`Missing fake database ${databaseName}`);

      return database;
    },
  };
}

class FakeOfflineSqliteDatabase implements OfflineSqliteDatabase {
  readonly databasePath: string;
  readonly execStatements: string[] = [];
  readonly metaRows = new Map<string, string>();
  readonly rows: OfflineDictionarySqliteRow[] = [];
  closeCount = 0;
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

  async getFirstAsync<T>(_source: string, ...params: unknown[]) {
    const [languageCode, normalizedWord, lowerWord] = params;
    const row =
      this.rows.find(
        (item) =>
          item.lang_code === languageCode &&
          (item.normalized_word === normalizedWord || item.word.toLocaleLowerCase() === lowerWord)
      ) ?? null;

    return row as T | null;
  }

  async runAsync(source: string, ...params: unknown[]) {
    const normalizedSql = source.trim().replace(/\s+/g, ' ').toLocaleUpperCase();

    if (normalizedSql.startsWith('DELETE FROM OFFLINE_PACK_META')) {
      this.metaRows.clear();
      return;
    }

    if (normalizedSql.startsWith('DELETE FROM DICTIONARY_ENTRY')) {
      this.rows.splice(0, this.rows.length);
      return;
    }

    if (normalizedSql.startsWith('INSERT OR REPLACE INTO OFFLINE_PACK_META')) {
      const [key, value] = params;
      this.metaRows.set(String(key), String(value));
      return;
    }

    if (normalizedSql.startsWith('INSERT OR REPLACE INTO DICTIONARY_ENTRY')) {
      const [
        id,
        langCode,
        word,
        normalizedWord,
        partOfSpeech,
        definitionsJson,
        ipa,
        audioJson,
        examplesJson,
        relationsJson,
        etymology,
        sourceName,
        sourceUrl,
        license,
        attribution,
        updatedAt,
      ] = params;

      this.rows.push({
        attribution: String(attribution),
        audio_json: String(audioJson),
        definitions_json: String(definitionsJson),
        etymology: String(etymology),
        examples_json: String(examplesJson),
        id: String(id),
        ipa: String(ipa),
        lang_code: langCode as OfflineDictionarySqliteRow['lang_code'],
        license: license as OfflineDictionarySqliteRow['license'],
        normalized_word: String(normalizedWord),
        part_of_speech: String(partOfSpeech),
        relations_json: String(relationsJson),
        source_name: String(sourceName),
        source_url: String(sourceUrl),
        updated_at: String(updatedAt),
        word: String(word),
      });
    }
  }

  async withTransactionAsync(task: () => Promise<void>) {
    this.transactionCount += 1;
    await task();
  }
}
