import { languageOptions } from './languages';
import {
  ApiMeaningResult,
  ApiRelatedWords,
  ApiBilingualMeaningResult,
  fetchMonolingualMeaning,
  fetchRelatedWords,
  fetchBilingualMeaning,
  fetchVietnameseSuggestions,
} from './dictionaryApi';

export type LanguageAdapter = {
  key: string;
  supportsMonolingual: boolean;
  supportsBilingual: boolean;
  fetchMonolingualMeaning?: (word: string) => Promise<ApiMeaningResult>;
  fetchRelatedWords?: (word: string) => Promise<ApiRelatedWords>;
  fetchBilingualMeaning?: (word: string, sourceLang: string, targetLang: string) => Promise<ApiBilingualMeaningResult>;
  fetchSuggestions?: (query: string) => Promise<string[]>;
};

const adapters: Record<string, LanguageAdapter> = {
  en: {
    key: 'en',
    supportsMonolingual: true,
    supportsBilingual: true,
    fetchMonolingualMeaning: (word: string) => fetchMonolingualMeaning(word, 'en'),
    fetchRelatedWords: (word: string) => fetchRelatedWords(word, 'en'),
  },
  vi: {
    key: 'vi',
    supportsMonolingual: true,
    supportsBilingual: true,
    fetchMonolingualMeaning: (word: string) => fetchMonolingualMeaning(word, 'vi'),
    fetchRelatedWords: (word: string) => fetchRelatedWords(word, 'vi'),
    fetchSuggestions: (q: string) => fetchVietnameseSuggestions(q),
  },
  fr: {
    key: 'fr',
    supportsMonolingual: true,
    supportsBilingual: true,
    fetchMonolingualMeaning: (word: string) => fetchMonolingualMeaning(word, 'fr'),
    fetchRelatedWords: (word: string) => fetchRelatedWords(word, 'fr'),
  },
};

export function getAdapterByKey(key: string): LanguageAdapter | undefined {
  return adapters[key];
}

export function getAdapterForLanguage(languageCode: string): LanguageAdapter {
  const lang = languageOptions.find((l) => l.code === languageCode);
  const key = lang?.adapterKey ?? languageCode;

  if (adapters[key]) return adapters[key];

  // Fallback adapter that delegates to generic dictionaryApi functions
  return {
    key,
    supportsMonolingual: true,
    supportsBilingual: true,
    fetchMonolingualMeaning: (word: string) => fetchMonolingualMeaning(word, languageCode),
    fetchRelatedWords: (word: string) => fetchRelatedWords(word, languageCode),
    fetchBilingualMeaning: (word: string, sourceLang: string, targetLang: string) => fetchBilingualMeaning(word, sourceLang, targetLang),
  };
}

export function getAdapterForPair(sourceLang: string, targetLang: string): LanguageAdapter {
  const src = getAdapterForLanguage(sourceLang);
  if (src.supportsBilingual) return src;

  const tgt = getAdapterForLanguage(targetLang);
  if (tgt.supportsBilingual) return tgt;

  // Generic bilingual adapter using dictionaryApi as a last resort
  return {
    key: `${sourceLang}->${targetLang}`,
    supportsMonolingual: false,
    supportsBilingual: true,
    fetchBilingualMeaning: (word: string, s: string, t: string) => fetchBilingualMeaning(word, s, t),
  };
}

export async function lookupMonolingual(word: string, languageCode: string) {
  const adapter = getAdapterForLanguage(languageCode);
  if (!adapter.fetchMonolingualMeaning) throw new Error(`No monolingual dictionary for ${languageCode}`);
  return adapter.fetchMonolingualMeaning(word);
}

export async function lookupBilingual(word: string, sourceLang: string, targetLang: string) {
  const adapter = getAdapterForPair(sourceLang, targetLang);
  if (!adapter.fetchBilingualMeaning) throw new Error(`No bilingual adapter for ${sourceLang}->${targetLang}`);
  return adapter.fetchBilingualMeaning(word, sourceLang, targetLang);
}

export default {
  adapters,
  getAdapterByKey,
  getAdapterForLanguage,
  getAdapterForPair,
  lookupMonolingual,
  lookupBilingual,
};
