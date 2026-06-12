# Finnish Production Source Audit

## Decision

Finnish remains an **implemented local-fixture monolingual preview with a strong native-source candidate**.

- Hosted WiktAPI returned `404` for `talo`, `kirja`, and `syödä` on 2026-06-12.
- The Kaikki Finnish dataset is English-Wiktionary-derived and uses English definitions. It is useful for forms and pronunciation metadata, but remains ineligible for Finnish monolingual production definitions.
- Native `fi.wiktionary.org` exposes Finnish definitions, examples, inflection templates, pronunciation, and etymology through the MediaWiki API. It reports more than 710,000 articles.
- The native source is a strong extraction/measurement candidate, but the repository does not yet have a Finnish Wiktionary template extractor, balanced 100-headword report, or attributed offline pack.

## Safe Work Completed

- Added NFC and Finnish-locale normalization before morphology analysis.
- Extended the existing fixture-backed `käde- -> käsi` gradation restoration across inessive, elative, adessive, ablative, and allative cases.
- Preserved `ä`, `ö`, and Finnish vowel-harmony spelling.
- Kept English-definition data out of Finnish production fixtures and packs.

## Next Promotion Module

1. Build a bounded `fi.wiktionary.org` extractor preserving page URL, revision id/date, license, Finnish definitions, examples, relations, pronunciation, and inflection-template metadata.
2. Measure a balanced 100-headword sample across cases, gradation classes, vowel harmony, verbs, adjectives, and source-provided forms.
3. Confirm at least 5,000 usable native-definition entries after parsing and deduplication.
4. Build and smoke-test an attributed offline pack through the existing SQLite pipeline.
5. Promote only after shared exact lookup, morphology, examples, related words, offline pack, and UI gates pass.
