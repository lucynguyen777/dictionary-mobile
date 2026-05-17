import { BilingualExample } from './dictionary';
import { getMorphologyCandidates } from './morphology';

export type ApiDefinition = {
  partOfSpeech: string;
  meaning: string;
  examples: BilingualExample[];
  synonyms: string[];
  antonyms: string[];
  domain?: string;
  gender?: string;
  level?: string;
  source?: string;
};

const DEFAULT_DEFINITION_DOMAIN = 'Nghĩa chung';

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

type MinhQndRelation = {
  related_word?: string;
  relation_type?: string;
};

type MinhQndLanguageResult = {
  lang_code?: string;
  lang_name?: string;
  audio?: string;
  meanings?: MinhQndMeaning[];
  pronunciations?: MinhQndPronunciation[];
  translations?: MinhQndTranslation[];
  relations?: MinhQndRelation[];
};

type MinhQndLookupResponse = {
  exists?: boolean;
  word?: string;
  results?: MinhQndLanguageResult[];
};

type MinhQndSuggestResponse = {
  suggestions?: string[];
  results?: string[];
};

type WiktApiSense = {
  glosses?: string[];
  examples?: (string | { text?: string; english?: string; translation?: string })[];
  tags?: string[];
  topics?: string[];
};

type WiktApiSound = {
  ipa?: string;
  audio?: string;
  mp3_url?: string;
  ogg_url?: string;
};

type WiktApiLinkage = string | { word?: string };

type WiktApiEntry = {
  word?: string;
  lang?: string;
  lang_code?: string;
  pos?: string;
  tags?: string[];
  raw_tags?: string[];
  senses?: WiktApiSense[];
  sounds?: WiktApiSound[];
  synonyms?: WiktApiLinkage[];
  antonyms?: WiktApiLinkage[];
  derived?: WiktApiLinkage[];
};

type WiktApiWordResponse = {
  word?: string;
  edition?: string;
  entries?: WiktApiEntry[];
};

const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const DATAMUSE_API_BASE = 'https://api.datamuse.com/words';
const MINH_QND_DICTIONARY_API_BASE = 'https://dict.minhqnd.com/api/v1/lookup';
const MINH_QND_SUGGEST_API_BASE = 'https://dict.minhqnd.com/api/v1/suggest';
const WIKTAPI_BASE = 'https://api.wiktapi.dev/v1';

export function canUseMonolingualDictionaryApi(languageCode: string) {
  return ['en', 'vi', 'fr', 'es', 'ms'].includes(languageCode);
}

export function canUseBilingualDictionaryApi(sourceLang: string, targetLang: string) {
  return ['en->vi', 'vi->en', 'fr->vi'].includes(`${sourceLang}->${targetLang}`);
}

export function isBlockedBilingualDictionaryPair(sourceLang: string, targetLang: string) {
  return sourceLang === 'vi' && targetLang === 'fr';
}

export async function fetchMonolingualMeaning(word: string, languageCode: string): Promise<ApiMeaningResult> {
  if (languageCode === 'en') return fetchEnglishMeaning(word);
  if (languageCode === 'vi') return fetchMinhQndMonolingualMeaning(word, 'vi');
  if (languageCode === 'fr') return fetchWiktApiMonolingualMeaning(word, 'fr');
  if (languageCode === 'es') return fetchWiktApiMonolingualMeaning(word, 'es');
  if (languageCode === 'ms') return fetchWiktApiMonolingualMeaning(word, 'ms');

  throw new Error(`No monolingual dictionary source selected for "${languageCode}".`);
}

export async function fetchRelatedWords(word: string, languageCode: string): Promise<ApiRelatedWords> {
  if (languageCode === 'en') return fetchEnglishRelatedWords(word);
  if (languageCode === 'vi') return fetchMinhQndRelatedWords(word, 'vi');
  if (languageCode === 'fr') return fetchWiktApiRelatedWords(word, 'fr');
  if (languageCode === 'es') return fetchWiktApiRelatedWords(word, 'es');
  if (languageCode === 'ms') return fetchWiktApiRelatedWords(word, 'ms');

  return { synonyms: [], antonyms: [] };
}

