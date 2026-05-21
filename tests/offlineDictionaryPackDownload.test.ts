import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('../data/storageAdapter', () => ({
  getStoredItem: vi.fn(async (key: string) => storage.get(key) ?? null),
  removeStoredItem: vi.fn(async (key: string) => {
    storage.delete(key);
  }),
  setStoredItem: vi.fn(async (key: string, value: string) => {
    storage.set(key, value);
  }),
}));

import {
  type OfflinePackDownloadFileSystem,
  type OfflinePackDownloadSource,
  downloadOfflineDictionaryPack,
  getOfflinePackArtifactFileName,
} from '../data/offlineDictionaryPackDownload';
import {
  getDefaultOfflinePackInstallState,
  getOfflinePackInstallRecord,
  loadOfflinePackInstallState,
} from '../data/offlineDictionaryPackStore';
import { offlineDictionaryPacks } from '../data/offlineDictionaryPacks';

const pack = offlineDictionaryPacks[0];
const timestamp = '2026-05-21T19:00:00.000Z';

const source: OfflinePackDownloadSource = {
  entriesMd5: 'AABBCC',
  entriesUrl: 'https://example.com/offline/entries.json.gz',
  entryCount: 3,
  manifestMd5: '112233',
  manifestUrl: 'https://example.com/offline/manifest.json',
};

describe('offlineDictionaryPackDownload', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('downloads manifest and entries, verifies checksums, and marks the pack downloaded', async () => {
    const fileSystem = createFakeDownloadFileSystem({
      'entries.json.gz': {
        md5: 'aabbcc',
        size: 512,
        uri: 'file:///offline/en/entries.json.gz',
      },
      'manifest.json': {
        md5: '112233',
        size: 128,
        uri: 'file:///offline/en/manifest.json',
      },
    });

    const result = await downloadOfflineDictionaryPack({
      clock: () => timestamp,
      fileSystem,
      pack,
      source,
      state: getDefaultOfflinePackInstallState(),
    });

    expect(result).toMatchObject({
      entries: {
        md5: 'aabbcc',
        uri: 'file:///offline/en/entries.json.gz',
      },
      manifest: {
        md5: '112233',
        uri: 'file:///offline/en/manifest.json',
      },
      ok: true,
    });
    expect(fileSystem.downloads).toEqual([
      ['https://example.com/offline/manifest.json', 'manifest.json'],
      ['https://example.com/offline/entries.json.gz', 'entries.json.gz'],
    ]);

    if (!result.ok) throw new Error('Expected successful download');

    expect(getOfflinePackInstallRecord(result.state, pack)).toMatchObject({
      downloadProgress: 1,
      entryCount: 3,
      errorMessage: '',
      localUri: 'file:///offline/en/entries.json.gz',
      status: 'downloaded',
      updatedAt: timestamp,
    });
    expect(getOfflinePackInstallRecord(await loadOfflinePackInstallState(), pack).status).toBe('downloaded');
  });

  it('marks the pack failed and removes partial files when checksum verification fails', async () => {
    const fileSystem = createFakeDownloadFileSystem({
      'entries.json.gz': {
        md5: 'wrong',
        size: 512,
        uri: 'file:///offline/en/entries.json.gz',
      },
      'manifest.json': {
        md5: '112233',
        size: 128,
        uri: 'file:///offline/en/manifest.json',
      },
    });

    const result = await downloadOfflineDictionaryPack({
      clock: () => timestamp,
      fileSystem,
      pack,
      source,
      state: getDefaultOfflinePackInstallState(),
    });

    expect(result).toMatchObject({
      errorMessage: 'Checksum mismatch for entries.json.gz.',
      ok: false,
    });
    if (result.ok) throw new Error('Expected failed download');

    expect(fileSystem.deletedUris).toEqual(['file:///offline/en/entries.json.gz', 'file:///offline/en/manifest.json']);
    expect(getOfflinePackInstallRecord(result.state, pack)).toMatchObject({
      errorMessage: 'Checksum mismatch for entries.json.gz.',
      status: 'failed',
    });
  });

  it('sanitizes artifact filenames from URLs and falls back for invalid names', () => {
    expect(getOfflinePackArtifactFileName('https://example.com/packs/entries 1.json.gz?token=x', 'entries.json.gz')).toBe(
      'entries-1.json.gz'
    );
    expect(getOfflinePackArtifactFileName('not-a-url', 'manifest.json')).toBe('manifest.json');
  });
});

function createFakeDownloadFileSystem(filesByName: Record<string, { md5: string; size: number; uri: string }>) {
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
      const file = filesByName[fileName];
      if (!file) throw new Error(`Missing fake file ${fileName}`);

      return file;
    },
  } satisfies OfflinePackDownloadFileSystem & {
    deletedUris: string[];
    downloads: Array<[string, string]>;
  };
}
