# Korean Production Source Audit

## Decision

Korean remains an **implemented local-fixture monolingual preview with a viable native-definition raw-dump source**.

- Hosted WiktAPI direct lookup remains unsuitable for the sampled common Korean words.
- English-Wiktionary-derived Korean data can support research, but English definitions are ineligible for Korean monolingual production definitions.
- Korean-edition Wiktextract/kowiktionary raw data exposes Korean glosses, examples, IPA/audio, Hangul phonetic forms, romanization, and relations for sampled entries.
- The sampled verb entry does not provide a broad conjugation table. Production lookup must measure corpus forms and keep local ending fallbacks bounded.
- NIKL remains a separate possible source whose API, license, attribution, and redistribution terms must be validated before use.

## Safe Work Completed

- Preserved exact NFC lookup first and made the morphology boundary NFC-safe.
- Added only verified fixture forms for the current `먹다` preview where broad suffix rules do not recover the lemma reliably.
- Added morphology-aware related-word lookup for verified particle and inflected fixture forms.
- Kept broad irregular-conjugation generation, Hanja guessing, pronunciation-rule generation, and unverified NIKL data out of local fallback.

## Next Promotion Module

1. Build a bounded Korean-edition Wiktextract importer preserving source URL/dump date, license, Korean glosses, examples, IPA/audio, phonetic forms, romanization, relations, and source-provided forms.
2. Measure a balanced 100-headword sample across nouns with particles, regular/irregular verbs, adjectives, spacing variants, Sino-Korean words, and missing entries.
3. Report target-language definition coverage, pronunciation/romanization coverage, inflected lookup success, and parser failures.
4. Run Word and Reader segmentation smoke for eojeol, particles, endings, and mixed Hangul/Hanja metadata.
5. Keep production promotion blocked until measured corpus, attribution UI, offline packaging, and segmentation gates pass.
