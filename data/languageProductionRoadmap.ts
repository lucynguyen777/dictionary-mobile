export type LanguageProductionRoadmapState = 'production-maintenance' | 'preview-promotion' | 'source-gated';

export type LanguageProductionRoadmapTarget = {
  batch: number;
  code: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'very-hard';
  sourcePlan: string;
  specialWork: string;
  state: LanguageProductionRoadmapState;
};

export const LANGUAGE_PRODUCTION_SHARED_GATES = [
  'approved-source-license-and-revision',
  'representative-100-headword-measurement',
  'attributed-corpus-minimum-5000',
  'exact-lookup-minimum-95-percent',
  'morphology-minimum-85-percent-when-applicable',
  'examples-minimum-40-percent',
  'related-words-minimum-30-percent',
  'offline-pack-import-delete-lookup-smoke',
  'word-reader-library-ui-smoke',
] as const;

export const languageProductionRoadmap: LanguageProductionRoadmapTarget[] = [
  { batch: 0, code: 'en', difficulty: 'easy', sourcePlan: 'Maintain approved production API and grow attributed offline coverage.', specialWork: 'Regression, examples, relations, and offline-pack growth.', state: 'production-maintenance' },
  { batch: 0, code: 'vi', difficulty: 'easy', sourcePlan: 'Maintain approved Vietnamese lexical API and grow attributed offline coverage.', specialWork: 'Tone-sensitive lookup, examples, relations, and offline-pack growth.', state: 'production-maintenance' },
  { batch: 0, code: 'en->vi', difficulty: 'easy', sourcePlan: 'Maintain approved bilingual lexical source.', specialWork: 'Coverage measurement and offline packaging.', state: 'production-maintenance' },
  { batch: 0, code: 'vi->en', difficulty: 'easy', sourcePlan: 'Maintain approved bilingual lexical source.', specialWork: 'Coverage measurement and offline packaging.', state: 'production-maintenance' },
  { batch: 0, code: 'fr->vi', difficulty: 'easy', sourcePlan: 'Maintain approved MinhQnd lexical source.', specialWork: 'Measure broader headword coverage and define offline packaging.', state: 'production-maintenance' },

  { batch: 1, code: 'fr', difficulty: 'easy', sourcePlan: 'French Wiktionary/Wiktextract corpus with revision metadata.', specialWork: 'Fix measured exact coverage and related-word gap before pack smoke.', state: 'preview-promotion' },
  { batch: 1, code: 'ms', difficulty: 'easy', sourcePlan: 'Malay Wiktionary/Wiktextract corpus.', specialWork: 'Validate meN-/peN- allomorphs, reduplication, and affixed forms.', state: 'preview-promotion' },
  { batch: 1, code: 'es', difficulty: 'easy', sourcePlan: 'Spanish Wiktionary/Wiktextract corpus.', specialWork: 'Accent handling, adjective forms, and irregular verbs.', state: 'preview-promotion' },

  { batch: 2, code: 'haw', difficulty: 'medium', sourcePlan: 'Obtain an approved Hawaiian-definition source; English-Wiktionary-derived Kaikki headword data is ineligible.', specialWork: 'Preserve okina variants and kahako-aware lookup after the definition-language source gate passes.', state: 'preview-promotion' },
  { batch: 2, code: 'so', difficulty: 'medium', sourcePlan: 'Obtain an approved Somali-definition corpus; English-Wiktionary-derived Kaikki data is ineligible.', specialWork: 'Definite-article variants, plurals, and vowel/consonant length after the source gate passes.', state: 'preview-promotion' },
  { batch: 2, code: 'jv', difficulty: 'medium', sourcePlan: 'Extract and measure native definitions from jv.wiktionary.org; English-Wiktionary-derived Kaikki data is ineligible.', specialWork: 'Register labels, fixture-backed Aksara Jawa aliases, Latin/Javanese-script policy, and affix fallbacks.', state: 'preview-promotion' },
  { batch: 2, code: 'tl', difficulty: 'medium', sourcePlan: 'Approved Tagalog Wiktionary-derived corpus.', specialWork: 'Focus/voice affixes, infixation, and reduplication.', state: 'preview-promotion' },
  { batch: 2, code: 'sw', difficulty: 'medium', sourcePlan: 'Approved Swahili Wiktionary-derived corpus.', specialWork: 'Noun classes and verb prefix chains.', state: 'preview-promotion' },
  { batch: 2, code: 'yo', difficulty: 'medium', sourcePlan: 'Approved Yoruba Wiktionary-derived corpus.', specialWork: 'Tone-insensitive search while preserving display diacritics.', state: 'preview-promotion' },
  { batch: 2, code: 'ig', difficulty: 'medium', sourcePlan: 'Approved Igbo Wiktionary-derived corpus.', specialWork: 'Tone-insensitive, underdot-preserving lookup.', state: 'preview-promotion' },
  { batch: 2, code: 'zu', difficulty: 'medium', sourcePlan: 'Approved Zulu Wiktionary-derived corpus.', specialWork: 'Noun class prefixes and locative fallbacks.', state: 'preview-promotion' },

  { batch: 3, code: 'fi', difficulty: 'hard', sourcePlan: 'Finnish Wiktionary/approved open corpus.', specialWork: 'Case-rich morphology, consonant gradation, and vowel harmony.', state: 'preview-promotion' },
  { batch: 3, code: 'et', difficulty: 'hard', sourcePlan: 'Estonian Wiktionary first; evaluate Ekilex/Sonaveeb terms separately.', specialWork: 'Case-rich morphology and diacritic preservation.', state: 'preview-promotion' },
  { batch: 3, code: 'hu', difficulty: 'hard', sourcePlan: 'Hungarian Wiktionary/approved open corpus.', specialWork: 'Case chains, vowel harmony, and length-sensitive lookup.', state: 'preview-promotion' },
  { batch: 3, code: 'tr', difficulty: 'hard', sourcePlan: 'Turkish Wiktionary/approved open corpus.', specialWork: 'Dotted/dotless I, suffix chains, and vowel harmony.', state: 'preview-promotion' },
  { batch: 3, code: 'uz', difficulty: 'hard', sourcePlan: 'Uzbek Wiktionary-derived corpus.', specialWork: 'Apostrophe variants, Latin/Cyrillic fallback, and suffix chains.', state: 'preview-promotion' },

  { batch: 4, code: 'ru', difficulty: 'hard', sourcePlan: 'Russian Wiktionary/Wiktextract corpus.', specialWork: 'Stress marks, cases, aspect, and conjugation coverage.', state: 'preview-promotion' },
  { batch: 4, code: 'kk', difficulty: 'hard', sourcePlan: 'Kazakh Wiktionary-derived corpus.', specialWork: 'Cyrillic/Latin policy, seven cases, and vowel harmony.', state: 'preview-promotion' },
  { batch: 4, code: 'hi', difficulty: 'hard', sourcePlan: 'Hindi Wiktionary-derived corpus.', specialWork: 'Devanagari normalization, oblique/plural forms, and postpositions.', state: 'preview-promotion' },

  { batch: 5, code: 'ar', difficulty: 'hard', sourcePlan: 'Arabic Wiktionary/Wiktextract corpus.', specialWork: 'RTL smoke, diacritics, clitics, and root-pattern limitations.', state: 'preview-promotion' },
  { batch: 5, code: 'he', difficulty: 'hard', sourcePlan: 'Hebrew Wiktionary/Wiktextract corpus.', specialWork: 'RTL smoke, niqqud normalization, clitics, and root-pattern limitations.', state: 'preview-promotion' },

  { batch: 6, code: 'zh', difficulty: 'hard', sourcePlan: 'Chinese Wiktionary/Wiktextract corpus.', specialWork: 'Segmentation, simplified/traditional mapping, and pronunciation metadata.', state: 'preview-promotion' },
  { batch: 6, code: 'ja', difficulty: 'very-hard', sourcePlan: 'Japanese Wiktionary/Wiktextract corpus.', specialWork: 'Tokenizer, kana/kanji variants, inflections, readings, and optional pitch accent.', state: 'preview-promotion' },
  { batch: 6, code: 'ko', difficulty: 'very-hard', sourcePlan: 'Korean Wiktionary/NIKL-compatible approved corpus.', specialWork: 'Particles, verb/adjective endings, readings, and segmentation.', state: 'preview-promotion' },

  { batch: 7, code: 'ta', difficulty: 'very-hard', sourcePlan: 'Tamil Wiktionary-derived corpus.', specialWork: 'Native-script tokenization, suffix chains, and lemma fallback.', state: 'preview-promotion' },
  { batch: 7, code: 'te', difficulty: 'very-hard', sourcePlan: 'Telugu Wiktionary-derived corpus.', specialWork: 'Native-script tokenization, suffix chains, and lemma fallback.', state: 'preview-promotion' },
  { batch: 7, code: 'kn', difficulty: 'very-hard', sourcePlan: 'Kannada Wiktionary-derived corpus.', specialWork: 'Native-script tokenization, suffix chains, and lemma fallback.', state: 'preview-promotion' },
  { batch: 7, code: 'ml', difficulty: 'very-hard', sourcePlan: 'Malayalam Wiktionary-derived corpus.', specialWork: 'Chillu/virama preservation, suffix chains, and lemma fallback.', state: 'preview-promotion' },
  { batch: 7, code: 'my', difficulty: 'very-hard', sourcePlan: 'Burmese Wiktionary-derived corpus.', specialWork: 'Script segmentation and conservative morphology.', state: 'preview-promotion' },
  { batch: 7, code: 'bo', difficulty: 'very-hard', sourcePlan: 'Tibetan Wiktionary-derived corpus.', specialWork: 'Tsek-aware segmentation and conservative morphology.', state: 'preview-promotion' },
  { batch: 7, code: 'am', difficulty: 'very-hard', sourcePlan: 'Amharic Wiktionary-derived corpus.', specialWork: 'Fidel normalization, prefix/suffix clitics, and root-pattern limits.', state: 'preview-promotion' },

  { batch: 8, code: 'vi->fr', difficulty: 'very-hard', sourcePlan: 'DBnary/Wiktionary bilingual extraction or licensed dictionary.', specialWork: 'Prove dictionary-style bilingual rows; never substitute machine translation.', state: 'source-gated' },
  { batch: 8, code: 'yue', difficulty: 'very-hard', sourcePlan: 'Words.hk permission/full-definition dataset.', specialWork: 'Traditional Hanzi, vernacular characters, Jyutping, tones, and segmentation.', state: 'source-gated' },
  { batch: 8, code: 'ug', difficulty: 'very-hard', sourcePlan: 'Larger approved Uyghur-definition source or balanced Wiktionary set.', specialWork: 'RTL Arabic script, bidi policy, ULY mapping, and Turkic suffixes.', state: 'source-gated' },
  { batch: 8, code: 'eu', difficulty: 'very-hard', sourcePlan: 'Basque Wiktionary/Kaikki source gate.', specialWork: 'Agglutinative morphology and case system.', state: 'source-gated' },
  { batch: 8, code: 'ain', difficulty: 'very-hard', sourcePlan: 'Ainu Wiktionary/Kaikki or approved academic lexicon.', specialWork: 'Variety, script, romanization, and source availability.', state: 'source-gated' },
  { batch: 8, code: 'qu', difficulty: 'very-hard', sourcePlan: 'Variety-specific Quechua Wiktionary/Kaikki source gate.', specialWork: 'Choose variety, orthography, and agglutinative morphology.', state: 'source-gated' },
  { batch: 8, code: 'nah', difficulty: 'very-hard', sourcePlan: 'Variety-specific Nahuatl Wiktionary/Kaikki source gate.', specialWork: 'Choose variety, orthography, and polysynthetic morphology scope.', state: 'source-gated' },
  { batch: 8, code: 'gn', difficulty: 'very-hard', sourcePlan: 'Guarani Wiktionary/Kaikki source gate.', specialWork: 'Nasal harmony, orthography, and morphology scope.', state: 'source-gated' },
];

export function getLanguageProductionBatch(batch: number) {
  return languageProductionRoadmap.filter((target) => target.batch === batch);
}
