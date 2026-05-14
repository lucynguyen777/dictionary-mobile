export type ApiDefinition = {
  partOfSpeech: string;
  meaning: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  domain?: string;
  gender?: string;
  level?: string;
};

export type ApiMeaningResult = {
  word: string;
  ipa: string;
  audio: string;
  definitions: ApiDefinition[];
  source: string;
};

export type ApiRelatedWords = {
  synonyms: string[];
  antonyms: string[];
};

export type ApiBilingualMeaningResult = {
  word: string;
  ipa: string;
  audio: string;
  definitions: ApiDefinition[];
  translations: string[];
  source: string;
};

type DictionaryApiDefinition = {
  definition?: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
};

type DictionaryApiMeaning = {
  partOfSpeech?: string;
  definitions?: DictionaryApiDefinition[];
  synonyms?: string[];
  antonyms?: string[];
};

type DictionaryApiEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: {
    text?: string;
    audio?: string;
  }[];
  meanings?: DictionaryApiMeaning[];
};

type DictionaryApiPhonetic = NonNullable<DictionaryApiEntry['phonetics']>[number];

type DatamuseWord = {
  word?: string;
};

type MinhQndMeaning = {
  definition?: string;
  definition_lang?: string;
  example?: string | null;
  pos?: string | null;
  sub_pos?: string | null;
  source?: string | null;
};

type MinhQndPronunciation = {
  ipa?: string;
  region?: string;
};

type MinhQndTranslation = {
  lang_code?: string;
  lang_name?: string;
  translation?: string;
};

type MinhQndLanguageResult = {
  lang_code?: string;
  lang_name?: string;
  audio?: string;
  meanings?: MinhQndMeaning[];
  pronunciations?: MinhQndPronunciation[];
  translations?: MinhQndTranslation[];
};

type MinhQndLookupResponse = {
  exists?: boolean;
  word?: string;
  results?: MinhQndLanguageResult[];
};

const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const DATAMUSE_API_BASE = 'https://api.datamuse.com/words';
const MINH_QND_DICTIONARY_API_BASE = 'https://dict.minhqnd.com/api/v1/lookup';

export async function fetchEnglishMeaning(word: string): Promise<ApiMeaningResult> {
  const normalizedWord = normalizeWord(word);
  const response = await fetch(`${DICTIONARY_API_BASE}/${encodeURIComponent(normalizedWord)}`);

  if (!response.ok) {
    throw new Error(`No dictionary entry found for "${normalizedWord}".`);
  }

  const payload = (await response.json()) as DictionaryApiEntry[];
  const entry = payload[0];

  if (!entry?.meanings?.length) {
    throw new Error(`No meanings found for "${normalizedWord}".`);
  }

  const preferredPhonetic = pickPreferredPhonetic(entry.phonetics ?? []);
  const phonetic = preferredPhonetic?.text ?? entry.phonetics?.find((item) => item.text)?.text ?? entry.phonetic ?? '';
  const audio = normalizeAudioUrl(preferredPhonetic?.audio ?? '');

  return {
    word: entry.word ?? normalizedWord,
    ipa: phonetic,
    audio: audio.startsWith('//') ? `https:${audio}` : audio,
    definitions: entry.meanings.flatMap((meaning) =>
      (meaning.definitions ?? []).slice(0, 4).map((definition) => ({
        partOfSpeech: meaning.partOfSpeech ?? 'word',
        meaning: definition.definition ?? '',
        examples: definition.example ? [definition.example] : [],
        synonyms: uniqueWords([...(meaning.synonyms ?? []), ...(definition.synonyms ?? [])]),
        antonyms: uniqueWords([...(meaning.antonyms ?? []), ...(definition.antonyms ?? [])]),
      }))
    ).filter((definition) => definition.meaning),
    source: 'dictionaryapi.dev',
  };
}

export async function fetchEnglishRelatedWords(word: string): Promise<ApiRelatedWords> {
  const normalizedWord = normalizeWord(word);
  const [synonyms, antonyms] = await Promise.all([
    fetchDatamuseRelation(normalizedWord, 'syn'),
    fetchDatamuseRelation(normalizedWord, 'ant'),
  ]);

  return {
    synonyms,
    antonyms,
  };
}

