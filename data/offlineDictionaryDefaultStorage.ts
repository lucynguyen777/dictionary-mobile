import type { OfflineDictionaryStorage } from './offlineDictionaryImport';
import type { OfflinePackManifest } from './offlineDictionaryImport';

export async function createDefaultOfflineDictionaryStorage(_initialManifests: OfflinePackManifest[] = []): Promise<OfflineDictionaryStorage> {
  throw new Error('Offline SQLite storage is not configured for this runtime.');
}
