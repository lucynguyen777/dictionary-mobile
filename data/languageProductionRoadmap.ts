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
  { batch: 2, code: 'tl', difficulty: 'medium', sourcePlan: 'Extract and measure native definitions from tl.wiktionary.org; English-Wiktionary-derived Kaikki data is ineligible.', specialWork: 'Focus/voice affixes, infixation, reduplication, accent marks, and verified Baybayin aliases.', state: 'preview-promotion' },
  { batch: 2, code: 'sw', difficulty: 'medium', sourcePlan: 'Extract and measure native definitions from sw.wiktionary.org; English-Wiktionary-derived Kaikki data is ineligible.', specialWork: 'Noun classes and subject/tense/object verb prefix chains.', state: 'preview-promotion' },
  { batch: 2, code: 'yo', difficulty: 'medium', sourcePlan: 'Obtain an approved Yoruba-definition corpus; native Yoruba Wiktionary currently has no usable article corpus and English-Wiktionary-derived Kaikki data is ineligible.', specialWork: 'Tone-insensitive search while preserving display diacritics and lexical underdots.', state: 'preview-promotion' },
  { batch: 2, code: 'ig', difficulty: 'medium', sourcePlan: 'Accept Nkọwa okwu / Igbo API production terms or obtain another approved Igbo-definition corpus; native Wiktionary is currently too small and Kaikki is unavailable.', specialWork: 'Tone-insensitive, Ọnwụ underdot/ṅ-preserving lookup.', state: 'preview-promotion' },
  { batch: 2, code: 'zu', difficulty: 'medium', sourcePlan: 'Obtain an approved measured Zulu-definition corpus; native Wiktionary is currently below threshold/incomplete and English-Wiktionary-derived Kaikki data is ineligible.', specialWork: 'Noun class prefixes, locative fallbacks, and dictionary-tone-insensitive lookup.', state: 'preview-promotion' },

  { batch: 3, code: 'fi', difficulty: 'hard', sourcePlan: 'Extract and measure native definitions from fi.wiktionary.org; English-Wiktionary-derived Kaikki data remains helper-only.', specialWork: 'Case-rich morphology, consonant gradation, vowel harmony, and NFC/locale-safe lookup.', state: 'preview-promotion' },
  { batch: 3, code: 'et', difficulty: 'hard', sourcePlan: 'Extract and measure native definitions from et.wiktionary.org or separately configure the CC BY 4.0 Ekilex/Sõnaveeb API path; English-Wiktionary-derived Kaikki data remains helper-only.', specialWork: 'Case-rich morphology, NFC/locale-safe lookup, and diacritic preservation.', state: 'preview-promotion' },
  { batch: 3, code: 'hu', difficulty: 'hard', sourcePlan: 'Extract and measure native definitions from hu.wiktionary.org; English-Wiktionary-derived Kaikki data remains helper-only.', specialWork: 'Case chains, vowel harmony, vowel length, and NFC/locale-safe lookup.', state: 'preview-promotion' },
  { batch: 3, code: 'tr', difficulty: 'hard', sourcePlan: 'Extract and measure native definitions from Turkish-edition Wiktextract or tr.wiktionary.org; English-definition data remains helper-only.', specialWork: 'Dotted/dotless I, suffix chains, vowel harmony, and NFC/locale-safe lookup.', state: 'preview-promotion' },
  { batch: 3, code: 'uz', difficulty: 'hard', sourcePlan: 'Extract and measure native definitions from uz.wiktionary.org; Izoh.uz remains gated by terms and English-definition Kaikki remains helper-only.', specialWork: 'Apostrophe variants, Latin/Cyrillic inflected fallback, suffix chains, and NFC/locale-safe lookup.', state: 'preview-promotion' },

  { batch: 4, code: 'ru', difficulty: 'hard', sourcePlan: 'Extract and measure native definitions from ru.wiktionary.org or Russian-edition Wiktextract; English-definition data remains helper-only.', specialWork: 'Stress marks, cases, aspect, conjugation, and inflected related-word lookup.', state: 'preview-promotion' },
  { batch: 4, code: 'kk', difficulty: 'hard', sourcePlan: 'Measure native definitions from kk.wiktionary.org while documenting its current corpus-size constraint; English-definition Kaikki remains helper-only and other portals remain terms-gated.', specialWork: 'Cyrillic/Latin policy, seven cases, vowel harmony, negative verbs, and adjective comparison.', state: 'preview-promotion' },
  { batch: 4, code: 'hi', difficulty: 'hard', sourcePlan: 'Extract and measure native definitions from hi.wiktionary.org; English-definition support data remains helper-only.', specialWork: 'Devanagari normalization, oblique/plural forms, postpositions, and source-backed verb paradigms.', state: 'preview-promotion' },

  { batch: 5, code: 'ar', difficulty: 'hard', sourcePlan: 'Measure native definitions from ar.wiktionary.org while documenting its current corpus-size constraint; English-definition data remains helper-only.', specialWork: 'RTL smoke, vocalized/unvocalized fallback, clitics, and explicit root-pattern limitations.', state: 'preview-promotion' },
  { batch: 5, code: 'he', difficulty: 'hard', sourcePlan: 'Measure native definitions from he.wiktionary.org while documenting its current corpus-size constraint; English-definition data remains helper-only.', specialWork: 'RTL smoke, exact-then-niqqud-insensitive lookup, clitics, plurals, and explicit root-pattern limitations.', state: 'preview-promotion' },

  { batch: 6, code: 'zh', difficulty: 'hard', sourcePlan: 'Extract and measure Chinese-language sections from zh.wiktionary.org or Chinese-edition Wiktextract; English-definition data remains helper-only.', specialWork: 'Segmentation, directional simplified/traditional normalization, multi-character words, and pronunciation metadata.', state: 'preview-promotion' },
  { batch: 6, code: 'ja', difficulty: 'very-hard', sourcePlan: 'Extract and measure Japanese-language rows from Japanese-edition Wiktextract/jawiktionary; English-definition data remains helper-only.', specialWork: 'Tokenizer, source form-of/readings, bounded inflections, kana/kanji variants, and optional source-backed pitch accent.', state: 'preview-promotion' },
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
