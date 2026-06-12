# Estonian Production Source Audit

## Decision

Estonian remains an **implemented curated-fixture monolingual preview with a strong native-source candidate**.

- Hosted WiktAPI returned `404` for `maja`, `jää`, and `sööma` on 2026-06-12.
- The Kaikki Estonian dataset is English-Wiktionary-derived and uses English definitions. It remains helper-only for forms/pronunciation and is ineligible for Estonian monolingual production definitions.
- Native `et.wiktionary.org` exposes Estonian definitions, relations, and inflection material through the MediaWiki API and reports more than 164,000 articles.
- Ekilex/Sõnaveeb remains a promising CC BY 4.0 official-source option, but requires API-key handling and endpoint-specific parser work.

## Safe Work Completed

- Added NFC and Estonian-locale normalization before morphology analysis.
- Verified conservative generic case suffixes against diacritic-heavy `jää` and `öö` fixtures.
- Preserved `ä`, `ö`, `ü`, and `õ`; ASCII-folded forms remain rejected.
- Kept English-definition data out of Estonian production fixtures and packs.

## Next Promotion Module

1. Choose the first production extractor: native Estonian Wiktionary or separately accepted Ekilex/Sõnaveeb API integration.
2. Preserve source URL, revision/date, license, Estonian definitions, examples, relations, and inflection metadata.
3. Measure a balanced 100-headword sample across cases, gradation patterns, verbs, adjectives, and diacritic-heavy forms.
4. Confirm at least 5,000 usable native-definition entries and build an attributed offline candidate.
5. Promote only after shared exact lookup, morphology, examples, related words, offline pack, and UI gates pass.
