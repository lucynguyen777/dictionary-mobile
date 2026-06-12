# Hebrew Production Source Audit

## Decision

Hebrew remains an **implemented RTL local-fixture monolingual preview with a viable but corpus-size-constrained native-source candidate**.

- Hosted WiktAPI and a dedicated hosted Hebrew-edition raw path remain unavailable for production lookup.
- English-Wiktionary-derived Hebrew data is useful for forms, transliteration, pronunciation, and morphology measurement, but English definitions are ineligible for Hebrew monolingual production definitions.
- Native `he.wiktionary.org` exposes Hebrew definitions, niqqud, examples, and relations through the MediaWiki API, but currently reports about 25,100 articles.
- Native Hebrew Wiktionary is viable for bounded extraction and measurement, but production promotion must measure coverage, niqqud behavior, and parser quality before offline packaging.

## Safe Work Completed

- Preserved exact niqqud-bearing Hebrew lookup first, then added a niqqud/cantillation-insensitive search fallback.
- Reused existing conservative prefix and plural candidates for pointed and unpointed input.
- Added morphology-aware related-word lookup for niqqud, prefixed, and plural fixture forms.
- Kept shoresh/binyan extraction out of local fallback and preserved canonical native-script headwords.

## Next Promotion Module

1. Build a bounded `he.wiktionary.org` extractor preserving page URL, revision id/date, license, Hebrew definitions, niqqud, examples, relations, roots, binyanim, and source-provided forms.
2. Measure a balanced 100-headword sample across pointed/unpointed forms, prefixes, plurals, final letters, verbs, and mixed RTL metadata.
3. Report usable native-definition coverage and parser failure rates before choosing an offline-pack scope.
4. Run RTL Word/Reader/Library smoke with extracted entries and mixed Hebrew/Latin metadata.
5. Keep broad shoresh/binyan guessing and bilingual Hebrew gated until source-backed contracts are accepted.
