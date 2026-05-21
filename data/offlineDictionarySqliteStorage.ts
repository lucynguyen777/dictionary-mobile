import type { LanguageCode } from './languages';
import type { SQLiteVariadicBindParams } from 'expo-sqlite';
import {
  OFFLINE_DICTIONARY_SCHEMA_SQL,
  type OfflineDictionarySqliteRow,
  type OfflineDictionaryStorage,
  type OfflineDictionaryStorageImportResult,
  type OfflinePackManifest,
  parseOfflineEntryFromSqliteRow,
  serializeOfflineEntryForSqlite,
} from './offlineDictionaryImport';
import type { OfflineDictionaryEntry } from './offlineDictionaryLookup';
import { getOfflineLookupCandidates } from './offlineDictionaryLookup';

export type OfflineSqliteDatabase = {
  closeAsync?: () => Promise<void>;
  databasePath: string;
  execAsync: (source: string) => Promise<void>;
  getFirstAsync: <T>(source: string, ...params: SQLiteVariadicBindParams) => Promise<T | null>;
  runAsync: (source: string, ...params: SQLiteVariadicBindParams) => Promise<unknown>;
  withTransactionAsync: (task: () => Promise<void>) => Promise<void>;
};

export type OpenOfflineSqliteDatabase = (databaseName: string) => Promise<OfflineSqliteDatabase>;
export type DeleteOfflineSqliteDatabase = (databaseName: string) => Promise<void>;

export type ExpoSqliteOfflineDictionaryStorageOptions = {
  databaseNameForPack?: (packId: string) => string;
  deleteDatabase?: DeleteOfflineSqliteDatabase;
  initialManifests?: OfflinePackManifest[];
  openDatabase?: OpenOfflineSqliteDatabase;
};

const INSERT_ENTRY_SQL = `INSERT OR REPLACE INTO dictionary_entry (
  id,
  lang_code,
  word,
  normalized_word,
  part_of_speech,
  definitions_json,
  ipa,
  audio_json,
  examples_json,
  relations_json,
  etymology,
  source_name,
  source_url,
  license,
  attribution,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const INSERT_META_SQL = 'INSERT OR REPLACE INTO offline_pack_meta (key, value) VALUES (?, ?)';

const FIND_ENTRY_SQL = `SELECT
  id,
  lang_code,
  word,
  normalized_word,
  part_of_speech,
  definitions_json,
  ipa,
  audio_json,
  examples_json,
  relations_json,
  etymology,
  source_name,
  source_url,
  license,
  attribution,
  updated_at
FROM dictionary_entry
WHERE lang_code = ?
  AND (normalized_word = ? OR lower(word) = ?)
LIMIT 1`;

export function createExpoSqliteOfflineDictionaryStorage({
  databaseNameForPack = getOfflineDictionaryDatabaseName,
  deleteDatabase = deleteExpoSqliteDatabase,
  initialManifests = [],
  openDatabase = openExpoSqliteDatabase,
}: ExpoSqliteOfflineDictionaryStorageOptions = {}): OfflineDictionaryStorage {
  const packIdByLanguageCode = new Map<LanguageCode, string>();
  const languageCodeByPackId = new Map<string, LanguageCode>();

  for (const manifest of initialManifests) {
    packIdByLanguageCode.set(manifest.langCode, manifest.packId);
    languageCodeByPackId.set(manifest.packId, manifest.langCode);
  }

  return {
    async deletePack(packId: string) {
      const languageCode = languageCodeByPackId.get(packId);
      await deleteDatabase(databaseNameForPack(packId));

      languageCodeByPackId.delete(packId);
      if (languageCode && packIdByLanguageCode.get(languageCode) === packId) {
        packIdByLanguageCode.delete(languageCode);
      }
    },
    async findEntry(word: string, languageCode: LanguageCode) {
      const packId = packIdByLanguageCode.get(languageCode);
      if (!packId) return null;

      const database = await openDatabase(databaseNameForPack(packId));
      try {
        for (const lookupKey of getOfflineLookupCandidates(word, languageCode)) {
          const row = await database.getFirstAsync<OfflineDictionarySqliteRow>(
            FIND_ENTRY_SQL,
            languageCode,
            lookupKey,
            lookupKey
          );

          if (row) return parseOfflineEntryFromSqliteRow(row);
        }

        return null;
      } finally {
        await database.closeAsync?.();
      }
    },
    async importPack(manifest: OfflinePackManifest, entries: OfflineDictionaryEntry[]) {
      const database = await openDatabase(databaseNameForPack(manifest.packId));
      try {
        await ensureOfflineDictionarySchema(database);
        await database.withTransactionAsync(async () => {
          await replacePackRows(database, manifest, entries);
        });

        packIdByLanguageCode.set(manifest.langCode, manifest.packId);
        languageCodeByPackId.set(manifest.packId, manifest.langCode);

        return {
          databaseUri: database.databasePath || `sqlite://${databaseNameForPack(manifest.packId)}`,
          entryCount: entries.length,
        } satisfies OfflineDictionaryStorageImportResult;
      } finally {
        await database.closeAsync?.();
      }
    },
  };
}

export function getOfflineDictionaryDatabaseName(packId: string) {
  const safePackId = packId
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `offline-${safePackId || 'pack'}.sqlite`;
}

async function ensureOfflineDictionarySchema(database: OfflineSqliteDatabase) {
  for (const statement of OFFLINE_DICTIONARY_SCHEMA_SQL) {
    await database.execAsync(statement);
  }
}

async function replacePackRows(
  database: OfflineSqliteDatabase,
  manifest: OfflinePackManifest,
  entries: OfflineDictionaryEntry[]
) {
  await database.runAsync('DELETE FROM offline_pack_meta');
  await database.runAsync('DELETE FROM dictionary_entry');

  for (const [key, value] of getManifestMetaRows(manifest, entries.length)) {
    await database.runAsync(INSERT_META_SQL, key, value);
  }

  for (const entry of entries) {
    const row = serializeOfflineEntryForSqlite(entry);
    await database.runAsync(
      INSERT_ENTRY_SQL,
      row.id,
      row.lang_code,
      row.word,
      row.normalized_word,
      row.part_of_speech,
      row.definitions_json,
      row.ipa,
      row.audio_json,
      row.examples_json,
      row.relations_json,
      row.etymology,
      row.source_name,
      row.source_url,
      row.license,
      row.attribution,
      row.updated_at
    );
  }
}

function getManifestMetaRows(manifest: OfflinePackManifest, entryCount: number): Array<[string, string]> {
  return [
    ['pack_id', manifest.packId],
    ['lang_code', manifest.langCode],
    ['source_name', manifest.sourceName],
    ['source_url', manifest.sourceUrl],
    ['license', manifest.license],
    ['generated_at', manifest.generatedAt],
    ['entry_count', String(entryCount)],
    ['schema_version', String(manifest.schemaVersion)],
  ];
}

async function openExpoSqliteDatabase(databaseName: string): Promise<OfflineSqliteDatabase> {
  const SQLite = await import('expo-sqlite');
  return SQLite.openDatabaseAsync(databaseName);
}

async function deleteExpoSqliteDatabase(databaseName: string) {
  const SQLite = await import('expo-sqlite');
  await SQLite.deleteDatabaseAsync(databaseName);
}
