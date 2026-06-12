# Japanese Production Source Audit

## Decision

Japanese remains an **implemented local-fixture monolingual preview with a viable native-definition raw-dump source**.

- Hosted WiktAPI direct lookup remains unsuitable for the sampled common Japanese words.
- English-Wiktionary-derived Japanese data can support readings, forms, and morphology research, but English definitions are ineligible for Japanese monolingual production definitions.
- Japanese-edition Wiktextract/jawiktionary raw data exposes Japanese glosses, readings, forms, and form-of relationships.
- The sampled source models `食べる` as a kanji form pointing to the canonical lemma `たべる`; production ingestion must preserve and follow source form-of relationships rather than treating every written form as an independent definition.

## Safe Work Completed

- Preserved exact NFC lookup first.
- Added a deliberately bounded set of verified ichidan forms for the existing `食べる` and `たべる` fixtures.
- Added morphology-aware related-word lookup for verified inflected fixture forms.
- Kept broad godan conjugation expansion, romaji-to-kana guessing, tokenizer replacement, and pitch-accent generation out of local fallback.

## Next Promotion Module

1. Build a bounded Japanese-edition Wiktextract importer preserving source URL/dump date, license, Japanese glosses, canonical lemma, form-of rows, readings, examples, relations, pronunciation, and source-provided forms.
2. Measure a balanced 100-headword sample across nouns, kana/kanji pairs, ichidan/godan/irregular verbs, adjectives, compounds, and missing entries.
3. Report target-language definition coverage, form-of resolution accuracy, readings/examples/relations coverage, and parser failures.
4. Run Word and Reader segmentation smoke with multi-character/no-space text and environments without `Intl.Segmenter`.
5. Keep production promotion blocked until measured corpus, attribution UI, offline packaging, and segmentation gates pass.
