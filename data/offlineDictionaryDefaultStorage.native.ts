import type { OfflineDictionaryStorage } from './offlineDictionaryImport';
import { createExpoSqliteOfflineDictionaryStorage } from './offlineDictionarySqliteStorage';

export async function createDefaultOfflineDictionaryStorage(): Promise<OfflineDictionaryStorage> {
  return createExpoSqliteOfflineDictionaryStorage();
}
