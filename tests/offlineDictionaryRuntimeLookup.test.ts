import { describe, expect, it, vi } from 'vitest';

import type { OfflineDictionaryStorage } from '../data/offlineDictionaryImport';
import type { OfflineDictionaryEntry } from '../data/offlineDictionaryLookup';
import {
  fetchOfflineMonolingualMeaning,
  fetchOfflineRelatedWords,
  getReadyOfflinePackManifests,
} from '../data/offlineDictionaryRuntimeLookup';
import { offlineDictionaryPacks } from '../data/offlineDictionaryPacks';

const pack = offlineDictionaryPacks[0];
const timestamp = '2026-05-21T21:00:00.000Z';

const entry: OfflineDictionaryEntry = {
  attribution: 'Source: enwiktionary (CC-BY-SA-4.0/GFDL)',
  audio: ['book.mp3'],
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
    antonyms: ['scroll'],
    synonyms: ['volume'],
  },
  sourceName: 'enwiktionary',
  sourceUrl: 'https://kaikki.org/dictionary/rawdata.html',
  updatedAt: timestamp,
  word: 'Book',
};

describe('offlineDictionaryRuntimeLookup', () => {
  it('builds ready pack manifests from persisted install state', () => {
    expect(
      getReadyOfflinePackManifests({
        records: [
          {
            downloadProgress: 1,
            entryCount: 1,
            errorMessage: '',
            installedAt: timestamp,
            languageCode: 'en',
            localUri: `sqlite://${pack.id}`,
            packId: pack.id,
            status: 'ready',
            updatedAt: timestamp,
          },
          {
            downloadProgress: 1,
            entryCount: 1,
            errorMessage: '',
            installedAt: timestamp,
            languageCode: 'en',
            localUri: '',
            packId: 'missing-pack',
            status: 'ready',
            updatedAt: timestamp,
          },
        ],
      })
    ).toEqual([
      {
        entryCount: 1,
        generatedAt: timestamp,
        langCode: 'en',
        license: 'CC-BY-SA-4.0/GFDL',
        packId: pack.id,
        schemaVersion: 1,
        sourceName: 'enwiktionary',
        sourceUrl: '/offline-packs/enwiktionary-lite/entries.json',
      },
    ]);
  });

  it('returns offline meaning and related words from ready SQLite storage', async () => {
    const storageFactory = vi.fn(async () => createFakeStorage(entry));
    const loadState = vi.fn(async () => ({
      records: [
        {
          downloadProgress: 1,
          entryCount: 1,
          errorMessage: '',
          installedAt: timestamp,
          languageCode: 'en',
          localUri: `sqlite://${pack.id}`,
          packId: pack.id,
          status: 'ready' as const,
          updatedAt: timestamp,
        },
      ],
    }));

    await expect(fetchOfflineMonolingualMeaning('books', 'en', { loadState, storageFactory })).resolves.toMatchObject({
      definitions: [
        {
          meaning: 'A set of written pages.',
          source: 'Source: enwiktionary (CC-BY-SA-4.0/GFDL)',
        },
      ],
      source: 'enwiktionary offline pack · base form of books',
      word: 'Book',
    });
    await expect(fetchOfflineRelatedWords('books', 'en', { loadState, storageFactory })).resolves.toEqual({
      antonyms: ['scroll'],
      synonyms: ['volume'],
    });
    expect(storageFactory).toHaveBeenCalledWith([
      expect.objectContaining({
        langCode: 'en',
        packId: pack.id,
      }),
    ]);
  });

  it('skips storage when no ready pack exists and swallows offline runtime failures', async () => {
    const storageFactory = vi.fn(async () => createFakeStorage(entry));

    await expect(
      fetchOfflineMonolingualMeaning('book', 'en', {
        loadState: async () => ({
          records: [],
        }),
        storageFactory,
      })
    ).resolves.toBeNull();
    expect(storageFactory).not.toHaveBeenCalled();

    await expect(
      fetchOfflineMonolingualMeaning('book', 'en', {
        loadState: async () => ({
          records: [
            {
              downloadProgress: 1,
              entryCount: 1,
              errorMessage: '',
              installedAt: timestamp,
              languageCode: 'en',
              localUri: `sqlite://${pack.id}`,
              packId: pack.id,
              status: 'ready',
              updatedAt: timestamp,
            },
          ],
        }),
        storageFactory: async () => {
          throw new Error('SQLite unavailable on web');
        },
      })
    ).resolves.toBeNull();
  });
});

function createFakeStorage(result: OfflineDictionaryEntry | null): OfflineDictionaryStorage {
  return {
    deletePack: vi.fn(),
    findEntry: vi.fn(async () => result),
    importPack: vi.fn(),
  };
}
