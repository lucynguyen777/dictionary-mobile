# Kazakh Production Source Audit

## Decision

Kazakh remains an **implemented local-fixture monolingual preview with a viable but corpus-size-constrained native-source candidate**.

- Hosted WiktAPI and a dedicated Kaikki `kkwiktionary` raw path remain unavailable.
- English-Wiktionary-derived Kaikki Kazakh data is useful for forms, IPA, romanization, and morphology measurement, but English definitions are ineligible for Kazakh monolingual production definitions.
- Native `kk.wiktionary.org` exposes native Kazakh definitions through the MediaWiki API, but currently reports only about 14,400 articles and sampled verb pages can contain definition placeholders.
- Sozdik.kz and official/state dictionaries remain blocked until API access and terms/license are approved.
- Native Kazakh Wiktionary is viable for bounded extraction and measurement, but production promotion must document coverage shortfalls rather than assume a 5,000-entry usable corpus.

## Safe Work Completed

- Preserved NFC and Kazakh-locale normalization for the full Kazakh Cyrillic alphabet.
- Added conservative negative-past verb fallback for harmony variants such as `айтпады`.
- Added fixture-backed comparative adjective fallback for `жақсырақ`.
- Kept Latin transliteration out of canonical lookup until a verified mapping table is accepted.
- Kept English-definition and terms-gated sources out of Kazakh production fixtures and packs.

## Next Promotion Module

1. Build a bounded `kk.wiktionary.org` extractor preserving page URL, revision id/date, license, Kazakh definitions, examples, relations, and placeholder status.
2. Measure a balanced 100-headword sample across seven cases, plural/case chains, vowel harmony, negative verbs, adjectives, and source-provided forms.
3. Report the usable native-definition corpus size and placeholder rate; do not promote if representative coverage is insufficient.
4. Build and smoke-test an attributed offline pack only if the measured corpus clears the shared promotion gate.
5. Keep Latin-script lookup and external dictionary portals gated until mapping and license decisions are accepted.
