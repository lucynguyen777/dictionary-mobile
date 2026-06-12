# Russian Production Source Audit

## Decision

Russian remains an **implemented local-fixture monolingual preview with a strong native-source candidate**.

- Hosted WiktAPI remains unavailable for sampled Russian-edition direct lookups.
- English-Wiktionary-derived Russian data is useful for forms, pronunciation, and comparison, but English definitions are ineligible for Russian monolingual production definitions.
- Native `ru.wiktionary.org` exposes rich Russian definitions, stress-marked forms, morphology, etymology, examples, and relations through the MediaWiki API. It reports more than 1,500,000 articles.
- Native Russian Wiktionary or Russian-edition Wiktextract is a strong extraction/measurement candidate, but production promotion still requires a bounded parser, representative coverage report, and attributed offline pack.

## Safe Work Completed

- Normalized Russian lookup through NFD stress-mark removal followed by NFC and Russian-locale lowercasing.
- Reused existing morphology candidates for related-word lookup so inflected and stress-marked fixture forms can reach lemma relations.
- Preserved Cyrillic canonical lookup and kept transliteration out of the production lookup path.
- Kept broad aspect-pair guessing out of local fallback until source-backed forms are measured.

## Next Promotion Module

1. Build a bounded Russian Wiktionary/Wiktextract extractor preserving page URL, revision/dump date, license, Russian definitions, stress, examples, relations, aspect pairs, and forms.
2. Measure a balanced 100-headword sample across noun/adjective cases, stress marks, imperfective/perfective pairs, conjugations, and related words.
3. Confirm at least 5,000 usable native-definition entries after parsing and deduplication.
4. Build and smoke-test an attributed offline pack through the existing SQLite pipeline.
5. Promote only after shared exact lookup, morphology, examples, related words, offline pack, and UI gates pass.
