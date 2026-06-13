# Telugu Production Source Audit

## Decision

Telugu remains an **implemented local-fixture monolingual preview with a viable but parser-sensitive native-edition source**.

- Telugu Wiktionary is a native-edition candidate, but edition-wide page counts include entries for languages other than Telugu and cannot be treated as Telugu lemma coverage.
- English-Wiktionary-derived Telugu data may support forms and morphology research, but English definitions are ineligible for Telugu monolingual production definitions.
- Production extraction must select verified Telugu-language sections, preserve revision/license metadata, and measure usable native-definition coverage.
- Telugu suffix chains and irregular obliques make broad local lemma guessing unsafe without corpus evidence.

## Safe Work Completed

- Preserved exact NFC lookup first and made morphology input NFC-safe.
- Reused the existing conservative suffix, plural-oblique, and irregular `ఇంటి` candidates for related-word lookup on verified fixtures.
- Kept broad sandhi reversal, verb-paradigm generation, transliteration guessing, and cross-language page assumptions out of local fallback.

## Next Promotion Module

1. Build a bounded Telugu-edition extractor preserving page URL/revision, license, verified Telugu section, headword, definitions, examples, relations, pronunciation, and source-provided forms.
2. Measure a balanced 100-headword sample across nouns, verbs, adjectives, plurals, cases, irregular obliques, suffix chains, and missing entries.
3. Report Telugu-section parser precision, usable native-definition coverage, examples/relations coverage, and morphology success.
4. Run Word and Reader native-script tokenization smoke with combining marks and long suffix chains.
5. Keep production promotion blocked until measured corpus, attribution UI, offline packaging, and tokenization gates pass.
