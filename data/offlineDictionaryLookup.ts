import type { ApiMeaningResult, ApiRelatedWords } from './dictionaryApi';
import type { LanguageCode } from './languages';
import { getMorphologyCandidates } from './morphology';

export type OfflineDictionaryDefinition = {
  gloss: string;
  tags: string[];
  topics: string[];
};

export type OfflineDictionaryExample = {
  source: string;
  translation?: string;
};

export type OfflineDictionaryEntry = {
  attribution: string;
  audio: string[];
  definitions: OfflineDictionaryDefinition[];
  etymology: string;
  examples: OfflineDictionaryExample[];
  id: string;
  ipa: string;
  langCode: LanguageCode;
  license: 'CC-BY-SA-4.0/GFDL';
  normalizedWord: string;
  partOfSpeech: string;
  relations: {
    antonyms: string[];
    synonyms: string[];
  };
  sourceName: string;
  sourceUrl: string;
  updatedAt: string;
  word: string;
};

export type OfflineDictionaryLookupResult = {
  entry: OfflineDictionaryEntry;
  matchType: 'exact' | 'morphology';
  matchedLookupKey: string;
  requestedWord: string;
};

export function findOfflineDictionaryEntry(
  entries: OfflineDictionaryEntry[],
  word: string,
  languageCode: LanguageCode
): OfflineDictionaryLookupResult | null {
  const requestedWord = normalizeOfflineLookupKey(word);
  if (!requestedWord) return null;

  const lookupCandidates = getOfflineLookupCandidates(word, languageCode);

  for (const [index, lookupKey] of lookupCandidates.entries()) {
    const entry = entries.find(
      (item) =>
        item.langCode === languageCode &&
        (normalizeOfflineLookupKey(item.normalizedWord) === lookupKey || normalizeOfflineLookupKey(item.word) === lookupKey)
    );

    if (entry) {
      return {
        entry,
        matchType: index === 0 ? 'exact' : 'morphology',
        matchedLookupKey: lookupKey,
        requestedWord,
      };
    }
  }

  return null;
}

export function getOfflineRelatedWords(result: OfflineDictionaryLookupResult): ApiRelatedWords {
  return {
    antonyms: result.entry.relations.antonyms,
    synonyms: result.entry.relations.synonyms,
  };
}

export function mapOfflineEntryToApiMeaning(result: OfflineDictionaryLookupResult): ApiMeaningResult {
  const { entry } = result;
  const source =
    result.matchType === 'exact'
      ? `${entry.sourceName} offline pack`
      : `${entry.sourceName} offline pack · base form of ${result.requestedWord}`;

  return {
    audio: entry.audio[0] ?? '',
    definitions: entry.definitions.map((definition) => ({
      antonyms: entry.relations.antonyms,
      domain: definition.topics[0] ?? 'Offline pack',
      examples: entry.examples,
      meaning: definition.gloss,
      partOfSpeech: entry.partOfSpeech,
      source: entry.attribution,
      synonyms: entry.relations.synonyms,
    })),
    ipa: entry.ipa,
    source,
    word: entry.word,
  };
}

export function getOfflineLookupCandidates(word: string, languageCode: LanguageCode) {
  const normalizedWord = normalizeOfflineLookupKey(word);
  const morphologyCandidates = getMorphologyCandidates(languageCode, normalizedWord).map((candidate) =>
    normalizeOfflineLookupKey(candidate.word)
  );

  return uniqueLookupKeys([normalizedWord, ...morphologyCandidates]);
}

export function normalizeOfflineLookupKey(value: string) {
  return value.trim().toLocaleLowerCase();
}

function uniqueLookupKeys(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
