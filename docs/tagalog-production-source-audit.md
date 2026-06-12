# Tagalog Production Source Audit

## Decision

Tagalog remains an **implemented local-fixture monolingual preview with a viable native-source candidate**.

- Hosted WiktAPI returned `404` for `basa`, `sulat`, and `bahay` on 2026-06-12.
- The Kaikki Tagalog dataset is derived from English Wiktionary and uses English definitions. It remains ineligible for Tagalog monolingual production packaging.
- `tl.wiktionary.org` exposes native Tagalog definitions through the MediaWiki API. Sampled pages include `aso`, `basa`, `kain`, and `bahay`; the site reports more than 17,000 articles.
- The native source is viable for a bounded extraction/measurement candidate, but page templates and completeness vary. No production promotion is allowed before parsing, attribution, coverage measurement, and offline-pack smoke pass.

## Safe Work Completed

- Added accent-insensitive lookup candidates while preserving the original displayed spelling and headword.
- Added the verified Baybayin form `ᜀᜐᜓ` as a fixture-backed alias for `aso`.
- Preserved existing prefix, suffix, infix, reduplication, and related-word behavior.
- Kept English-definition data out of Tagalog production fixtures and packs.

## Next Promotion Module

1. Build a bounded `tl.wiktionary.org` extractor that preserves page URL, revision id/date, license, part of speech, examples, relations, accent marks, and Baybayin forms when present.
2. Measure a balanced 100-headword sample across nouns, adjectives, actor/patient/location focus forms, infixes, circumfixes, reduplication, and accented forms.
3. Confirm at least 5,000 usable native-definition entries after parsing and deduplication.
4. Build and smoke-test an attributed offline pack through the existing SQLite pipeline.
5. Promote only after all shared corpus, morphology, offline, and UI gates pass.
