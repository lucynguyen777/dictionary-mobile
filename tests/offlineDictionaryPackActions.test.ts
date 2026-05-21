import { gzip } from 'pako';
import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import {
  type OfflinePackFileReader,
  deleteInstalledOfflineDictionaryPack,
  installOfflineDictionaryPackFromSource,
  readOfflinePackEntries,
} from '../data/offlineDictionaryPackActions';
import type { OfflinePackDownloadFileSystem, OfflinePackDownloadSource } from '../data/offlineDictionaryPackDownload';
import {
  type OfflinePackManifest,
  createMemoryOfflineDictionaryStorage,
} from '../data/offlineDictionaryImport';
import type { OfflineDictionaryEntry } from '../data/offlineDictionaryLookup';
import {
  getDefaultOfflinePackInstallState,
  getOfflinePackInstallRecord,
} from '../data/offlineDictionaryPackStore';
import { englishOfflinePackDevSource, offlineDictionaryPacks } from '../data/offlineDictionaryPacks';

const pack = offlineDictionaryPacks[0];
const timestamp = '2026-05-21T20:00:00.000Z';

const source: OfflinePackDownloadSource = {
  entriesMd5: 'entries-md5',
  entriesUrl: 'https://example.com/offline/entries.json.gz',
  entryCount: 1,
  manifestMd5: 'manifest-md5',
  manifestUrl: 'https://example.com/offline/manifest.json',
};

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
  audio: [],
  definitions: [
    {
      gloss: 'A set of written pages.',
      tags: [],
      topics: ['education'],
    },
  ],
  etymology: '',
  examples: [],
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

describe('offlineDictionaryPackActions', () => {
  beforeEach(() => {
    storageAdapter.clear();
  });

  it('downloads, reads, imports, and cleans up an offline pack', async () => {
    const fileSystem = createFakeActionFileSystem();
    const fileReader = createFakeFileReader({
      bytesByUri: {
        'file:///offline/entries.json.gz': gzip(JSON.stringify([entry])),
      },
      textByUri: {
        'file:///offline/manifest.json': JSON.stringify(manifest),
      },
    });
    const storage = createMemoryOfflineDictionaryStorage();

    const result = await installOfflineDictionaryPackFromSource({
      clock: () => timestamp,
      fileReader,
      fileSystem,
      pack,
      source,
      state: getDefaultOfflinePackInstallState(),
      storage,
    });

    expect(result).toMatchObject({
      entryCount: 1,
      ok: true,
    });
    if (!result.ok) throw new Error('Expected successful install');

    expect(fileSystem.downloads).toEqual([
      ['https://example.com/offline/manifest.json', 'manifest.json'],
      ['https://example.com/offline/entries.json.gz', 'entries.json.gz'],
    ]);
    expect(fileSystem.deletedUris).toEqual(['file:///offline/entries.json.gz', 'file:///offline/manifest.json']);
    expect(getOfflinePackInstallRecord(result.state, pack)).toMatchObject({
      downloadProgress: 1,
      entryCount: 1,
      localUri: `memory://${pack.id}.sqlite`,
      status: 'ready',
    });
    await expect(storage.findEntry('books', 'en')).resolves.toMatchObject({
      normalizedWord: 'book',
    });
  });

  it('smokes the hosted English dev pack fixture through download, manifest parse, and import', async () => {
    const fileSystem = createPublicFixtureDownloadFileSystem();
    const fileReader = createPublicFixtureFileReader();
    const storage = createMemoryOfflineDictionaryStorage();

    const result = await installOfflineDictionaryPackFromSource({
      clock: () => timestamp,
      fileReader,
      fileSystem,
      pack,
      source: englishOfflinePackDevSource,
      state: getDefaultOfflinePackInstallState(),
      storage,
    });

    if (!result.ok) throw new Error(result.errorMessage);
    expect(result).toMatchObject({
      entryCount: 2,
      ok: true,
    });

    expect(fileSystem.downloads).toEqual([
      ['/offline-packs/enwiktionary-lite/manifest.json', 'manifest.json'],
      ['/offline-packs/enwiktionary-lite/entries.json', 'entries.json'],
    ]);
    expect(getOfflinePackInstallRecord(result.state, pack)).toMatchObject({
      entryCount: 2,
      localUri: `memory://${pack.id}.sqlite`,
      status: 'ready',
    });
    await expect(storage.findEntry('articulate', 'en')).resolves.toMatchObject({
      normalizedWord: 'articulate',
      word: 'articulate',
    });
  });

  it('marks install failed when no download source is configured', async () => {
    const result = await installOfflineDictionaryPackFromSource({
      clock: () => timestamp,
      pack: {
        ...pack,
        downloadSource: undefined,
      },
      state: getDefaultOfflinePackInstallState(),
      storage: createMemoryOfflineDictionaryStorage(),
    });

    expect(result).toMatchObject({
      errorMessage: 'Offline pack source URL is not configured.',
      ok: false,
    });
    if (result.ok) throw new Error('Expected failed install');
    expect(getOfflinePackInstallRecord(result.state, pack)).toMatchObject({
      errorMessage: 'Offline pack source URL is not configured.',
      status: 'failed',
    });
  });

  it('deletes the SQLite pack and clears install state', async () => {
    const storage = {
      deletePack: vi.fn(async () => undefined),
      findEntry: vi.fn(),
      importPack: vi.fn(),
    };
    const installedState = {
      records: [
        {
          downloadProgress: 1,
          entryCount: 1,
          errorMessage: '',
          installedAt: timestamp,
          languageCode: pack.languageCode,
          localUri: `memory://${pack.id}.sqlite`,
          packId: pack.id,
          status: 'ready' as const,
          updatedAt: timestamp,
        },
      ],
    };

    const nextState = await deleteInstalledOfflineDictionaryPack({
      pack,
      state: installedState,
      storage,
    });

    expect(storage.deletePack).toHaveBeenCalledWith(pack.id);
    expect(nextState.records).toHaveLength(0);
  });

  it('reads gzipped entries from downloaded pack files', async () => {
    const fileReader = createFakeFileReader({
      bytesByUri: {
        'file:///offline/entries.json.gz': gzip(JSON.stringify([entry])),
      },
      textByUri: {},
    });

    await expect(readOfflinePackEntries(fileReader, 'file:///offline/entries.json.gz')).resolves.toMatchObject([
      {
        normalizedWord: 'book',
      },
    ]);
  });
});

