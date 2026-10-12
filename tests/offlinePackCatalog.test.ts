const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('../data/storageAdapter', () => ({
  getStoredItem: async (key: string) => storage.get(key) ?? null,
  removeStoredItem: async (key: string) => {
    storage.delete(key);
  },
  setStoredItem: async (key: string, value: string) => {
    storage.set(key, value);
  },
}));

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadCachedOfflinePacks, mergeOfflinePacks, parseOfflinePackCatalog, refreshOfflinePacks, resolveOfflinePackCatalogUrl } from '../data/offlinePackCatalog';
import { offlineDictionaryPacks } from '../data/offlineDictionaryPacks';

const CATALOG_URL = 'https://cdn.example/packs/catalog.json';
const md5 = 'a'.repeat(32);
const frPack = {
  attribution: 'Source: frwiktionary via Kaikki/Wiktextract (CC-BY-SA-4.0/GFDL)',
  compressedSizeBytes: 12_400_000,
  entriesMd5: md5,
  entriesUrl: 'fr-v1/entries.json.gz',
  entryCount: 50_000,
  id: 'frwiktionary-fr-offline-pack-v1',
  languageCode: 'fr',
  license: 'CC-BY-SA-4.0/GFDL',
  manifestMd5: md5,
  manifestUrl: 'fr-v1/manifest.json',
  sourceName: 'frwiktionary',
};

beforeEach(() => storage.clear());

