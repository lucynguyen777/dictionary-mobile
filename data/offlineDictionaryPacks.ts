import { LanguageCode } from '@/data/languages';
import type { OfflinePackDownloadSource } from './offlineDictionaryPackDownload';

export type OfflinePackStatus = 'planned' | 'builder_ready' | 'runtime_pending';
export type OfflinePackRuntimeBlockReason = 'native_runtime_pending' | 'pack_not_built' | 'pack_source_pending' | 'ready';

export type OfflinePackRuntimeGate = {
  actionLabel: string;
  canDownload: boolean;
  canImport: boolean;
  detail: string;
  reason: OfflinePackRuntimeBlockReason;
};

export type OfflinePackRuntimeGateOptions = {
  supportsSqliteRuntime?: boolean;
};

export type OfflineDictionaryPack = {
  attribution: string;
  downloadSource?: OfflinePackDownloadSource;
  estimatedCompressedSizeMb: {
    max: number;
    min: number;
  };
  id: string;
  languageCode: LanguageCode;
  license: 'CC-BY-SA-4.0/GFDL';
  sourceName: string;
  status: OfflinePackStatus;
};

export const englishOfflinePackDevSource: OfflinePackDownloadSource = {
  entriesMd5: '706093a86d8cd59d8dc9e575a46faf60',
  entriesUrl: '/offline-packs/enwiktionary-lite/entries.json',
  entryCount: 2,
  manifestMd5: 'f56ebabae0d6f3fa222b81ab0d9b52a8',
  manifestUrl: '/offline-packs/enwiktionary-lite/manifest.json',
};

export const offlineDictionaryPacks: OfflineDictionaryPack[] = [
  {
    attribution: 'Source: English Wiktionary via Kaikki/Wiktextract (CC-BY-SA-4.0/GFDL)',
    downloadSource: englishOfflinePackDevSource,
    estimatedCompressedSizeMb: {
      max: 1,
      min: 1,
    },
    id: 'enwiktionary-en-offline-pack-v1',
    languageCode: 'en',
    license: 'CC-BY-SA-4.0/GFDL',
    sourceName: 'enwiktionary',
    status: 'builder_ready',
  },
];

export function getOfflinePackSummary(
  packs: OfflineDictionaryPack[] = offlineDictionaryPacks,
  options: OfflinePackRuntimeGateOptions = {}
) {
  const builderReadyCount = packs.filter((pack) => pack.status === 'builder_ready').length;
  const downloadableCount = packs.filter((pack) => getOfflinePackRuntimeGate(pack, options).canDownload).length;
  const runtimeBlockedCount = packs.filter((pack) => !getOfflinePackRuntimeGate(pack, options).canImport).length;
  const runtimePendingCount = packs.filter((pack) => pack.status === 'runtime_pending').length;

  return {
    builderReadyCount,
    downloadableCount,
    packCount: packs.length,
    runtimeBlockedCount,
    runtimePendingCount,
  };
}

export function formatPackSizeRange(pack: OfflineDictionaryPack) {
  if (pack.estimatedCompressedSizeMb.min === pack.estimatedCompressedSizeMb.max) {
    return `${pack.estimatedCompressedSizeMb.min}MB`;
  }

  return `${pack.estimatedCompressedSizeMb.min}-${pack.estimatedCompressedSizeMb.max}MB`;
}

export function formatPackStatus(status: OfflinePackStatus) {
  if (status === 'builder_ready') return 'Builder sẵn sàng';
  if (status === 'runtime_pending') return 'Chờ runtime';

  return 'Đang thiết kế';
}

export function getOfflinePackRuntimeGate(
  pack: OfflineDictionaryPack,
  { supportsSqliteRuntime = true }: OfflinePackRuntimeGateOptions = {}
): OfflinePackRuntimeGate {
  if (pack.status === 'planned') {
    return {
      actionLabel: 'Chưa có pack',
      canDownload: false,
      canImport: false,
      detail: 'Cần build pack và xác nhận manifest trước khi tải về máy.',
      reason: 'pack_not_built',
    };
  }

  if (!pack.downloadSource) {
    return {
      actionLabel: 'Chờ pack URL',
      canDownload: false,
      canImport: false,
      detail: 'Pack builder và runtime đã sẵn sàng, nhưng cần manifest/entries URL kèm checksum trước khi tải.',
      reason: 'pack_source_pending',
    };
  }

  if (!supportsSqliteRuntime) {
    return {
      actionLabel: 'Chờ native runtime',
      canDownload: false,
      canImport: false,
      detail: 'Pack URL/checksum đã sẵn sàng, nhưng SQLite import chỉ bật trên native runtime.',
      reason: 'native_runtime_pending',
    };
  }

  return {
    actionLabel: 'Tải pack',
    canDownload: true,
    canImport: true,
    detail: 'Có thể tải pack, xác minh checksum, nhập SQLite, và xóa khỏi thiết bị khi cần.',
    reason: 'ready',
  };
}
