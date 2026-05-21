import type { OfflineDictionaryStorage, OfflinePackManifest } from './offlineDictionaryImport';
import { createExpoSqliteOfflineDictionaryStorage } from './offlineDictionarySqliteStorage';

export async function createDefaultOfflineDictionaryStorage(
  initialManifests: OfflinePackManifest[] = []
): Promise<OfflineDictionaryStorage> {
  return createExpoSqliteOfflineDictionaryStorage({ initialManifests });
}
