import type { ApiMeaningResult, ApiRelatedWords } from './dictionaryApi';
import type { LanguageCode } from './languages';
import { createDefaultOfflineDictionaryStorage } from './offlineDictionaryDefaultStorage';
import type { OfflineDictionaryStorage, OfflinePackManifest } from './offlineDictionaryImport';
import {
  type OfflineDictionaryEntry,
  getOfflineLookupCandidates,
  mapOfflineEntryToApiMeaning,
  normalizeOfflineLookupKey,
} from './offlineDictionaryLookup';
import { type OfflineDictionaryPack, offlineDictionaryPacks } from './offlineDictionaryPacks';
import { type OfflinePackInstallState, loadOfflinePackInstallState } from './offlineDictionaryPackStore';

export type OfflineDictionaryStorageFactory = (
  readyManifests: OfflinePackManifest[]
) => Promise<OfflineDictionaryStorage>;

export async function fetchOfflineMonolingualMeaning(
  word: string,
  languageCode: string,
  options: {
    loadState?: () => Promise<OfflinePackInstallState>;
    packs?: OfflineDictionaryPack[];
    storageFactory?: OfflineDictionaryStorageFactory;
  } = {}
): Promise<ApiMeaningResult | null> {
  const entry = await findReadyOfflineEntry(word, languageCode, options);
  if (!entry) return null;

  return mapOfflineEntryToApiMeaning(buildOfflineLookupResult(entry, word, languageCode as LanguageCode));
}

export async function fetchOfflineRelatedWords(
  word: string,
  languageCode: string,
  options: {
    loadState?: () => Promise<OfflinePackInstallState>;
    packs?: OfflineDictionaryPack[];
    storageFactory?: OfflineDictionaryStorageFactory;
  } = {}
): Promise<ApiRelatedWords | null> {
  const entry = await findReadyOfflineEntry(word, languageCode, options);
  if (!entry) return null;

  return {
    antonyms: entry.relations.antonyms,
    synonyms: entry.relations.synonyms,
  };
}

export async function findReadyOfflineEntry(
  word: string,
  languageCode: string,
  {
    loadState = loadOfflinePackInstallState,
    packs = offlineDictionaryPacks,
    storageFactory = createDefaultOfflineDictionaryStorage,
  }: {
    loadState?: () => Promise<OfflinePackInstallState>;
    packs?: OfflineDictionaryPack[];
    storageFactory?: OfflineDictionaryStorageFactory;
  } = {}
) {
  const readyManifests = getReadyOfflinePackManifests(await loadState(), packs).filter(
    (manifest) => manifest.langCode === languageCode
  );
  if (!readyManifests.length) return null;

  try {
    const storage = await storageFactory(readyManifests);
    return storage.findEntry(word, languageCode as LanguageCode);
  } catch {
    return null;
  }
}

export function getReadyOfflinePackManifests(
  state: OfflinePackInstallState,
  packs: OfflineDictionaryPack[] = offlineDictionaryPacks
): OfflinePackManifest[] {
  return state.records
    .filter((record) => record.status === 'ready')
    .flatMap((record) => {
      const pack = packs.find((item) => item.id === record.packId && item.languageCode === record.languageCode);
      if (!pack) return [];

      return [
        {
          entryCount: record.entryCount,
          generatedAt: record.installedAt || record.updatedAt,
          langCode: pack.languageCode,
          license: pack.license,
          packId: pack.id,
          schemaVersion: 1,
          sourceName: pack.sourceName,
          sourceUrl: pack.downloadSource?.entriesUrl ?? '',
        },
      ];
    });
}

function buildOfflineLookupResult(entry: OfflineDictionaryEntry, requestedWord: string, languageCode: LanguageCode) {
  const lookupCandidates = getOfflineLookupCandidates(requestedWord, languageCode);
  const entryKeys = [entry.normalizedWord, entry.word].map(normalizeOfflineLookupKey);
  const matchedIndex = lookupCandidates.findIndex((candidate) => entryKeys.includes(candidate));
  const matchedLookupKey = lookupCandidates[Math.max(0, matchedIndex)] ?? normalizeOfflineLookupKey(requestedWord);

  return {
    entry,
    matchedLookupKey,
    matchType: matchedIndex <= 0 ? 'exact' as const : 'morphology' as const,
    requestedWord: normalizeOfflineLookupKey(requestedWord),
  };
}