export async function fetchEnglishMeaning(word: string): Promise<ApiMeaningResult> {
  const normalizedWord = normalizeWord(word);
  const lookupCandidates = uniqueWords([
    normalizedWord,
    ...getMorphologyCandidates('en', normalizedWord).map((candidate) => candidate.word),
  ]);
  const errors: unknown[] = [];

  for (const lookupWord of lookupCandidates) {
    try {
      return await fetchEnglishMeaningCandidate(lookupWord, normalizedWord);
    } catch (error) {
      errors.push(error);
    }
  }

  const firstError = errors[0];
  if (firstError instanceof Error) throw firstError;

  throw new Error(`No dictionary entry found for "${normalizedWord}".`);
}

async function fetchEnglishMeaningCandidate(lookupWord: string, requestedWord: string): Promise<ApiMeaningResult> {
  const response = await fetch(`${DICTIONARY_API_BASE}/${encodeURIComponent(lookupWord)}`);

  if (!response.ok) {
    throw new Error(`No dictionary entry found for "${requestedWord}".`);
  }

  const payload = (await response.json()) as DictionaryApiEntry[];
  const entry = payload[0];

  if (!entry?.meanings?.length) {
    throw new Error(`No meanings found for "${requestedWord}".`);
  }

  const preferredPhonetic = pickPreferredPhonetic(entry.phonetics ?? []);
  const phonetic = preferredPhonetic?.text ?? entry.phonetics?.find((item) => item.text)?.text ?? entry.phonetic ?? '';
  const audio = normalizeAudioUrl(preferredPhonetic?.audio ?? '');

  return {
    word: entry.word ?? lookupWord,
    ipa: phonetic,
    audio: audio.startsWith('//') ? `https:${audio}` : audio,
    definitions: entry.meanings.flatMap((meaning) =>
      (meaning.definitions ?? []).slice(0, 4).map((definition) => ({
        partOfSpeech: meaning.partOfSpeech ?? 'word',
        meaning: definition.definition ?? '',
        examples: definition.example ? [{ source: definition.example }] : [],
        synonyms: uniqueWords([...(meaning.synonyms ?? []), ...(definition.synonyms ?? [])]),
        antonyms: uniqueWords([...(meaning.antonyms ?? []), ...(definition.antonyms ?? [])]),
        domain: DEFAULT_DEFINITION_DOMAIN,
      }))
    ).filter((definition) => definition.meaning),
    source: lookupWord === requestedWord ? 'dictionaryapi.dev' : `dictionaryapi.dev · base form of ${requestedWord}`,
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
  if (isBlockedBilingualDictionaryPair(sourceLang, targetLang)) {
    throw new Error('Vietnamese → French dictionary source has not been selected yet.');
  }

  if (!canUseBilingualDictionaryApi(sourceLang, targetLang)) {
    throw new Error(`No bilingual dictionary source selected for "${sourceLang}->${targetLang}".`);
  }

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
    .map((meaning) => {
      const parsedDefinition = parseContextualDefinition(meaning.definition ?? '');
      const inferredDomain = inferDefinitionDomain(normalizedWord, parsedDefinition.definition, targetLang);

      return {
        partOfSpeech: meaning.pos ?? 'word',
        meaning: parsedDefinition.definition,
        examples: meaning.example ? splitMeaningExamples(meaning.example) : [],
        synonyms: [],
        antonyms: [],
        domain: normalizeDefinitionDomain(parsedDefinition.context || meaning.sub_pos || inferredDomain),
        source: meaning.source ?? sourceResult.lang_name,
      };
    })
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
    source: sourceResult.lang_name,
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

export async function fetchMinhQndMonolingualMeaning(word: string, languageCode: string): Promise<ApiMeaningResult> {
  const normalizedWord = normalizeWord(word);
  const result = await fetchMinhQndLookup(normalizedWord, languageCode, languageCode);
  const sourceResult = getMinhQndSourceResult(result, languageCode);

  if (!sourceResult) {
    throw new Error(`No ${languageCode} dictionary entry found for "${normalizedWord}".`);
  }

  const definitions = mapMinhQndDefinitions(normalizedWord, sourceResult, languageCode);
  if (!definitions.length) {
    throw new Error(`No ${languageCode} meanings found for "${normalizedWord}".`);
  }

  const relatedWords = mapMinhQndRelations(sourceResult.relations ?? []);

  return {
    word: result.word ?? normalizedWord,
    ipa: sourceResult.pronunciations?.[0]?.ipa ?? '',
    audio: sourceResult.audio ? normalizeMinhQndAudioUrl(sourceResult.audio) : '',
    definitions: definitions.map((definition) => ({
      ...definition,
      synonyms: relatedWords.synonyms,
      antonyms: relatedWords.antonyms,
    })),
    source: 'dict.minhqnd.com',
  };
}

export async function fetchMinhQndRelatedWords(word: string, languageCode: string): Promise<ApiRelatedWords> {
  const normalizedWord = normalizeWord(word);
  const result = await fetchMinhQndLookup(normalizedWord, languageCode, languageCode);
  const sourceResult = getMinhQndSourceResult(result, languageCode);

  return mapMinhQndRelations(sourceResult?.relations ?? []);
}

export async function fetchWiktApiMonolingualMeaning(word: string, languageCode: string): Promise<ApiMeaningResult> {
  const normalizedWord = normalizeWord(word);
  const result = await fetchWiktApiWord(normalizedWord, languageCode);
  const entries = getWiktApiEntries(result, languageCode);
  const definitions = entries.flatMap((entry) => mapWiktApiDefinitions(entry, languageCode));

  if (!definitions.length) {
    throw new Error(`No ${languageCode} Wiktionary meanings found for "${normalizedWord}".`);
  }

  const sounds = entries.flatMap((entry) => entry.sounds ?? []);
  const preferredSound = sounds.find((sound) => sound.ipa || sound.mp3_url || sound.audio || sound.ogg_url);

  return {
    word: result.word ?? entries[0]?.word ?? normalizedWord,
    ipa: preferredSound?.ipa ?? '',
    audio: normalizeAudioUrl(preferredSound?.mp3_url ?? preferredSound?.audio ?? preferredSound?.ogg_url ?? ''),
    definitions,
    source: 'wiktapi.dev',
  };
}

export async function fetchWiktApiRelatedWords(word: string, languageCode: string): Promise<ApiRelatedWords> {
  const normalizedWord = normalizeWord(word);
  const result = await fetchWiktApiWord(normalizedWord, languageCode);
  const entries = getWiktApiEntries(result, languageCode);

  return {
    synonyms: uniqueWords(entries.flatMap((entry) => mapWiktApiLinkages(entry.synonyms ?? []))),
    antonyms: uniqueWords(entries.flatMap((entry) => mapWiktApiLinkages(entry.antonyms ?? []))),
  };
}

export async function fetchVietnameseSuggestions(query: string): Promise<string[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const params = new URLSearchParams({ q: normalizedQuery });
  const response = await fetch(`${MINH_QND_SUGGEST_API_BASE}?${params.toString()}`);

  if (!response.ok) return [];

  const payload = (await response.json()) as MinhQndSuggestResponse | string[];
  if (Array.isArray(payload)) return uniqueWords(payload);

  return uniqueWords([...(payload.suggestions ?? []), ...(payload.results ?? [])]);
}

async function fetchMinhQndLookup(
  word: string,
  sourceLang: string,
  targetLang: string
): Promise<MinhQndLookupResponse> {
  const params = new URLSearchParams({
    word,
    lang: sourceLang,
    def_lang: targetLang,
  });
  const response = await fetch(`${MINH_QND_DICTIONARY_API_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`No dictionary entry found for "${word}".`);
  }

  const payload = (await response.json()) as MinhQndLookupResponse;
  if (!payload.exists) {
    throw new Error(`No dictionary entry found for "${word}".`);
  }

  return payload;
}

function getMinhQndSourceResult(payload: MinhQndLookupResponse, sourceLang: string) {
  return payload.results?.find((result) => result.lang_code === sourceLang) ?? payload.results?.[0];
}

function mapMinhQndDefinitions(
  word: string,
  sourceResult: MinhQndLanguageResult,
  targetLang: string
): ApiDefinition[] {
  return (sourceResult.meanings ?? [])
    .filter((meaning) => !meaning.definition_lang || meaning.definition_lang === targetLang)
    .map((meaning) => {
      const parsedDefinition = parseContextualDefinition(meaning.definition ?? '');
      const inferredDomain = inferDefinitionDomain(word, parsedDefinition.definition, targetLang);

      return {
        partOfSpeech: meaning.pos ?? 'word',
        meaning: parsedDefinition.definition,
        examples: meaning.example ? splitMeaningExamples(meaning.example) : [],
        synonyms: [],
        antonyms: [],
        domain: normalizeDefinitionDomain(parsedDefinition.context || meaning.sub_pos || inferredDomain),
        source: meaning.source ?? sourceResult.lang_name,
      };
    })
    .filter((definition) => definition.meaning);
}

function mapMinhQndRelations(relations: MinhQndRelation[]): ApiRelatedWords {
  const synonyms: string[] = [];
  const antonyms: string[] = [];

  relations.forEach((relation) => {
    const word = relation.related_word?.trim();
    if (!word) return;

    const relationType = relation.relation_type?.toLocaleLowerCase() ?? '';
    if (relationType.includes('trái') || relationType.includes('antonym')) {
      antonyms.push(word);
      return;
    }

    if (relationType.includes('đồng') || relationType.includes('synonym')) {
      synonyms.push(word);
    }
  });

  return {
    synonyms: uniqueWords(synonyms),
    antonyms: uniqueWords(antonyms),
  };
}

async function fetchWiktApiWord(word: string, languageCode: string): Promise<WiktApiWordResponse> {
  const params = new URLSearchParams({ lang: languageCode });
  const response = await fetch(`${WIKTAPI_BASE}/${languageCode}/word/${encodeURIComponent(word)}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`No ${languageCode} Wiktionary entry found for "${word}".`);
  }

  return (await response.json()) as WiktApiWordResponse;
}

function getWiktApiEntries(payload: WiktApiWordResponse, languageCode: string) {
  return (payload.entries ?? []).filter((entry) => !entry.lang_code || entry.lang_code === languageCode);
}

function mapWiktApiDefinitions(entry: WiktApiEntry, languageCode: string): ApiDefinition[] {
  return (entry.senses ?? [])
    .slice(0, 12)
    .flatMap((sense) =>
      (sense.glosses ?? []).map((gloss) => ({
        partOfSpeech: entry.pos ?? 'word',
        meaning: gloss,
        examples: mapWiktApiExamples(sense.examples ?? []).slice(0, 2),
        synonyms: uniqueWords(mapWiktApiLinkages(entry.synonyms ?? [])),
        antonyms: uniqueWords(mapWiktApiLinkages(entry.antonyms ?? [])),
        domain: normalizeDefinitionDomain(sense.topics?.[0]),
        gender: getWiktApiGender([...(entry.tags ?? []), ...(entry.raw_tags ?? []), ...(sense.tags ?? [])], languageCode),
        level: undefined,
        source: 'Wiktionary',
      }))
    )
    .filter((definition) => definition.meaning);
}

function mapWiktApiExamples(examples: NonNullable<WiktApiSense['examples']>): BilingualExample[] {
  return examples
    .map((example) => {
      if (typeof example === 'string') return { source: example };

      return {
        source: example.text ?? '',
        translation: example.translation ?? example.english,
      };
    })
    .filter((example) => example.source);
}

function mapWiktApiLinkages(linkages: WiktApiLinkage[]) {
  return linkages
    .map((linkage) => (typeof linkage === 'string' ? linkage : linkage.word))
    .filter(Boolean) as string[];
}

function getWiktApiGender(tags: string[], languageCode: string) {
  const normalizedTags = tags.map((tag) => tag.toLocaleLowerCase());
  const isMasculine = normalizedTags.some((tag) => tag.includes('masculine'));
  const isFeminine = normalizedTags.some((tag) => tag.includes('feminine'));

  if (!isMasculine && !isFeminine) return undefined;

  if (languageCode === 'es') {
    if (isMasculine) return 'masculino';
    if (isFeminine) return 'femenino';
  }

  // Default: French labels (also used as fallback)
  if (isMasculine) return 'masculin';
  if (isFeminine) return 'féminin';

  return undefined;
}

function normalizeWord(word: string) {
  return word.trim().toLowerCase();
}

function parseContextualDefinition(definition: string) {
  const normalizedDefinition = definition.trim();
  const leadingContextMatch = normalizedDefinition.match(/^(\(([^)]+)\)\s*)+(.+)$/);
  if (leadingContextMatch) {
    const contexts = Array.from(normalizedDefinition.matchAll(/\(([^)]+)\)/g)).map((match) => match[1].trim());

    return {
      context: contexts.join(' · '),
      definition: leadingContextMatch[3].trim(),
    };
  }

  const trailingContextMatch = normalizedDefinition.match(/^(.+?)\s*\[([^\]]+)\]$/);
  if (trailingContextMatch) {
    return {
      context: trailingContextMatch[2].trim(),
      definition: trailingContextMatch[1].trim(),
    };
  }

  return {
    context: '',
    definition: normalizedDefinition,
  };
}