function createFakeActionFileSystem() {
  const downloads: Array<[string, string]> = [];
  const deletedUris: string[] = [];

  return {
    deletedUris,
    downloads,
    async deleteFile(uri: string) {
      deletedUris.push(uri);
    },
    async downloadFile(url: string, fileName: string) {
      downloads.push([url, fileName]);

      return {
        md5: fileName === 'manifest.json' ? 'manifest-md5' : 'entries-md5',
        size: 128,
        uri: `file:///offline/${fileName}`,
      };
    },
  } satisfies OfflinePackDownloadFileSystem & {
    deletedUris: string[];
    downloads: Array<[string, string]>;
  };
}

function createPublicFixtureDownloadFileSystem() {
  const downloads: Array<[string, string]> = [];
  const deletedUris: string[] = [];

  return {
    deletedUris,
    downloads,
    async deleteFile(uri: string) {
      deletedUris.push(uri);
    },
    async downloadFile(url: string, fileName: string) {
      downloads.push([url, fileName]);

      return {
        md5: fileName === 'manifest.json' ? englishOfflinePackDevSource.manifestMd5 ?? '' : englishOfflinePackDevSource.entriesMd5,
        size: 128,
        uri: `fixture://${fileName}`,
      };
    },
  } satisfies OfflinePackDownloadFileSystem & {
    deletedUris: string[];
    downloads: Array<[string, string]>;
  };
}

function createPublicFixtureFileReader(): OfflinePackFileReader {
  return {
    async readBytes(uri: string) {
      return new Uint8Array(await readFile(getPublicFixturePath(uri)));
    },
    async readText(uri: string) {
      return readFile(getPublicFixturePath(uri), 'utf8');
    },
  };
}

function getPublicFixturePath(uri: string) {
  const fileName = uri.replace('fixture://', '');
  return `${process.cwd()}/public/offline-packs/enwiktionary-lite/${fileName}`;
}

function createFakeFileReader({
  bytesByUri,
  textByUri,
}: {
  bytesByUri: Record<string, Uint8Array>;
  textByUri: Record<string, string>;
}): OfflinePackFileReader {
  return {
    async readBytes(uri: string) {
      const bytes = bytesByUri[uri];
      if (!bytes) throw new Error(`Missing fake bytes ${uri}`);

      return bytes;
    },
    async readText(uri: string) {
      const text = textByUri[uri];
      if (!text) throw new Error(`Missing fake text ${uri}`);

      return text;
    },
  };
}
