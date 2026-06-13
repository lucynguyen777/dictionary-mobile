# Kannada Production Source Audit

## Decision

Kannada remains an **implemented local-fixture monolingual preview with a viable but parser-sensitive native-edition source**.

- Kannada Wiktionary is a native-edition candidate, but edition-wide page counts include entries for languages other than Kannada and cannot be treated as Kannada lemma coverage.
- English-Wiktionary-derived Kannada data may support forms and morphology research, but English definitions are ineligible for Kannada monolingual production definitions.
- Production extraction must select verified Kannada-language sections, preserve revision/license metadata, and measure usable native-definition coverage.
- Kannada suffix chains and glide/sandhi insertions make broad local lemma guessing unsafe without corpus evidence.

## Safe Work Completed

- Preserved exact NFC lookup first and made morphology input NFC-safe.
- Reused the existing conservative plural, plural-oblique, and singular-case candidates for related-word lookup on verified fixtures.
- Kept broad glide/sandhi reversal, verb-paradigm generation, transliteration guessing, and cross-language page assumptions out of local fallback.

## Next Promotion Module

1. Build a bounded Kannada-edition extractor preserving page URL/revision, license, verified Kannada section, headword, definitions, examples, relations, pronunciation, and source-provided forms.
2. Measure a balanced 100-headword sample across nouns, verbs, adjectives, plurals, cases, glide/sandhi forms, suffix chains, and missing entries.
3. Report Kannada-section parser precision, usable native-definition coverage, examples/relations coverage, and morphology success.
4. Run Word and Reader native-script tokenization smoke with combining marks and long suffix chains.
5. Keep production promotion blocked until measured corpus, attribution UI, offline packaging, and tokenization gates pass.
