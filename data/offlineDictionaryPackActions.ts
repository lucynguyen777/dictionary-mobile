import { ungzip } from 'pako';

import {
  type OfflineDictionaryStorage,
  type OfflinePackManifest,
  importOfflineDictionaryPack,
} from './offlineDictionaryImport';
import { createDefaultOfflineDictionaryStorage } from './offlineDictionaryDefaultStorage';
import type { OfflineDictionaryEntry } from './offlineDictionaryLookup';
import {
  type OfflinePackDownloadFileSystem,
  type OfflinePackDownloadSource,
  createExpoOfflinePackFileSystem,
  downloadOfflineDictionaryPack,
} from './offlineDictionaryPackDownload';
import type { OfflineDictionaryPack } from './offlineDictionaryPacks';
import {
  type OfflinePackInstallState,
  deleteOfflinePackRecord,
  getOfflinePackInstallRecord,
  markOfflinePackFailed,
} from './offlineDictionaryPackStore';

export type OfflinePackFileReader = {
  readBytes: (uri: string) => Promise<Uint8Array>;
  readText: (uri: string) => Promise<string>;
};

export type OfflinePackInstallActionSuccess = {
  entryCount: number;
  ok: true;
  state: OfflinePackInstallState;
};

export type OfflinePackInstallActionFailure = {
  errorMessage: string;
  ok: false;
  state: OfflinePackInstallState;
};

export type OfflinePackInstallActionResult = OfflinePackInstallActionSuccess | OfflinePackInstallActionFailure;

type SaveClock = () => string;

export async function installOfflineDictionaryPackFromSource({
  clock = now,
  fileReader,
  fileSystem,
  pack,
  source = pack.downloadSource,
  state,
  storage,
}: {
  clock?: SaveClock;
  fileReader?: OfflinePackFileReader;
  fileSystem?: OfflinePackDownloadFileSystem;
  pack: OfflineDictionaryPack;
  source?: OfflinePackDownloadSource;
  state: OfflinePackInstallState;
  storage?: OfflineDictionaryStorage;
}): Promise<OfflinePackInstallActionResult> {
  if (!source) {
    const errorMessage = 'Offline pack source URL is not configured.';
    return {
      errorMessage,
      ok: false,
      state: await markOfflinePackFailed(state, pack, errorMessage, clock),
    };
  }

  const packFileSystem = fileSystem ?? await createExpoOfflinePackFileSystem(pack.id);
  const packFileReader = fileReader ?? await createExpoOfflinePackFileReader();
  const offlineStorage = storage ?? await createDefaultOfflineDictionaryStorage();
  const downloadResult = await downloadOfflineDictionaryPack({
    clock,
    fileSystem: packFileSystem,
    pack,
    source,
    state,
  });

  if (!downloadResult.ok) return downloadResult;

  const downloadedUris = [downloadResult.entries.uri, downloadResult.manifest?.uri].filter(Boolean) as string[];

  try {
    const manifest = downloadResult.manifest
      ? await readOfflinePackManifest(packFileReader, downloadResult.manifest.uri)
      : getManifestFromDownloadSource(pack, source);
    const entries = await readOfflinePackEntries(packFileReader, downloadResult.entries.uri, pack.languageCode);
    const importedState = await importOfflineDictionaryPack({
      clock,
      entries,
      manifest,
      pack,
      state: downloadResult.state,
      storage: offlineStorage,
    });
    await cleanupDownloadedArtifacts(packFileSystem, downloadedUris);

    const record = getOfflinePackInstallRecord(importedState, pack);
    if (record.status === 'ready') {
      return {
        entryCount: record.entryCount,
        ok: true,
        state: importedState,
      };
    }

    return {
      errorMessage: record.errorMessage || 'Offline pack import failed.',
      ok: false,
      state: importedState,
    };
  } catch (error) {
    await cleanupDownloadedArtifacts(packFileSystem, downloadedUris);

    const errorMessage = error instanceof Error ? error.message : 'Offline pack install failed.';
    return {
      errorMessage,
      ok: false,
      state: await markOfflinePackFailed(downloadResult.state, pack, errorMessage, clock),
    };
  }
}

export async function deleteInstalledOfflineDictionaryPack({
  pack,
  state,
  storage,
}: {
  pack: OfflineDictionaryPack;
  state: OfflinePackInstallState;
  storage?: OfflineDictionaryStorage;
}) {
  const offlineStorage = storage ?? await createDefaultOfflineDictionaryStorage();
  await offlineStorage.deletePack(pack.id);
  return deleteOfflinePackRecord(state, pack.id);
}

export async function readOfflinePackManifest(fileReader: OfflinePackFileReader, uri: string): Promise<OfflinePackManifest> {
  return JSON.parse(await fileReader.readText(uri)) as OfflinePackManifest;
}

