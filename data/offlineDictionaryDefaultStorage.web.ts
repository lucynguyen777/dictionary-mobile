import type { OfflineDictionaryStorage } from './offlineDictionaryImport';
import type { OfflinePackManifest } from './offlineDictionaryImport';

export async function createDefaultOfflineDictionaryStorage(_initialManifests: OfflinePackManifest[] = []): Promise<OfflineDictionaryStorage> {
  throw new Error('Offline SQLite storage is not available on Expo Web.');
}
