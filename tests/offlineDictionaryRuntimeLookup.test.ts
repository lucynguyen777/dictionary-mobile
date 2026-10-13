import { describe, expect, it, vi } from 'vitest';

import type { OfflineDictionaryStorage, OfflinePackManifest } from '../data/offlineDictionaryImport';
import type { OfflineDictionaryEntry } from '../data/offlineDictionaryLookup';
import {
  fetchOfflineBilingualMeaning,
  fetchOfflineMonolingualMeaning,
  fetchOfflineRelatedWords,
  getReadyOfflinePackManifests,
} from '../data/offlineDictionaryRuntimeLookup';
import { type OfflineDictionaryPack, offlineDictionaryPacks } from '../data/offlineDictionaryPacks';

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

describe('offline pair packs (VI->FR)', () => {
  const pairPack = offlineDictionaryPacks.find((item) => item.id === 'frwiktionary-vi-fr-offline-pack-v1') as OfflineDictionaryPack;
  const monolingualVi: OfflineDictionaryPack = {
    ...pairPack,
    glossLanguageCode: undefined,
    id: 'viwiktionary-vi-offline-pack-v1',
    sourceName: 'viwiktionary',
  };
  const pairEntry: OfflineDictionaryEntry = {
    ...entry,
    attribution: 'Source: frwiktionary (CC-BY-SA-4.0/GFDL)',
    definitions: [{ gloss: 'Maison; demeure.', tags: [], topics: [] }],
    examples: [{ source: 'nhà gạch', translation: 'Maison en briques', translationLanguage: 'fr' }],
    glossLangCode: 'fr',
    id: 'vi:nhà',
    langCode: 'vi',
    normalizedWord: 'nhà',
    sourceName: 'frwiktionary',
    word: 'nhà',
  };
  const ready = (packId: string) => ({
    downloadProgress: 1,
    entryCount: 1,
    errorMessage: '',
    installedAt: timestamp,
    languageCode: 'vi' as const,
    localUri: `sqlite://${packId}`,
    packId,
    status: 'ready' as const,
    updatedAt: timestamp,
  });

  it('is builder-ready but not downloadable or installed by default', () => {
    expect(pairPack).toMatchObject({ glossLanguageCode: 'fr', languageCode: 'vi', status: 'builder_ready' });
    expect(pairPack.downloadSource).toBeUndefined();
    expect(pairPack.attribution).toContain('CC-BY-SA-4.0/GFDL');
  });

  it('answers VI->FR bilingual lookups with French definitions from the pair pack only', async () => {
    const storageFactory = vi.fn(async (_manifests: OfflinePackManifest[]) => createFakeStorage(pairEntry));
    const loadState = async () => ({ records: [ready(pairPack.id), ready(monolingualVi.id)] });
    const packs = [pairPack, monolingualVi];

    await expect(fetchOfflineBilingualMeaning('nhà', 'vi', 'fr', { loadState, packs, storageFactory })).resolves.toMatchObject({
      definitions: [{ examples: [{ translationLanguage: 'fr' }], meaning: 'Maison; demeure.', source: 'Source: frwiktionary (CC-BY-SA-4.0/GFDL)' }],
      source: 'frwiktionary offline pack',
      word: 'nhà',
    });
    expect(storageFactory).toHaveBeenLastCalledWith([expect.objectContaining({ glossLangCode: 'fr', packId: pairPack.id })]);

    // A Vietnamese monolingual lookup must not read the pair pack's French definitions.
    await fetchOfflineMonolingualMeaning('nhà', 'vi', { loadState, packs, storageFactory });
    expect(storageFactory).toHaveBeenLastCalledWith([expect.objectContaining({ packId: monolingualVi.id })]);
    expect(storageFactory.mock.lastCall?.[0]).toHaveLength(1);
  });

  it('returns null without an installed pair pack', async () => {
    const storageFactory = vi.fn(async () => createFakeStorage(pairEntry));
    await expect(
      fetchOfflineBilingualMeaning('nhà', 'vi', 'fr', { loadState: async () => ({ records: [ready(monolingualVi.id)] }), packs: [pairPack, monolingualVi], storageFactory })
    ).resolves.toBeNull();
    expect(storageFactory).not.toHaveBeenCalled();
  });
});

function createFakeStorage(result: OfflineDictionaryEntry | null): OfflineDictionaryStorage {
  return {
    deletePack: vi.fn(),
    findEntry: vi.fn(async () => result),
    importPack: vi.fn(),
  };
}
