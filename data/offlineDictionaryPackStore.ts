import type { LanguageCode } from './languages';
import type { OfflineDictionaryPack } from './offlineDictionaryPacks';
import { getStoredItem, removeStoredItem, setStoredItem } from './storageAdapter';

const STORAGE_KEY = 'dictionary-mobile.offline-packs.v1';

export type OfflinePackInstallStatus = 'not_downloaded' | 'downloading' | 'downloaded' | 'importing' | 'ready' | 'failed';

export type OfflinePackInstallRecord = {
  downloadProgress: number;
  entryCount: number;
  errorMessage: string;
  installedAt: string;
  languageCode: LanguageCode;
  localUri: string;
  packId: string;
  status: OfflinePackInstallStatus;
  updatedAt: string;
};

export type OfflinePackInstallState = {
  records: OfflinePackInstallRecord[];
};

type SaveClock = () => string;

export function getDefaultOfflinePackInstallState(): OfflinePackInstallState {
  return {
    records: [],
  };
}

export async function loadOfflinePackInstallState(): Promise<OfflinePackInstallState> {
  const rawState = await getStoredItem(STORAGE_KEY);
  if (!rawState) return getDefaultOfflinePackInstallState();

  try {
    return normalizeOfflinePackInstallState(JSON.parse(rawState) as Partial<OfflinePackInstallState>);
  } catch {
    return getDefaultOfflinePackInstallState();
  }
}

export async function saveOfflinePackInstallState(state: OfflinePackInstallState) {
  const nextState = normalizeOfflinePackInstallState(state);
  await setStoredItem(STORAGE_KEY, JSON.stringify(nextState));

  return nextState;
}

export async function clearOfflinePackInstallState() {
  await removeStoredItem(STORAGE_KEY);
}

export function getOfflinePackInstallRecord(
  state: OfflinePackInstallState,
  pack: OfflineDictionaryPack
): OfflinePackInstallRecord {
  return (
    state.records.find((record) => record.packId === pack.id) ?? {
      downloadProgress: 0,
      entryCount: 0,
      errorMessage: '',
      installedAt: '',
      languageCode: pack.languageCode,
      localUri: '',
      packId: pack.id,
      status: 'not_downloaded',
      updatedAt: '',
    }
  );
}

export async function beginOfflinePackDownload(
  state: OfflinePackInstallState,
  pack: OfflineDictionaryPack,
  clock: SaveClock = now
) {
  return saveOfflinePackInstallState(
    upsertOfflinePackRecord(state, {
      ...getOfflinePackInstallRecord(state, pack),
      downloadProgress: 0,
      errorMessage: '',
      status: 'downloading',
      updatedAt: clock(),
    })
  );
}

export async function updateOfflinePackDownloadProgress(
  state: OfflinePackInstallState,
  pack: OfflineDictionaryPack,
  progress: number,
  clock: SaveClock = now
) {
  return saveOfflinePackInstallState(
    upsertOfflinePackRecord(state, {
      ...getOfflinePackInstallRecord(state, pack),
      downloadProgress: clampProgress(progress),
      errorMessage: '',
      status: 'downloading',
      updatedAt: clock(),
    })
  );
}

export async function markOfflinePackDownloaded(
  state: OfflinePackInstallState,
  pack: OfflineDictionaryPack,
  options: { entryCount: number; localUri: string },
  clock: SaveClock = now
) {
  return saveOfflinePackInstallState(
    upsertOfflinePackRecord(state, {
      ...getOfflinePackInstallRecord(state, pack),
      downloadProgress: 1,
      entryCount: Math.max(0, Math.trunc(options.entryCount)),
      errorMessage: '',
      localUri: options.localUri.trim(),
      status: 'downloaded',
      updatedAt: clock(),
    })
  );
}

export async function markOfflinePackImporting(
  state: OfflinePackInstallState,
  pack: OfflineDictionaryPack,
  clock: SaveClock = now
) {
  return saveOfflinePackInstallState(
    upsertOfflinePackRecord(state, {
      ...getOfflinePackInstallRecord(state, pack),
      errorMessage: '',
      status: 'importing',
      updatedAt: clock(),
    })
  );
}

export async function markOfflinePackReady(
  state: OfflinePackInstallState,
  pack: OfflineDictionaryPack,
  clock: SaveClock = now
) {
  const timestamp = clock();

  return saveOfflinePackInstallState(
    upsertOfflinePackRecord(state, {
      ...getOfflinePackInstallRecord(state, pack),
      downloadProgress: 1,
      errorMessage: '',
      installedAt: timestamp,
      status: 'ready',
      updatedAt: timestamp,
    })
  );
}

export async function markOfflinePackFailed(
  state: OfflinePackInstallState,
  pack: OfflineDictionaryPack,
  errorMessage: string,
  clock: SaveClock = now
) {
  return saveOfflinePackInstallState(
    upsertOfflinePackRecord(state, {
      ...getOfflinePackInstallRecord(state, pack),
      errorMessage: errorMessage.trim() || 'Unknown offline pack error.',
      status: 'failed',
      updatedAt: clock(),
    })
  );
}

export async function deleteOfflinePackRecord(state: OfflinePackInstallState, packId: string) {
  return saveOfflinePackInstallState({
    records: state.records.filter((record) => record.packId !== packId),
  });
}

export function getOfflinePackInstallSummary(state: OfflinePackInstallState) {
  return state.records.reduce(
    (summary, record) => ({
      downloadingCount: summary.downloadingCount + (record.status === 'downloading' ? 1 : 0),
      failedCount: summary.failedCount + (record.status === 'failed' ? 1 : 0),
      readyCount: summary.readyCount + (record.status === 'ready' ? 1 : 0),
      totalEntryCount: summary.totalEntryCount + (record.status === 'ready' ? record.entryCount : 0),
    }),
    {
      downloadingCount: 0,
      failedCount: 0,
      readyCount: 0,
      totalEntryCount: 0,
    }
  );
}

function upsertOfflinePackRecord(state: OfflinePackInstallState, record: OfflinePackInstallRecord) {
  const normalizedRecord = normalizeOfflinePackInstallRecord(record);
  const nextRecords = state.records.filter((item) => item.packId !== normalizedRecord.packId);

  return {
    records: [...nextRecords, normalizedRecord],
  };
}

function normalizeOfflinePackInstallState(state: Partial<OfflinePackInstallState>): OfflinePackInstallState {
  return {
    records: Array.isArray(state.records)
      ? state.records.map(normalizeOfflinePackInstallRecord).filter((record) => record.packId)
      : [],
  };
}

function normalizeOfflinePackInstallRecord(record: Partial<OfflinePackInstallRecord>) {
  return {
    downloadProgress: clampProgress(record.downloadProgress ?? 0),
    entryCount: Math.max(0, Math.trunc(record.entryCount ?? 0)),
    errorMessage: record.errorMessage?.trim() ?? '',
    installedAt: record.installedAt?.trim() ?? '',
    languageCode: record.languageCode ?? 'en',
    localUri: record.localUri?.trim() ?? '',
    packId: record.packId?.trim() ?? '',
    status: normalizeInstallStatus(record.status),
    updatedAt: record.updatedAt?.trim() ?? '',
  };
}

function normalizeInstallStatus(status?: OfflinePackInstallStatus) {
  if (
    status === 'not_downloaded' ||
    status === 'downloading' ||
    status === 'downloaded' ||
    status === 'importing' ||
    status === 'ready' ||
    status === 'failed'
  ) {
    return status;
  }

  return 'not_downloaded';
}

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.min(1, Math.max(0, value));
}

function now() {
  return new Date().toISOString();
}
