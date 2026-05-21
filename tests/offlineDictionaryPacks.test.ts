import { describe, expect, it } from 'vitest';
import {
  englishOfflinePackDevSource,
  formatPackSizeRange,
  formatPackStatus,
  getOfflinePackRuntimeGate,
  getOfflinePackSummary,
  offlineDictionaryPacks,
} from '../data/offlineDictionaryPacks';

describe('offlineDictionaryPacks', () => {
  it('tracks the Phase 1 English pack as builder-ready but not runtime-enabled', () => {
    expect(offlineDictionaryPacks).toHaveLength(1);
    expect(offlineDictionaryPacks[0]).toMatchObject({
      id: 'enwiktionary-en-offline-pack-v1',
      languageCode: 'en',
      license: 'CC-BY-SA-4.0/GFDL',
      sourceName: 'enwiktionary',
      status: 'builder_ready',
    });
    expect(offlineDictionaryPacks[0].downloadSource).toEqual(englishOfflinePackDevSource);
  });

  it('summarizes pack status for native runtime availability', () => {
    expect(getOfflinePackSummary()).toEqual({
      builderReadyCount: 1,
      downloadableCount: 1,
      packCount: 1,
      runtimeBlockedCount: 0,
      runtimePendingCount: 0,
    });
  });

  it('summarizes pack status without claiming web runtime availability', () => {
    expect(getOfflinePackSummary(offlineDictionaryPacks, { supportsSqliteRuntime: false })).toEqual({
      builderReadyCount: 1,
      downloadableCount: 0,
      packCount: 1,
      runtimeBlockedCount: 1,
      runtimePendingCount: 0,
    });
  });

  it('formats pack status and size labels for UI copy', () => {
    expect(formatPackStatus('builder_ready')).toBe('Builder sẵn sàng');
    expect(formatPackStatus('runtime_pending')).toBe('Chờ runtime');
    expect(formatPackStatus('planned')).toBe('Đang thiết kế');
    expect(formatPackSizeRange(offlineDictionaryPacks[0])).toBe('1MB');
  });

  it('blocks download/import until pack source URLs are configured', () => {
    expect(getOfflinePackRuntimeGate({ ...offlineDictionaryPacks[0], downloadSource: undefined })).toEqual({
      actionLabel: 'Chờ pack URL',
      canDownload: false,
      canImport: false,
      detail: 'Pack builder và runtime đã sẵn sàng, nhưng cần manifest/entries URL kèm checksum trước khi tải.',
      reason: 'pack_source_pending',
    });
  });

  it('blocks download/import on web until native SQLite runtime is available', () => {
    expect(getOfflinePackRuntimeGate(offlineDictionaryPacks[0], { supportsSqliteRuntime: false })).toEqual({
      actionLabel: 'Chờ native runtime',
      canDownload: false,
      canImport: false,
      detail: 'Pack URL/checksum đã sẵn sàng, nhưng SQLite import chỉ bật trên native runtime.',
      reason: 'native_runtime_pending',
    });
  });

  it('enables download/import when source URLs and checksums exist', () => {
    expect(
      getOfflinePackRuntimeGate({
        ...offlineDictionaryPacks[0],
        downloadSource: {
          entriesMd5: 'entries-md5',
          entriesUrl: 'https://example.com/entries.json.gz',
          entryCount: 1,
          manifestMd5: 'manifest-md5',
          manifestUrl: 'https://example.com/manifest.json',
        },
      })
    ).toEqual({
      actionLabel: 'Tải pack',
      canDownload: true,
      canImport: true,
      detail: 'Có thể tải pack, xác minh checksum, nhập SQLite, và xóa khỏi thiết bị khi cần.',
      reason: 'ready',
    });
  });

  it('explains planned packs separately from builder-ready packs', () => {
    expect(
      getOfflinePackRuntimeGate({
        ...offlineDictionaryPacks[0],
        status: 'planned',
      })
    ).toEqual({
      actionLabel: 'Chưa có pack',
      canDownload: false,
      canImport: false,
      detail: 'Cần build pack và xác nhận manifest trước khi tải về máy.',
      reason: 'pack_not_built',
    });
  });

  it('formats exact pack size estimates as a single value', () => {
    expect(
      formatPackSizeRange({
        ...offlineDictionaryPacks[0],
        estimatedCompressedSizeMb: {
          max: 25,
          min: 25,
        },
      })
    ).toBe('25MB');
  });
});
