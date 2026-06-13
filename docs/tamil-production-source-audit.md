# Tamil Production Source Audit

## Decision

Tamil remains an **implemented local-fixture monolingual preview with a viable but parser-sensitive native-edition source**.

- Tamil Wiktionary is a large edition, but edition-wide page counts include entries for languages other than Tamil and cannot be treated as Tamil lemma coverage.
- English-Wiktionary-derived Tamil data may support forms and morphology research, but English definitions are ineligible for Tamil monolingual production definitions.
- Production extraction must select verified Tamil-language sections, preserve revision/license metadata, and measure usable native-definition coverage.
- Agglutinative suffixes and sandhi make broad local lemma guessing unsafe without corpus evidence.

## Safe Work Completed

- Preserved exact NFC lookup first and made morphology input NFC-safe.
- Reused the existing conservative suffix/oblique candidates for related-word lookup on verified fixtures.
- Kept broad sandhi reversal, verb-paradigm generation, transliteration guessing, and cross-language page assumptions out of local fallback.

## Next Promotion Module

1. Build a bounded Tamil-edition extractor preserving page URL/revision, license, verified Tamil section, headword, definitions, examples, relations, pronunciation, and source-provided forms.
2. Measure a balanced 100-headword sample across nouns, verbs, adjectives, plurals, cases, suffix chains, sandhi, and missing entries.
3. Report Tamil-section parser precision, usable native-definition coverage, examples/relations coverage, and morphology success.
4. Run Word and Reader native-script tokenization smoke with combining marks and long suffix chains.
5. Keep production promotion blocked until measured corpus, attribution UI, offline packaging, and tokenization gates pass.