describe('offline pack catalog', () => {
  it('finds the catalog in the Supabase Storage bucket unless a URL is configured (D9)', () => {
    expect(resolveOfflinePackCatalogUrl(undefined, 'https://abc.supabase.co/')).toBe('https://abc.supabase.co/storage/v1/object/public/offline-packs/catalog.json');
    expect(resolveOfflinePackCatalogUrl(' https://cdn.example/catalog.json ', 'https://abc.supabase.co')).toBe('https://cdn.example/catalog.json');
    expect(resolveOfflinePackCatalogUrl(undefined, undefined)).toBe('');
  });

  it('resolves relative URLs against the catalog and keeps checksums', () => {
    const [pack] = parseOfflinePackCatalog({ packs: [frPack], schemaVersion: 1 }, CATALOG_URL);
    expect(pack).toMatchObject({
      downloadSource: {
        entriesMd5: md5,
        entriesUrl: 'https://cdn.example/packs/fr-v1/entries.json.gz',
        entryCount: 50_000,
        manifestUrl: 'https://cdn.example/packs/fr-v1/manifest.json',
      },
      estimatedCompressedSizeMb: { max: 12, min: 12 },
      languageCode: 'fr',
      status: 'builder_ready',
    });
  });

  it.each([
    ['plain-HTTP host', { entriesUrl: 'http://evil.example/entries.json.gz' }],
    ['bad checksum', { entriesMd5: 'nope' }],
    ['other licence', { license: 'proprietary' }],
    ['no attribution', { attribution: '' }],
    ['unknown language', { languageCode: 'xx' }],
    ['empty pack', { entryCount: 0 }],
  ])('drops a pack with %s', (_label, override) => {
    expect(parseOfflinePackCatalog({ packs: [{ ...frPack, ...override }], schemaVersion: 1 }, CATALOG_URL)).toEqual([]);
  });

  it('rejects unknown catalog versions', () => {
    expect(parseOfflinePackCatalog({ packs: [frPack], schemaVersion: 2 }, CATALOG_URL)).toEqual([]);
  });

  it('lets a hosted pack replace the bundled sample of the same language', () => {
    const hostedEnglish = parseOfflinePackCatalog({ packs: [{ ...frPack, id: 'enwiktionary-en-v2', languageCode: 'en' }], schemaVersion: 1 }, CATALOG_URL);
    const merged = mergeOfflinePacks(offlineDictionaryPacks, hostedEnglish);
    expect(merged.map((pack) => pack.id)).toEqual(['frwiktionary-vi-fr-offline-pack-v1', 'enwiktionary-en-v2']);
  });

  it('keys pair packs separately so a hosted Vietnamese pack does not replace the VI->FR pair pack', () => {
    const hosted = parseOfflinePackCatalog({
      packs: [
        { ...frPack, id: 'viwiktionary-vi-offline-pack-v1', languageCode: 'vi', sourceName: 'viwiktionary' },
        { ...frPack, glossLanguageCode: 'fr', id: 'frwiktionary-vi-fr-offline-pack-v2', languageCode: 'vi' },
      ],
      schemaVersion: 1,
    }, CATALOG_URL);
    expect(hosted.map((pack) => [pack.id, pack.glossLanguageCode])).toEqual([
      ['viwiktionary-vi-offline-pack-v1', undefined],
      ['frwiktionary-vi-fr-offline-pack-v2', 'fr'],
    ]);
    expect(mergeOfflinePacks(offlineDictionaryPacks, hosted.slice(0, 1)).map((pack) => pack.id)).toEqual([
      'enwiktionary-en-offline-pack-v1',
      'frwiktionary-vi-fr-offline-pack-v1',
      'viwiktionary-vi-offline-pack-v1',
    ]);
    // A hosted pair pack replaces the bundled builder-only entry of the same pair.
    expect(mergeOfflinePacks(offlineDictionaryPacks, hosted.slice(1)).map((pack) => pack.id)).toEqual([
      'enwiktionary-en-offline-pack-v1',
      'frwiktionary-vi-fr-offline-pack-v2',
    ]);
  });

  it.each([
    ['unknown gloss language', { glossLanguageCode: 'xx' }],
    ['gloss language equal to headword language', { glossLanguageCode: 'fr' }],
  ])('drops a pair pack with %s', (_label, override) => {
    expect(parseOfflinePackCatalog({ packs: [{ ...frPack, ...override }], schemaVersion: 1 }, CATALOG_URL)).toEqual([]);
  });

  it('caches the last valid catalog and falls back to it offline', async () => {
    const online = vi.fn(async () => new Response(JSON.stringify({ packs: [frPack], schemaVersion: 1 }), { status: 200 }));
    expect((await refreshOfflinePacks({ catalogUrl: CATALOG_URL, fetchImpl: online as typeof fetch })).map((pack) => pack.languageCode)).toEqual(['en', 'vi', 'fr']);

    const offline = vi.fn(async () => {
      throw new TypeError('Network request failed');
    });
    expect((await refreshOfflinePacks({ catalogUrl: CATALOG_URL, fetchImpl: offline as typeof fetch })).map((pack) => pack.languageCode)).toEqual(['en', 'vi', 'fr']);
    expect((await loadCachedOfflinePacks()).map((pack) => pack.languageCode)).toEqual(['en', 'vi', 'fr']);

    // A broken catalog never replaces the cached one.
    const broken = vi.fn(async () => new Response('{"schemaVersion":1,"packs":[]}', { status: 200 }));
    expect((await refreshOfflinePacks({ catalogUrl: CATALOG_URL, fetchImpl: broken as typeof fetch })).map((pack) => pack.languageCode)).toEqual(['en', 'vi', 'fr']);
  });

  it('uses only bundled packs when no catalog is configured', async () => {
    const fetchImpl = vi.fn();
    expect(await refreshOfflinePacks({ catalogUrl: '', fetchImpl: fetchImpl as unknown as typeof fetch })).toEqual(offlineDictionaryPacks);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('build-pack-catalog script', () => {
  it('writes a catalog the app accepts from builder output', () => {
    const dir = 'tmp/offline-packs/catalog-test';
    rmSync(dir, { force: true, recursive: true });
    mkdirSync(dir, { recursive: true });
    execFileSync('node', ['scripts/build-pack-catalog.mjs', '--out', `${dir}/catalog.json`, 'tests/fixtures/offline-packs/fr-probe-smoke', 'tests/fixtures/offline-packs/es-probe-smoke']);

    const catalog = JSON.parse(readFileSync(`${dir}/catalog.json`, 'utf8'));
    const packs = parseOfflinePackCatalog(catalog, 'https://cdn.example/packs/catalog.json');
    expect(packs.map((pack) => [pack.languageCode, pack.downloadSource?.entryCount])).toEqual([['fr', 216], ['es', 126]]);
    expect(packs[0].downloadSource?.entriesUrl).toBe('https://cdn.example/tests/fixtures/offline-packs/fr-probe-smoke/entries.json.gz');
  });

  it('carries the pair-pack definition language and helper credits into the catalog', () => {
    const dir = 'tmp/offline-packs/catalog-pair-test';
    rmSync(dir, { force: true, recursive: true });
    mkdirSync(dir, { recursive: true });
    execFileSync('node', ['scripts/build-pack-catalog.mjs', '--out', `${dir}/catalog.json`, 'tests/fixtures/offline-packs/vi-fr-probe-smoke', 'tests/fixtures/offline-packs/vi-probe-smoke']);

    const catalog = JSON.parse(readFileSync(`${dir}/catalog.json`, 'utf8'));
    expect(catalog.packs[0]).toMatchObject({
      attribution: 'Source: frwiktionary via Kaikki/Wiktextract (CC-BY-SA-4.0/GFDL); related words also from enwiktionary',
      glossLanguageCode: 'fr',
      id: 'frwiktionary-vi-fr-offline-pack-v1',
      languageCode: 'vi',
    });
    const packs = parseOfflinePackCatalog(catalog, 'https://cdn.example/packs/catalog.json');
    expect(packs.map((pack) => [pack.id, pack.glossLanguageCode])).toEqual([
      ['frwiktionary-vi-fr-offline-pack-v1', 'fr'],
      ['viwiktionary-vi-offline-pack-v1', undefined],
    ]);
  });
});
