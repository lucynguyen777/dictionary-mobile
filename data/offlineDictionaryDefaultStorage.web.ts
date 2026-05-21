import type { OfflineDictionaryStorage } from './offlineDictionaryImport';

export async function createDefaultOfflineDictionaryStorage(): Promise<OfflineDictionaryStorage> {
  throw new Error('Offline SQLite storage is not available on Expo Web.');
}
