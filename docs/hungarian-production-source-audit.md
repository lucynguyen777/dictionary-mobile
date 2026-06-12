# Hungarian Production Source Audit

## Decision

Hungarian remains an **implemented local-fixture monolingual preview with a strong native-source candidate**.

- Hosted WiktAPI does not currently expose a viable Hungarian-edition endpoint.
- The Kaikki Hungarian dataset is English-Wiktionary-derived and uses English definitions. It remains useful for forms, pronunciation, and corpus comparison, but is ineligible for Hungarian monolingual production definitions.
- Native `hu.wiktionary.org` exposes Hungarian definitions, IPA, etymology, derivatives, phrases, and inflection sections through the MediaWiki API. It reports more than 555,000 articles.
- The native source is a strong extraction/measurement candidate, but the repository does not yet have a Hungarian Wiktionary template extractor, balanced 100-headword report, or attributed offline pack.

## Safe Work Completed

- Added NFC and Hungarian-locale normalization before morphology analysis.
- Added conservative plural-plus-case fallback for fixture-backed forms such as `házakban`, `erdőkben`, and `kutyákhoz`.
- Added fixture-backed instrumental consonant-assimilation fallback for `házzal`.
- Preserved `á`, `é`, `í`, `ó`, `ö`, `ő`, `ú`, `ü`, and `ű`; ASCII folding remains out of the canonical lookup path.
- Kept English-definition data out of Hungarian production fixtures and packs.

## Next Promotion Module

1. Build a bounded `hu.wiktionary.org` extractor preserving page URL, revision id/date, license, Hungarian definitions, examples, relations, pronunciation, and inflection metadata.
2. Measure a balanced 100-headword sample across case chains, possessives, vowel harmony classes, vowel length, verbs, adjectives, and source-provided forms.
3. Confirm at least 5,000 usable native-definition entries after parsing and deduplication.
4. Build and smoke-test an attributed offline pack through the existing SQLite pipeline.
5. Promote only after shared exact lookup, morphology, examples, related words, offline pack, and UI gates pass.
