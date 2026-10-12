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
  // Pair packs only: headwords in `languageCode`, definitions in this language (e.g. VI→FR).
  glossLanguageCode?: LanguageCode;
  id: string;
  // A tiny development pack used for smoke tests; shown as a sample, never as a full dictionary.
  isSample?: boolean;
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
    isSample: true,
    languageCode: 'en',
    license: 'CC-BY-SA-4.0/GFDL',
    sourceName: 'enwiktionary',
    status: 'builder_ready',
  },
  // VI→FR (decision D13): French Wiktionary's Vietnamese section, with English Wiktionary's Vietnamese
  // relations as a credited related-words helper. The builder output is ready, but the pack is not hosted
  // yet (D9: Supabase Storage), so there is no download source and nothing is installed by default.
  {
    attribution:
      'Source: French Wiktionary (Vietnamese section) via Kaikki/Wiktextract (CC-BY-SA-4.0/GFDL); related words also from English Wiktionary',
    estimatedCompressedSizeMb: {
      max: 2,
      min: 1,
    },
    glossLanguageCode: 'fr',
    id: 'frwiktionary-vi-fr-offline-pack-v1',
    languageCode: 'vi',
    license: 'CC-BY-SA-4.0/GFDL',
    sourceName: 'frwiktionary',
    status: 'builder_ready',
  },
];

// Monolingual packs are keyed by language, pair packs by "source->target", so a hosted Vietnamese pack
// never replaces the VI→FR pair pack (or the other way round).
export function getOfflinePackDictionaryKey(pack: Pick<OfflineDictionaryPack, 'glossLanguageCode' | 'languageCode'>) {
  return pack.glossLanguageCode && pack.glossLanguageCode !== pack.languageCode
    ? `${pack.languageCode}->${pack.glossLanguageCode}`
    : pack.languageCode;
}

export function isPairOfflinePack(pack: Pick<OfflineDictionaryPack, 'glossLanguageCode' | 'languageCode'>) {
  return getOfflinePackDictionaryKey(pack) !== pack.languageCode;
}

export function formatPackLanguageLabel(
  pack: Pick<OfflineDictionaryPack, 'glossLanguageCode' | 'languageCode'>,
  getLabel: (code: string) => string
) {
  return isPairOfflinePack(pack)
    ? `${getLabel(pack.languageCode)} → ${getLabel(pack.glossLanguageCode as string)}`
    : getLabel(pack.languageCode);
}

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

export function formatPackTitle(pack: OfflineDictionaryPack, languageLabel: string) {
  return pack.isSample
    ? `${languageLabel} · pack mẫu (${pack.downloadSource?.entryCount ?? 0} mục từ)`
    : languageLabel;
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