export async function fetchBilingualMeaning(
  word: string,
  sourceLang: string,
  targetLang: string
): Promise<ApiBilingualMeaningResult> {
  const normalizedWord = normalizeWord(word);
  const params = new URLSearchParams({
    word: normalizedWord,
    lang: sourceLang,
    def_lang: targetLang,
  });
  const response = await fetch(`${MINH_QND_DICTIONARY_API_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`No bilingual dictionary entry found for "${normalizedWord}".`);
  }

  const payload = (await response.json()) as MinhQndLookupResponse;
  const sourceResult = payload.results?.find((result) => result.lang_code === sourceLang) ?? payload.results?.[0];

  if (!payload.exists || !sourceResult) {
    throw new Error(`No bilingual dictionary entry found for "${normalizedWord}".`);
  }

  const targetMeanings = (sourceResult.meanings ?? [])
    .filter((meaning) => !meaning.definition_lang || meaning.definition_lang === targetLang)
    .map((meaning) => ({
      partOfSpeech: meaning.pos ?? 'word',
      meaning: meaning.definition ?? '',
      examples: meaning.example ? [meaning.example] : [],
      synonyms: [],
      antonyms: [],
      domain: meaning.sub_pos ?? meaning.source ?? sourceResult.lang_name ?? 'Bilingual dictionary',
    }))
    .filter((definition) => definition.meaning);
  const translations = uniqueWords(
    (sourceResult.translations ?? [])
      .filter((translation) => !translation.lang_code || translation.lang_code === targetLang)
      .map((translation) => translation.translation)
      .filter(Boolean) as string[]
  );
  const translationDefinitions = translations.map((translation) => ({
    partOfSpeech: 'translation',
    meaning: translation,
    examples: [],
    synonyms: [],
    antonyms: [],
    domain: sourceResult.lang_name ?? 'Bilingual dictionary',
  }));
  const definitions = targetMeanings.length ? targetMeanings : translationDefinitions;

  if (!definitions.length) {
    throw new Error(`No ${targetLang} meanings found for "${normalizedWord}".`);
  }

  return {
    word: payload.word ?? normalizedWord,
    ipa: sourceResult.pronunciations?.[0]?.ipa ?? '',
    audio: sourceResult.audio ? normalizeMinhQndAudioUrl(sourceResult.audio) : '',
    definitions,
    translations,
    source: 'dict.minhqnd.com',
  };
}

function normalizeWord(word: string) {
  return word.trim().toLowerCase();
}

function pickPreferredPhonetic(phonetics: DictionaryApiPhonetic[]) {
  const phoneticsWithAudio = phonetics.filter((item) => item.audio);

  return phoneticsWithAudio
    .map((item) => ({
      item,
      score: getAudioPreferenceScore(item.audio ?? ''),
    }))
    .sort((a, b) => b.score - a.score)[0]?.item;
}

function getAudioPreferenceScore(audioUrl: string) {
  const audio = audioUrl.toLowerCase();
  const isGoogleDictionary = audio.includes('ssl.gstatic.com/dictionary/static/sounds');
  const isUsAudio = audio.includes('_us_') || audio.includes('-us.') || audio.includes('/us/');
  const isUkAudio = audio.includes('_gb_') || audio.includes('-uk.') || audio.includes('/uk/');

  if (isGoogleDictionary && isUsAudio) return 100;
  if (isGoogleDictionary) return 80;
  if (isUsAudio) return 70;
  if (isUkAudio) return 50;

  return 10;
}

function normalizeAudioUrl(audioUrl: string) {
  if (audioUrl.startsWith('//')) return `https:${audioUrl}`;

  return audioUrl;
}

function normalizeMinhQndAudioUrl(audioUrl: string) {
  if (audioUrl.startsWith('http')) return audioUrl;

  return `https://dict.minhqnd.com${audioUrl}`;
}

async function fetchDatamuseRelation(word: string, relation: 'syn' | 'ant') {
  const params = new URLSearchParams({
    [`rel_${relation}`]: word,
    max: '24',
  });
  const response = await fetch(`${DATAMUSE_API_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Could not fetch ${relation} words for "${word}".`);
  }

  const payload = (await response.json()) as DatamuseWord[];

  return uniqueWords(payload.map((item) => item.word).filter(Boolean) as string[]);
}

function uniqueWords(words: string[]) {
  return Array.from(new Set(words.map((word) => word.trim()).filter(Boolean))).slice(0, 24);
}