export async function readOfflinePackEntries(
  fileReader: OfflinePackFileReader,
  uri: string,
  expectedLangCode?: string
): Promise<OfflineDictionaryEntry[]> {
  const rawEntries = uri.toLocaleLowerCase().endsWith('.gz')
    ? ungzip(await fileReader.readBytes(uri), { to: 'string' })
    : await fileReader.readText(uri);

  const parsed = JSON.parse(rawEntries) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Offline pack entries are not a list.');
  const entries = parsed.map((value) => sanitizeOfflinePackEntry(value, expectedLangCode)).filter((entry): entry is OfflineDictionaryEntry => Boolean(entry));
  if (parsed.length && !entries.length) throw new Error('Offline pack has no valid entries for this language.');
  return entries;
}

const LANGUAGE_TAG = /^[a-z]{2,3}$/;
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : []);
const text = (value: unknown) => (typeof value === 'string' ? value : '');

// Packs come from the network: entries without a headword, definitions, licence or attribution, or
// from another language, are dropped instead of being written into the dictionary database.
export function sanitizeOfflinePackEntry(value: unknown, expectedLangCode?: string): OfflineDictionaryEntry | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const word = text(raw.word).trim();
  const langCode = text(raw.langCode);
  const attribution = text(raw.attribution).trim();
  if (!word || !langCode || (expectedLangCode && langCode !== expectedLangCode)) return null;
  if (raw.license !== 'CC-BY-SA-4.0/GFDL' || !attribution) return null;

  const definitions = (Array.isArray(raw.definitions) ? raw.definitions : [])
    .map((definition) => {
      const item = (definition ?? {}) as Record<string, unknown>;
      return { gloss: text(item.gloss).trim(), tags: strings(item.tags), topics: strings(item.topics) };
    })
    .filter((definition) => definition.gloss);
  if (!definitions.length) return null;

  const relations = (raw.relations ?? {}) as Record<string, unknown>;
  const normalizedWord = text(raw.normalizedWord).trim() || word.toLocaleLowerCase();
  return {
    attribution,
    audio: strings(raw.audio),
    definitions,
    etymology: text(raw.etymology),
    examples: (Array.isArray(raw.examples) ? raw.examples : [])
      .map((example) => {
        const item = (example ?? {}) as Record<string, unknown>;
        const translation = text(item.translation).trim();
        const translationLanguage = text(item.translationLanguage).trim();
        const helperSource = text(item.helperSource).trim();
        return {
          source: text(item.source).trim(),
          ...(translation ? { translation } : {}),
          // The language marker only travels with a translation, so an English aid is never shown unlabelled.
          ...(translation && LANGUAGE_TAG.test(translationLanguage) ? { translationLanguage } : {}),
          ...(helperSource ? { helperSource } : {}),
        };
      })
      .filter((example) => example.source),
    ...(LANGUAGE_TAG.test(text(raw.glossLangCode)) && raw.glossLangCode !== langCode
      ? { glossLangCode: raw.glossLangCode as OfflineDictionaryEntry['langCode'] }
      : {}),
    id: text(raw.id).trim() || `${langCode}:${normalizedWord}`,
    ipa: text(raw.ipa),
    langCode: langCode as OfflineDictionaryEntry['langCode'],
    license: 'CC-BY-SA-4.0/GFDL',
    normalizedWord,
    partOfSpeech: text(raw.partOfSpeech),
    relations: { antonyms: strings(relations.antonyms), synonyms: strings(relations.synonyms) },
    sourceName: text(raw.sourceName).trim() || 'unknown',
    sourceUrl: text(raw.sourceUrl),
    updatedAt: text(raw.updatedAt),
    word,
  };
}

async function createExpoOfflinePackFileReader(): Promise<OfflinePackFileReader> {
  const { File } = await import('expo-file-system');

  return {
    async readBytes(uri: string) {
      return new File(uri).bytes();
    },
    async readText(uri: string) {
      return new File(uri).text();
    },
  };
}

function getManifestFromDownloadSource(
  pack: OfflineDictionaryPack,
  source: OfflinePackDownloadSource
): OfflinePackManifest {
  return {
    entryCount: source.entryCount,
    generatedAt: '',
    ...(pack.glossLanguageCode ? { glossLangCode: pack.glossLanguageCode } : {}),
    langCode: pack.languageCode,
    license: pack.license,
    packId: pack.id,
    schemaVersion: 1,
    sourceName: pack.sourceName,
    sourceUrl: source.entriesUrl,
  };
}

async function cleanupDownloadedArtifacts(fileSystem: OfflinePackDownloadFileSystem, uris: string[]) {
  await Promise.all(uris.map((uri) => fileSystem.deleteFile(uri)));
}

function now() {
  return new Date().toISOString();
}
