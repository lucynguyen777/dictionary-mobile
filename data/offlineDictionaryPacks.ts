import { LanguageCode } from '@/data/languages';

export type OfflinePackStatus = 'planned' | 'builder_ready' | 'runtime_pending';
export type OfflinePackRuntimeBlockReason = 'pack_not_built' | 'runtime_import_pending';

export type OfflinePackRuntimeGate = {
  actionLabel: string;
  canDownload: boolean;
  canImport: boolean;
  detail: string;
  reason: OfflinePackRuntimeBlockReason;
};

export type OfflineDictionaryPack = {
  attribution: string;
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

export const offlineDictionaryPacks: OfflineDictionaryPack[] = [
  {
    attribution: 'Source: English Wiktionary via Kaikki/Wiktextract (CC-BY-SA-4.0/GFDL)',
    estimatedCompressedSizeMb: {
      max: 50,
      min: 10,
    },
    id: 'enwiktionary-en-offline-pack-v1',
    languageCode: 'en',
    license: 'CC-BY-SA-4.0/GFDL',
    sourceName: 'enwiktionary',
    status: 'builder_ready',
  },
];

export function getOfflinePackSummary(packs: OfflineDictionaryPack[] = offlineDictionaryPacks) {
  const builderReadyCount = packs.filter((pack) => pack.status === 'builder_ready').length;
  const downloadableCount = packs.filter((pack) => getOfflinePackRuntimeGate(pack).canDownload).length;
  const runtimeBlockedCount = packs.filter((pack) => !getOfflinePackRuntimeGate(pack).canImport).length;
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

export function getOfflinePackRuntimeGate(pack: OfflineDictionaryPack): OfflinePackRuntimeGate {
  if (pack.status === 'planned') {
    return {
      actionLabel: 'Chưa có pack',
      canDownload: false,
      canImport: false,
      detail: 'Cần build pack và xác nhận manifest trước khi tải về máy.',
      reason: 'pack_not_built',
    };
  }

  return {
    actionLabel: 'Chờ SQLite runtime',
    canDownload: false,
    canImport: false,
    detail: 'Pack builder đã sẵn sàng, nhưng import SQLite và quản lý tải/xóa chưa được bật.',
    reason: 'runtime_import_pending',
  };
}
