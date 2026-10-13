// Declarative registry of dictionary sources that are bundled with the app (Wiktionary-derived
// local packs and a few local fixtures). Each language is one config row: how input is normalized,
// whether inflected forms are tried via morphology, and the attribution shown with results.
import type { ApiMeaningResult, ApiRelatedWords } from './dictionaryApi';
import { findLocalDictionaryEntry, normalizeEstonianWord, normalizeHindiWord, normalizeUzbekWord } from './localLexicon';
import { getMorphologyCandidates } from './morphology';

export const DEFAULT_DEFINITION_DOMAIN = 'Nghĩa chung';
const CC_BY_SA = 'CC BY-SA 4.0';

export type LocalPackSource = {
  languageCode: string;
  // English name used in "not found" errors.
  languageName: string;
  // Attribution stored on every definition and on the result.
  source: string;
  // Wording in the not-found error: Wiktionary packs vs hand-made fixtures.
  kind: 'wiktionary' | 'local-fixture';
  normalize: (word: string) => string;
  // Words that cannot belong to the language (e.g. wrong script) fail before any lookup.
  accepts?: (normalizedWord: string) => boolean;
  // Related words follow inflected input back to its base form for these languages.
  relatedWordsUseMorphology: boolean;
  // Fixtures label the result as the requested word only when the stored headword matches exactly.
  exactFormComparesHeadword?: boolean;
};

const nfc = (word: string) => word.trim().normalize('NFC');

function wiktionary(
  languageCode: string,
  languageName: string,
  options: Partial<Pick<LocalPackSource, 'accepts' | 'normalize' | 'relatedWordsUseMorphology'>> & { licensed?: boolean } = {}
): LocalPackSource {
  const edition = `${languageCode}wiktionary`;
  return {
    accepts: options.accepts,
    kind: 'wiktionary',
    languageCode,
    languageName,
    normalize: options.normalize ?? nfc,
    relatedWordsUseMorphology: options.relatedWordsUseMorphology ?? true,
    source: options.licensed ? `${edition} · ${CC_BY_SA}` : edition,
  };
}

function localFixture(languageCode: string, languageName: string): LocalPackSource {
  return {
    exactFormComparesHeadword: true,
    kind: 'local-fixture',
    languageCode,
    languageName,
    normalize: nfc,
    relatedWordsUseMorphology: false,
    source: `${languageCode}-local-fixture`,
  };
}

const LOCAL_PACK_SOURCE_LIST: LocalPackSource[] = [
  wiktionary('fi', 'Finnish', { normalize: (word) => word.trim().toLocaleLowerCase(), relatedWordsUseMorphology: false }),
  wiktionary('et', 'Estonian', { normalize: normalizeEstonianWord }),
  wiktionary('hi', 'Hindi', {
    accepts: (word) => Boolean(word) && /[ऀ-ॿ]/.test(word),
    licensed: true,
    normalize: normalizeHindiWord,
  }),
  wiktionary('tr', 'Turkish', {
    normalize: (word) => nfc(word).replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr-TR'),
    relatedWordsUseMorphology: false,
  }),
  wiktionary('uz', 'Uzbek', { licensed: true, normalize: normalizeUzbekWord }),
  wiktionary('kk', 'Kazakh', { licensed: true, normalize: (word) => nfc(word).toLocaleLowerCase('kk-KZ') }),
  wiktionary('ja', 'Japanese'),
  wiktionary('ko', 'Korean'),
  wiktionary('sw', 'Swahili', { normalize: (word) => word.trim().toLowerCase(), relatedWordsUseMorphology: false }),
  wiktionary('hu', 'Hungarian', { relatedWordsUseMorphology: false }),
  wiktionary('ar', 'Arabic'),
  wiktionary('he', 'Hebrew'),
  wiktionary('tl', 'Tagalog', { relatedWordsUseMorphology: false }),
  wiktionary('am', 'Amharic', { relatedWordsUseMorphology: false }),
  wiktionary('ru', 'Russian', {
    // Strips stress marks (U+0301 combining acute accent) that learners copy from textbooks.
    normalize: (word) => word.trim().normalize('NFD').replace(/́/g, '').normalize('NFC').toLocaleLowerCase('ru-RU'),
  }),
  wiktionary('zh', 'Mandarin'),
  wiktionary('jv', 'Javanese', { relatedWordsUseMorphology: false }),
  wiktionary('so', 'Somali', { relatedWordsUseMorphology: false }),
  wiktionary('my', 'Burmese', { relatedWordsUseMorphology: false }),
  wiktionary('bo', 'Tibetan', { relatedWordsUseMorphology: false }),
  wiktionary('yo', 'Yoruba', { relatedWordsUseMorphology: false }),
  wiktionary('zu', 'Zulu', { relatedWordsUseMorphology: false }),
  localFixture('ig', 'Igbo'),
  localFixture('haw', 'Hawaiian'),
  wiktionary('ta', 'Tamil'),
  wiktionary('te', 'Telugu'),
  wiktionary('kn', 'Kannada'),
  wiktionary('ml', 'Malayalam', { relatedWordsUseMorphology: false }),
];