function normalizeDefinitionDomain(domain: string | undefined) {
  const normalizedDomain = domain?.trim();

  return normalizedDomain || DEFAULT_DEFINITION_DOMAIN;
}

function splitMeaningExamples(example: string): BilingualExample[] {
  return example
    .split(/\s*~\s*/)
    .map((item) => {
      // Often, bilingual examples are separated by "=" or "-"
      const parts = item.split(/\s*(?:=|-)\s*/);
      const source = parts[0]?.trim();
      const translation = parts[1]?.trim();
      return { source, translation };
    })
    .filter((item) => item.source);
}

function inferDefinitionDomain(word: string, definition: string, targetLang: string) {
  if (targetLang !== 'vi') return '';

  const normalizedWord = word.toLowerCase();
  const normalizedDefinition = definition.toLowerCase();
  const domainRules = vietnameseDomainRules[normalizedWord] ?? [];
  const matchedRule = domainRules.find((rule) =>
    rule.terms.some((term) => normalizedDefinition.includes(term.toLowerCase()))
  );

  return matchedRule?.domain ?? '';
}

const vietnameseDomainRules: Record<string, { domain: string; terms: string[] }[]> = {
  bank: [
    { domain: 'tài chính', terms: ['ngân hàng', 'nhà băng', 'tín dụng', 'tiền gửi', 'cho vay'] },
    { domain: 'địa lý', terms: ['bờ sông', 'bờ suối', 'bờ hồ', 'bãi bồi'] },
    { domain: 'hàng không', terms: ['nghiêng cánh', 'lượn nghiêng'] },
    { domain: 'trò chơi', terms: ['nhà cái', 'tiền cược'] },
    { domain: 'lưu trữ', terms: ['kho', 'ngân hàng dữ liệu', 'dữ liệu'] },
  ],
  charge: [
    { domain: 'tài chính', terms: ['phí', 'giá tiền', 'tính tiền', 'thu tiền'] },
    { domain: 'pháp lý', terms: ['buộc tội', 'cáo buộc', 'tội danh'] },
    { domain: 'điện học', terms: ['điện tích', 'sạc', 'nạp điện'] },
    { domain: 'quân sự', terms: ['xung phong', 'tấn công'] },
    { domain: 'trách nhiệm', terms: ['phụ trách', 'trách nhiệm', 'giao phó'] },
  ],
  cell: [
    { domain: 'nhà tù', terms: ['phòng nhỏ', 'xà lim'] },
    { domain: 'hình học', terms: ['lỗ tổ ong', 'ô'] },
    { domain: 'điện học', terms: ['pin'] },
    { domain: 'sinh vật học', terms: ['tế bào'] },
    { domain: 'chính trị', terms: ['chi bộ'] },
    { domain: 'kiến trúc', terms: ['am', 'túp lều', 'căn nhà'] },
    { domain: 'nghĩa cổ', terms: ['nấm mồ'] },
  ],
  run: [
    { domain: 'di chuyển', terms: ['chạy', 'chạy bộ', 'di chuyển nhanh'] },
    { domain: 'quản lý', terms: ['điều hành', 'quản lý', 'vận hành'] },
    { domain: 'máy móc', terms: ['hoạt động', 'chạy máy', 'vận hành'] },
    { domain: 'chất lỏng', terms: ['chảy', 'rỉ', 'tuôn'] },
    { domain: 'bầu cử', terms: ['tranh cử', 'ứng cử'] },
    { domain: 'xuất bản', terms: ['đăng', 'phát hành', 'chiếu'] },
  ],
  set: [
    { domain: 'sắp đặt', terms: ['đặt', 'sắp đặt', 'bố trí'] },
    { domain: 'thiết lập', terms: ['thiết lập', 'cài đặt', 'định'] },
    { domain: 'toán học', terms: ['tập hợp'] },
    { domain: 'thể thao', terms: ['hiệp', 'ván', 'set'] },
    { domain: 'giải trí', terms: ['bối cảnh', 'phim trường', 'sân khấu'] },
    { domain: 'trạng thái', terms: ['đông lại', 'cứng lại', 'cố định'] },
  ],
};

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
