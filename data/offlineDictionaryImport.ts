import type { LanguageCode } from './languages';
import type { OfflineDictionaryEntry } from './offlineDictionaryLookup';
import { findOfflineDictionaryEntry } from './offlineDictionaryLookup';
import type { OfflineDictionaryPack } from './offlineDictionaryPacks';
import {
  OfflinePackInstallState,
  getOfflinePackInstallRecord,
  markOfflinePackDownloaded,
  markOfflinePackFailed,
  markOfflinePackImporting,
  markOfflinePackReady,
} from './offlineDictionaryPackStore';

export const OFFLINE_DICTIONARY_SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS offline_pack_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);`,
  `CREATE TABLE IF NOT EXISTS dictionary_entry (
  id TEXT PRIMARY KEY,
  lang_code TEXT NOT NULL,
  word TEXT NOT NULL,
  normalized_word TEXT NOT NULL,
  part_of_speech TEXT,
  definitions_json TEXT NOT NULL,
  ipa TEXT,
  audio_json TEXT NOT NULL DEFAULT '[]',
  examples_json TEXT NOT NULL DEFAULT '[]',
  relations_json TEXT NOT NULL DEFAULT '{}',
  etymology TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  license TEXT NOT NULL,
  attribution TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS dictionary_entry_fts USING fts5(
  word,
  normalized_word,
  definitions,
  content='dictionary_entry',
  content_rowid='rowid'
);`,
  `CREATE INDEX IF NOT EXISTS dictionary_entry_lang_word_idx
  ON dictionary_entry(lang_code, normalized_word);`,
];

export type OfflinePackManifest = {
  entryCount: number;
  generatedAt: string;
  langCode: LanguageCode;
  license: 'CC-BY-SA-4.0/GFDL';
  packId: string;
  schemaVersion: number;
  sourceName: string;
  sourceUrl: string;
};

export type OfflineDictionarySqliteRow = {
  id: string;
  lang_code: LanguageCode;
  word: string;
  normalized_word: string;
  part_of_speech: string;
  definitions_json: string;
  ipa: string;
  audio_json: string;
  examples_json: string;
  relations_json: string;
  etymology: string;
  source_name: string;
  source_url: string;
  license: 'CC-BY-SA-4.0/GFDL';
  attribution: string;
  updated_at: string;
};

export type OfflineDictionaryStorageImportResult = {
  databaseUri: string;
  entryCount: number;
};

export type OfflineDictionaryStorage = {
  deletePack: (packId: string) => Promise<void>;
  findEntry: (word: string, languageCode: LanguageCode) => Promise<OfflineDictionaryEntry | null>;
  importPack: (
    manifest: OfflinePackManifest,
    entries: OfflineDictionaryEntry[]
  ) => Promise<OfflineDictionaryStorageImportResult>;
};

type SaveClock = () => string;

export async function importOfflineDictionaryPack({
  clock = now,
  entries,
  manifest,
  pack,
  state,
  storage,
}: {
  clock?: SaveClock;
  entries: OfflineDictionaryEntry[];
  manifest: OfflinePackManifest;
  pack: OfflineDictionaryPack;
  state: OfflinePackInstallState;
  storage: OfflineDictionaryStorage;
}) {
  const manifestErrors = validateOfflinePackManifest(pack, manifest, entries);
  if (manifestErrors.length) {
    return markOfflinePackFailed(state, pack, manifestErrors.join(' '), clock);
  }

  const importingState = await markOfflinePackImporting(state, pack, clock);

  try {
    const result = await storage.importPack(manifest, entries);
    const downloadedState = await markOfflinePackDownloaded(
      importingState,
      pack,
      {
        entryCount: result.entryCount,
        localUri: result.databaseUri,
      },
      clock
    );

    return markOfflinePackReady(downloadedState, pack, clock);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Offline pack import failed.';
    return markOfflinePackFailed(importingState, pack, message, clock);
  }
}

export function validateOfflinePackManifest(
  pack: OfflineDictionaryPack,
  manifest: OfflinePackManifest,
  entries: OfflineDictionaryEntry[]
) {
  const errors: string[] = [];

  if (manifest.schemaVersion !== 1) {
    errors.push(`Unsupported offline pack schema version ${manifest.schemaVersion}.`);
  }

  if (manifest.packId !== pack.id) {
    errors.push(`Pack id mismatch: expected ${pack.id}, received ${manifest.packId}.`);
  }

  if (manifest.langCode !== pack.languageCode) {
    errors.push(`Language mismatch: expected ${pack.languageCode}, received ${manifest.langCode}.`);
  }

  if (manifest.license !== pack.license) {
    errors.push(`License mismatch: expected ${pack.license}, received ${manifest.license}.`);
  }

  if (entries.length !== manifest.entryCount) {
    errors.push(`Entry count mismatch: manifest has ${manifest.entryCount}, entries file has ${entries.length}.`);
  }

  if (entries.some((entry) => entry.langCode !== manifest.langCode)) {
    errors.push('Entries include a language outside the manifest language.');
  }

  return errors;
}

export function serializeOfflineEntryForSqlite(entry: OfflineDictionaryEntry): OfflineDictionarySqliteRow {
  return {
    attribution: entry.attribution,
    audio_json: JSON.stringify(entry.audio),
    definitions_json: JSON.stringify(entry.definitions),
    etymology: entry.etymology,
    examples_json: JSON.stringify(entry.examples),
    id: entry.id,
    ipa: entry.ipa,
    lang_code: entry.langCode,
    license: entry.license,
    normalized_word: entry.normalizedWord,
    part_of_speech: entry.partOfSpeech,
    relations_json: JSON.stringify(entry.relations),
    source_name: entry.sourceName,
    source_url: entry.sourceUrl,
    updated_at: entry.updatedAt,
    word: entry.word,
  };
}

export function parseOfflineEntryFromSqliteRow(row: OfflineDictionarySqliteRow): OfflineDictionaryEntry {
  return {
    attribution: row.attribution,
    audio: parseJsonArray(row.audio_json),
    definitions: parseJsonArray(row.definitions_json),
    etymology: row.etymology,
    examples: parseJsonArray(row.examples_json),
    id: row.id,
    ipa: row.ipa,
    langCode: row.lang_code,
    license: row.license,
    normalizedWord: row.normalized_word,
    partOfSpeech: row.part_of_speech,
    relations: parseJsonObject(row.relations_json, {
      antonyms: [],
      synonyms: [],
    }),
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    updatedAt: row.updated_at,
    word: row.word,
  };
}

export function createMemoryOfflineDictionaryStorage(): OfflineDictionaryStorage {
  const rowsByPackId = new Map<string, OfflineDictionarySqliteRow[]>();

  return {
    async deletePack(packId: string) {
      rowsByPackId.delete(packId);
    },
    async findEntry(word: string, languageCode: LanguageCode) {
      const entries = Array.from(rowsByPackId.values())
        .flat()
        .map(parseOfflineEntryFromSqliteRow);
      return findOfflineDictionaryEntry(entries, word, languageCode)?.entry ?? null;
    },
    async importPack(manifest: OfflinePackManifest, entries: OfflineDictionaryEntry[]) {
      const rows = entries.map(serializeOfflineEntryForSqlite);
      rowsByPackId.set(manifest.packId, rows);

      return {
        databaseUri: `memory://${manifest.packId}.sqlite`,
        entryCount: rows.length,
      };
    },
  };
}

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject<TFallback extends Record<string, unknown>>(value: string, fallback: TFallback) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as TFallback : fallback;
  } catch {
    return fallback;
  }
}

function now() {
  return new Date().toISOString();
}
