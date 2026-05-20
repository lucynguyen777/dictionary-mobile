import { LanguageCode } from '@/data/languages';

export type OfflinePackStatus = 'planned' | 'builder_ready' | 'runtime_pending';

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
  const runtimePendingCount = packs.filter((pack) => pack.status === 'runtime_pending').length;

  return {
    builderReadyCount,
    packCount: packs.length,
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
