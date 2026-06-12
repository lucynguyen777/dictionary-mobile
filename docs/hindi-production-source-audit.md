# Hindi Production Source Audit

## Decision

Hindi remains an **implemented local-fixture monolingual preview with a viable native-source candidate**.

- Hosted WiktAPI remains unavailable for sampled Hindi-edition direct lookups.
- English-Wiktionary-derived Hindi data can support forms, pronunciation, and comparison, but English definitions are ineligible for Hindi monolingual production definitions.
- Native `hi.wiktionary.org` exposes Hindi definitions, examples, relations, and published-dictionary sections through the MediaWiki API. It reports about 185,000 articles.
- Native Hindi Wiktionary is viable for bounded extraction and measurement, but production promotion still requires a representative corpus report, parser quality checks, and attributed offline pack.

## Safe Work Completed

- Preserved Devanagari-only canonical lookup and existing narrow chandrabindu/anusvara and `हिन्दी`/`हिंदी` normalization.
- Added fixture-backed future and polite forms for the existing `करना` lemma without introducing a broad Hindi stemmer.
- Kept Latin transliteration out of canonical lookup until a supported romanization policy is accepted.
- Kept English-definition data out of Hindi production fixtures and packs.

## Next Promotion Module

1. Build a bounded `hi.wiktionary.org` extractor preserving page URL, revision id/date, license, Hindi definitions, examples, relations, script variants, and forms.
2. Measure a balanced 100-headword sample across Devanagari variants, gender/number, oblique/plural forms, postpositions, verbs, and source-provided paradigms.
3. Confirm at least 5,000 usable native-definition entries after parsing and deduplication.
4. Build and smoke-test an attributed offline pack through the existing SQLite pipeline.
5. Keep Latin transliteration and bilingual Hindi gated until their source/policy decisions are accepted.