export const LOCAL_PACK_SOURCES: Readonly<Record<string, LocalPackSource>> = Object.fromEntries(
  LOCAL_PACK_SOURCE_LIST.map((source) => [source.languageCode, source])
);

export function getLocalPackSource(languageCode: string): LocalPackSource | undefined {
  return LOCAL_PACK_SOURCES[languageCode];
}

const MAX_LOOKUP_CANDIDATES = 24;

function getLookupCandidates(languageCode: string, normalizedWord: string) {
  const words = [
    normalizedWord,
    ...getMorphologyCandidates(languageCode, normalizedWord).map((candidate) => candidate.word),
  ];
  return Array.from(new Set(words.map((word) => word.trim()).filter(Boolean))).slice(0, MAX_LOOKUP_CANDIDATES);
}

function notFound(source: LocalPackSource, normalizedWord: string) {
  const sourceName = source.kind === 'wiktionary' ? 'Wiktionary' : 'local fixture';
  return new Error(`No ${source.languageName} ${sourceName} meanings found for "${normalizedWord}".`);
}

export async function lookupLocalPackMeaning(languageCode: string, word: string): Promise<ApiMeaningResult> {
  const source = LOCAL_PACK_SOURCES[languageCode];
  if (!source) throw new Error(`No local dictionary pack for "${languageCode}".`);

  const normalizedWord = source.normalize(word);
  if (source.accepts && !source.accepts(normalizedWord)) throw notFound(source, normalizedWord);

  for (const lookupWord of getLookupCandidates(languageCode, normalizedWord)) {
    let localEntry: ReturnType<typeof findLocalDictionaryEntry>;
    try {
      localEntry = findLocalDictionaryEntry(languageCode, lookupWord);
    } catch {
      // A malformed candidate must not hide a later valid base form.
      continue;
    }
    if (!localEntry) continue;

    const isRequestedForm = lookupWord === (source.exactFormComparesHeadword ? localEntry.word : normalizedWord);
    return {
      word: localEntry.word,
      ipa: localEntry.ipa || '',
      audio: localEntry.audio || '',
      definitions: localEntry.definitions.map((def) => ({
        partOfSpeech: def.partOfSpeech,
        meaning: def.meaning,
        examples: def.examples,
        synonyms: localEntry.synonyms || [],
        antonyms: localEntry.antonyms || [],
        domain: def.domain || DEFAULT_DEFINITION_DOMAIN,
        level: def.level || localEntry.level,
        vietnamese: def.vietnamese,
        source: source.source,
      })),
      source: isRequestedForm ? source.source : `${source.source} · base form of ${normalizedWord}`,
    };
  }

  throw notFound(source, normalizedWord);
}

export async function lookupLocalPackRelatedWords(languageCode: string, word: string): Promise<ApiRelatedWords> {
  const source = LOCAL_PACK_SOURCES[languageCode];
  if (!source) return { synonyms: [], antonyms: [] };

  const normalizedWord = source.normalize(word);
  const candidates = source.relatedWordsUseMorphology ? getLookupCandidates(languageCode, normalizedWord) : [normalizedWord];
  for (const lookupWord of candidates) {
    const localEntry = findLocalDictionaryEntry(languageCode, lookupWord);
    if (localEntry) {
      return {
        synonyms: localEntry.synonyms || [],
        antonyms: localEntry.antonyms || [],
      };
    }
  }

  return { synonyms: [], antonyms: [] };
}
