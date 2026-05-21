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
  beginOfflinePackDownload,
  clearOfflinePackInstallState,
  deleteOfflinePackRecord,
  formatOfflinePackInstallStatus,
  formatOfflinePackProgress,
  getDefaultOfflinePackInstallState,
  getOfflinePackInstallRecord,
  getOfflinePackInstallSummary,
  loadOfflinePackInstallState,
  markOfflinePackDownloaded,
  markOfflinePackFailed,
  markOfflinePackImporting,
  markOfflinePackReady,
  updateOfflinePackDownloadProgress,
} from '../data/offlineDictionaryPackStore';
import { offlineDictionaryPacks } from '../data/offlineDictionaryPacks';

const pack = offlineDictionaryPacks[0];
const timestamp = '2026-05-21T08:30:00.000Z';
const laterTimestamp = '2026-05-21T08:31:00.000Z';

describe('offlineDictionaryPackStore', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('loads an empty install state when nothing has been persisted', async () => {
    expect(await loadOfflinePackInstallState()).toEqual(getDefaultOfflinePackInstallState());
    expect(getOfflinePackInstallRecord(getDefaultOfflinePackInstallState(), pack)).toMatchObject({
      downloadProgress: 0,
      packId: pack.id,
      status: 'not_downloaded',
    });
  });

  it('tracks download progress and clamps invalid values', async () => {
    let state = await beginOfflinePackDownload(getDefaultOfflinePackInstallState(), pack, () => timestamp);
    expect(getOfflinePackInstallRecord(state, pack)).toMatchObject({
      downloadProgress: 0,
      errorMessage: '',
      status: 'downloading',
      updatedAt: timestamp,
    });

    state = await updateOfflinePackDownloadProgress(state, pack, 1.4, () => laterTimestamp);
    expect(getOfflinePackInstallRecord(state, pack)).toMatchObject({
      downloadProgress: 1,
      status: 'downloading',
      updatedAt: laterTimestamp,
    });
    expect(formatOfflinePackProgress(getOfflinePackInstallRecord(state, pack))).toBe('100%');
  });

  it('moves a pack through downloaded, importing, and ready states', async () => {
    let state = await markOfflinePackDownloaded(
      getDefaultOfflinePackInstallState(),
      pack,
      {
        entryCount: 42.8,
        localUri: ' file:///packs/en.db ',
      },
      () => timestamp
    );

    expect(getOfflinePackInstallRecord(state, pack)).toMatchObject({
      downloadProgress: 1,
      entryCount: 42,
      localUri: 'file:///packs/en.db',
      status: 'downloaded',
    });

    state = await markOfflinePackImporting(state, pack, () => laterTimestamp);
    expect(getOfflinePackInstallRecord(state, pack).status).toBe('importing');

    state = await markOfflinePackReady(state, pack, () => laterTimestamp);
    expect(getOfflinePackInstallRecord(state, pack)).toMatchObject({
      downloadProgress: 1,
      installedAt: laterTimestamp,
      status: 'ready',
      updatedAt: laterTimestamp,
    });
    expect(getOfflinePackInstallSummary(state)).toEqual({
      downloadingCount: 0,
      failedCount: 0,
      readyCount: 1,
      totalEntryCount: 42,
    });
  });

  it('records failure state and supports deleting pack metadata', async () => {
    let state = await markOfflinePackFailed(getDefaultOfflinePackInstallState(), pack, ' Network failed ', () => timestamp);
    expect(getOfflinePackInstallRecord(state, pack)).toMatchObject({
      errorMessage: 'Network failed',
      status: 'failed',
    });
    expect(getOfflinePackInstallSummary(state).failedCount).toBe(1);

    state = await deleteOfflinePackRecord(state, pack.id);
    expect(state.records).toHaveLength(0);
    expect((await loadOfflinePackInstallState()).records).toHaveLength(0);
  });

  it('formats install statuses for Profile UI copy', () => {
    expect(formatOfflinePackInstallStatus('not_downloaded')).toBe('Chưa tải');
    expect(formatOfflinePackInstallStatus('downloading')).toBe('Đang tải');
    expect(formatOfflinePackInstallStatus('downloaded')).toBe('Đã tải');
    expect(formatOfflinePackInstallStatus('importing')).toBe('Đang nhập');
    expect(formatOfflinePackInstallStatus('ready')).toBe('Đã cài');
    expect(formatOfflinePackInstallStatus('failed')).toBe('Lỗi');
  });

  it('normalizes older or corrupt persisted records', async () => {
    storage.set(
      'dictionary-mobile.offline-packs.v1',
      JSON.stringify({
        records: [
          {
            downloadProgress: -1,
            entryCount: -5,
            languageCode: 'en',
            packId: pack.id,
            status: 'unknown',
          },
        ],
      })
    );

    expect(await loadOfflinePackInstallState()).toEqual({
      records: [
        {
          downloadProgress: 0,
          entryCount: 0,
          errorMessage: '',
          installedAt: '',
          languageCode: 'en',
          localUri: '',
          packId: pack.id,
          status: 'not_downloaded',
          updatedAt: '',
        },
      ],
    });

    await clearOfflinePackInstallState();
    expect(await loadOfflinePackInstallState()).toEqual(getDefaultOfflinePackInstallState());
  });
});
