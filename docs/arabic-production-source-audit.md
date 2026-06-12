# Arabic Production Source Audit

## Decision

Arabic remains an **implemented RTL local-fixture monolingual preview with a viable but corpus-size-constrained native-source candidate**.

- Hosted WiktAPI and a dedicated hosted Arabic-edition raw path remain unavailable for production lookup.
- English-Wiktionary-derived Arabic data is useful for forms, transliteration, pronunciation, and morphology measurement, but English definitions are ineligible for Arabic monolingual production definitions.
- Native `ar.wiktionary.org` exposes Arabic entries through the MediaWiki API, but currently reports about 71,600 articles and sampled pages can be disambiguation- or morphology-oriented rather than complete dictionary entries.
- Native Arabic Wiktionary is viable for bounded extraction and measurement, but production promotion must measure native-definition coverage and parser quality before offline packaging.

## Safe Work Completed

- Preserved exact vocalized Arabic lookup first, then added a diacritic-insensitive search fallback for Arabic harakat, Quranic marks, and tatweel.
- Reused existing conservative clitic/prefix candidates for vocalized and unvocalized input.
- Added morphology-aware related-word lookup for vocalized, prefixed, and broken-plural fixture forms.
- Kept root-pattern extraction out of local fallback and preserved canonical native-script headwords.

## Next Promotion Module

1. Build a bounded `ar.wiktionary.org` extractor preserving page URL, revision id/date, license, Arabic definitions, vocalization, examples, relations, roots, and source-provided forms.
2. Measure a balanced 100-headword sample across vocalized/unvocalized forms, clitics, broken plurals, verbs, and mixed RTL metadata.
3. Report usable native-definition coverage and parser/disambiguation failure rates before choosing an offline-pack scope.
4. Run RTL Word/Reader/Library smoke with extracted entries and mixed Arabic/Latin metadata.
5. Keep broad root-pattern stemming and bilingual Arabic gated until source-backed contracts are accepted.
