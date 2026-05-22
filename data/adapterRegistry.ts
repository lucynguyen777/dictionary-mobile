import {
  ApiBilingualMeaningResult,
  ApiMeaningResult,
  ApiRelatedWords,
  fetchAmharicMeaning,
  fetchAmharicRelatedWords,
  fetchArabicMeaning,
  fetchArabicRelatedWords,
  fetchBilingualMeaning,
  fetchBurmeseMeaning,
  fetchBurmeseRelatedWords,
  fetchEnglishMeaning,
  fetchEnglishRelatedWords,
  fetchEstonianMeaning,
  fetchEstonianRelatedWords,
  fetchFinnishMeaning,
  fetchFinnishRelatedWords,
  fetchHawaiianMeaning,
  fetchHawaiianRelatedWords,
  fetchHebrewMeaning,
  fetchHebrewRelatedWords,
  fetchHungarianMeaning,
  fetchHungarianRelatedWords,
  fetchIgboMeaning,
  fetchIgboRelatedWords,
  fetchJapaneseMeaning,
  fetchJapaneseRelatedWords,
  fetchJavaneseMeaning,
  fetchJavaneseRelatedWords,
  fetchKazakhMeaning,
  fetchKazakhRelatedWords,
  fetchKannadaMeaning,
  fetchKannadaRelatedWords,
  fetchKoreanMeaning,
  fetchKoreanRelatedWords,
  fetchMalayalamMeaning,
  fetchMalayalamRelatedWords,
  fetchMandarinMeaning,
  fetchMandarinRelatedWords,
  fetchMinhQndMonolingualMeaning,
  fetchMinhQndRelatedWords,
  fetchMonolingualMeaning,
  fetchRelatedWords,
  fetchRussianMeaning,
  fetchRussianRelatedWords,
  fetchSomaliMeaning,
  fetchSomaliRelatedWords,
  fetchSwahiliMeaning,
  fetchSwahiliRelatedWords,
  fetchTagalogMeaning,
  fetchTagalogRelatedWords,
  fetchTamilMeaning,
  fetchTamilRelatedWords,
  fetchTeluguMeaning,
  fetchTeluguRelatedWords,
  fetchTibetanMeaning,
  fetchTibetanRelatedWords,
  fetchTurkishMeaning,
  fetchTurkishRelatedWords,
  fetchVietnameseSuggestions,
  fetchWiktApiMonolingualMeaning,
  fetchWiktApiRelatedWords,
  fetchYorubaMeaning,
  fetchYorubaRelatedWords,
  fetchZuluMeaning,
  fetchZuluRelatedWords,
} from './dictionaryApi';
import { languageOptions } from './languages';
import { fetchOfflineMonolingualMeaning, fetchOfflineRelatedWords } from './offlineDictionaryRuntimeLookup';

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
    fetchMonolingualMeaning: (word: string) => fetchEnglishMeaning(word),
    fetchRelatedWords: (word: string) => fetchEnglishRelatedWords(word),
    fetchBilingualMeaning: (word: string, s: string, t: string) => fetchBilingualMeaning(word, s, t),
  },
  vi: {
    key: 'vi',
    supportsMonolingual: true,
    supportsBilingual: true,
    fetchMonolingualMeaning: (word: string) => fetchMinhQndMonolingualMeaning(word, 'vi'),
    fetchRelatedWords: (word: string) => fetchMinhQndRelatedWords(word, 'vi'),
    fetchSuggestions: (q: string) => fetchVietnameseSuggestions(q),
    fetchBilingualMeaning: (word: string, s: string, t: string) => fetchBilingualMeaning(word, s, t),
  },
  fr: {
    key: 'fr',
    supportsMonolingual: true,
    supportsBilingual: true,
    fetchMonolingualMeaning: (word: string) => fetchWiktApiMonolingualMeaning(word, 'fr'),
    fetchRelatedWords: (word: string) => fetchWiktApiRelatedWords(word, 'fr'),
    fetchBilingualMeaning: (word: string, s: string, t: string) => fetchBilingualMeaning(word, s, t),
  },
  es: {
    key: 'es',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchWiktApiMonolingualMeaning(word, 'es'),
    fetchRelatedWords: (word: string) => fetchWiktApiRelatedWords(word, 'es'),
  },
  ms: {
    key: 'ms',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchWiktApiMonolingualMeaning(word, 'ms'),
    fetchRelatedWords: (word: string) => fetchWiktApiRelatedWords(word, 'ms'),
  },
  fi: {
    key: 'fi',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchFinnishMeaning(word),
    fetchRelatedWords: (word: string) => fetchFinnishRelatedWords(word),
  },
  et: {
    key: 'et',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchEstonianMeaning(word),
    fetchRelatedWords: (word: string) => fetchEstonianRelatedWords(word),
  },
  tr: {
    key: 'tr',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchTurkishMeaning(word),
    fetchRelatedWords: (word: string) => fetchTurkishRelatedWords(word),
  },
  kk: {
    key: 'kk',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchKazakhMeaning(word),
    fetchRelatedWords: (word: string) => fetchKazakhRelatedWords(word),
  },
  ja: {
    key: 'ja',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchJapaneseMeaning(word),
    fetchRelatedWords: (word: string) => fetchJapaneseRelatedWords(word),
  },
  ko: {
    key: 'ko',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchKoreanMeaning(word),
    fetchRelatedWords: (word: string) => fetchKoreanRelatedWords(word),
  },
  sw: {
    key: 'sw',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchSwahiliMeaning(word),
    fetchRelatedWords: (word: string) => fetchSwahiliRelatedWords(word),
  },
  hu: {
    key: 'hu',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchHungarianMeaning(word),
    fetchRelatedWords: (word: string) => fetchHungarianRelatedWords(word),
  },
  ar: {
    key: 'ar',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchArabicMeaning(word),
    fetchRelatedWords: (word: string) => fetchArabicRelatedWords(word),
  },
  he: {
    key: 'he',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchHebrewMeaning(word),
    fetchRelatedWords: (word: string) => fetchHebrewRelatedWords(word),
  },
  tl: {
    key: 'tl',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchTagalogMeaning(word),
    fetchRelatedWords: (word: string) => fetchTagalogRelatedWords(word),
  },
  am: {
    key: 'am',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchAmharicMeaning(word),
    fetchRelatedWords: (word: string) => fetchAmharicRelatedWords(word),
  },
  ru: {
    key: 'ru',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchRussianMeaning(word),
    fetchRelatedWords: (word: string) => fetchRussianRelatedWords(word),
  },
  zh: {
    key: 'zh',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchMandarinMeaning(word),
    fetchRelatedWords: (word: string) => fetchMandarinRelatedWords(word),
  },
  jv: {
    key: 'jv',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchJavaneseMeaning(word),
    fetchRelatedWords: (word: string) => fetchJavaneseRelatedWords(word),
  },
  so: {
    key: 'so',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchSomaliMeaning(word),
    fetchRelatedWords: (word: string) => fetchSomaliRelatedWords(word),
  },
  my: {
    key: 'my',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchBurmeseMeaning(word),
    fetchRelatedWords: (word: string) => fetchBurmeseRelatedWords(word),
  },
  bo: {
    key: 'bo',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchTibetanMeaning(word),
    fetchRelatedWords: (word: string) => fetchTibetanRelatedWords(word),
  },
  yo: {
    key: 'yo',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchYorubaMeaning(word),
    fetchRelatedWords: (word: string) => fetchYorubaRelatedWords(word),
  },
  zu: {
    key: 'zu',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchZuluMeaning(word),
    fetchRelatedWords: (word: string) => fetchZuluRelatedWords(word),
  },
  ig: {
    key: 'ig',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchIgboMeaning(word),
    fetchRelatedWords: (word: string) => fetchIgboRelatedWords(word),
  },
  haw: {
    key: 'haw',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchHawaiianMeaning(word),
    fetchRelatedWords: (word: string) => fetchHawaiianRelatedWords(word),
  },
  ta: {
    key: 'ta',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchTamilMeaning(word),
    fetchRelatedWords: (word: string) => fetchTamilRelatedWords(word),
  },
  te: {
    key: 'te',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchTeluguMeaning(word),
    fetchRelatedWords: (word: string) => fetchTeluguRelatedWords(word),
  },
  kn: {
    key: 'kn',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchKannadaMeaning(word),
    fetchRelatedWords: (word: string) => fetchKannadaRelatedWords(word),
  },
  ml: {
    key: 'ml',
    supportsMonolingual: true,
    supportsBilingual: false,
    fetchMonolingualMeaning: (word: string) => fetchMalayalamMeaning(word),
    fetchRelatedWords: (word: string) => fetchMalayalamRelatedWords(word),
  },
  // Source-specific adapters (registered by key) — these make it explicit which upstream source is used.
  minhqnd: {
    key: 'minhqnd',
    supportsMonolingual: true,
    supportsBilingual: true,
    fetchMonolingualMeaning: (word: string) => fetchMinhQndMonolingualMeaning(word, 'vi'),
    fetchBilingualMeaning: (word: string, s: string, t: string) => fetchBilingualMeaning(word, s, t),
    fetchRelatedWords: (word: string) => fetchMinhQndRelatedWords(word, 'vi'),
    fetchSuggestions: (q: string) => fetchVietnameseSuggestions(q),
  },
  wiktapi: {
    key: 'wiktapi',
    supportsMonolingual: true,
    supportsBilingual: true,
    fetchMonolingualMeaning: (word: string) => fetchWiktApiMonolingualMeaning(word, 'fr'),
    fetchBilingualMeaning: (word: string, s: string, t: string) => fetchBilingualMeaning(word, s, t),
    fetchRelatedWords: (word: string) => fetchWiktApiRelatedWords(word, 'fr'),
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
  const offlineMeaning = await fetchOfflineMonolingualMeaning(word, languageCode);
  if (offlineMeaning) return offlineMeaning;

  const adapter = getAdapterForLanguage(languageCode);
  if (!adapter.fetchMonolingualMeaning) throw new Error(`No monolingual dictionary for ${languageCode}`);
  return adapter.fetchMonolingualMeaning(word);
}

export async function lookupRelatedWords(word: string, languageCode: string) {
  const offlineRelatedWords = await fetchOfflineRelatedWords(word, languageCode);
  if (offlineRelatedWords) return offlineRelatedWords;

  const adapter = getAdapterForLanguage(languageCode);
  if (!adapter.fetchRelatedWords) return { synonyms: [], antonyms: [] };
  return adapter.fetchRelatedWords(word);
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
  lookupRelatedWords,
  lookupBilingual,
};
