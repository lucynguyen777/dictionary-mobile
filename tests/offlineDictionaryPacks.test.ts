import { describe, expect, it } from 'vitest';
import {
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
  });

  it('summarizes pack status without claiming runtime availability', () => {
    expect(getOfflinePackSummary()).toEqual({
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
    expect(formatPackSizeRange(offlineDictionaryPacks[0])).toBe('10-50MB');
  });

  it('blocks download/import until runtime pack management is implemented', () => {
    expect(getOfflinePackRuntimeGate(offlineDictionaryPacks[0])).toEqual({
      actionLabel: 'Chờ SQLite runtime',
      canDownload: false,
      canImport: false,
      detail: 'Pack builder đã sẵn sàng, nhưng import SQLite và quản lý tải/xóa chưa được bật.',
      reason: 'runtime_import_pending',
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
