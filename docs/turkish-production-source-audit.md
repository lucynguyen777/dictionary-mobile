# Turkish Production Source Audit

## Decision

Turkish remains an **implemented local-fixture monolingual preview with a strong native-source candidate**.

- Hosted WiktAPI is useful for some simple headwords, but sampled Turkish-specific casing entries have been inconsistent.
- The English-Wiktionary-derived Kaikki Turkish dataset is useful for forms and pronunciation metadata, but English definitions are ineligible for Turkish monolingual production definitions.
- Native `tr.wiktionary.org` exposes Turkish definitions, IPA, examples, etymology, relations, and inflection sections through the MediaWiki API. It reports more than 1,350,000 articles.
- Turkish-edition Wiktextract raw data remains the preferred bulk candidate because it preserves native glosses and Turkish casing. Production promotion still requires a measured extractor and attributed offline pack.

## Safe Work Completed

- Added NFC normalization before Turkish dotted/dotless-I casing normalization in morphology and dictionary lookup.
- Added conservative plural-plus-case fallback for fixture-backed forms such as `evlerde`, `evlerden`, and `ışıklarda`.
- Preserved proper-noun apostrophe behavior such as `İstanbul'da`.
- Kept English-definition data out of Turkish production fixtures and packs.

## Next Promotion Module

1. Build a bounded Turkish-edition Wiktextract or `tr.wiktionary.org` extractor preserving page URL, revision/dump date, license, Turkish definitions, examples, relations, pronunciation, and forms.
2. Measure a balanced 100-headword sample across dotted/dotless I, plural-plus-case chains, possessives, consonant gradation, verbs, and source-provided forms.
3. Confirm at least 5,000 usable native-definition entries after parsing and deduplication.
4. Build and smoke-test an attributed offline pack through the existing SQLite pipeline.
5. Promote only after shared exact lookup, morphology, examples, related words, offline pack, and UI gates pass.
