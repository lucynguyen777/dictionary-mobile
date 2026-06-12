# Javanese Production Source Audit

## Decision

Javanese remains an **implemented local-fixture monolingual preview with a viable native-source candidate**.

- Hosted WiktAPI returned `404` for `waca`, `tulis`, and `omah` on 2026-06-12.
- `https://kaikki.org/dictionary/Javanese/kaikki.org-dictionary-Javanese.jsonl` contains 6,050 rows, but sampled glosses are English or romanization metadata from English Wiktionary. It is ineligible for Javanese monolingual production packaging.
- `jv.wiktionary.org` exposes native Javanese definitions and verified Aksara Jawa forms through the MediaWiki API. Sampled pages include `maca`, `tulis`, `tuku`, `tumbas`, `omah`, and `mangan`.
- The native source is a viable production-corpus candidate, but the repository does not yet have a Javanese Wiktionary template extractor, balanced 100-headword measurement, or attributed offline pack.

## Safe Work Completed

- Kept English-definition Kaikki data out of Javanese production fixtures and packs.
- Added fixture-backed Aksara Jawa aliases for the current local Latin entries only.
- Preserved the existing active/passive prefix, suffix, and Ngoko/Krama behavior.
- Did not claim general Aksara Jawa transliteration or production parity.

## Next Promotion Module

1. Build a bounded `jv.wiktionary.org` template extractor that preserves page URL, revision id/date, license, register labels, Latin form, and Aksara Jawa form.
2. Measure a balanced 100-headword sample across nouns, verbs, adjectives, Ngoko/Krama pairs, affixed forms, and both scripts.
3. Confirm at least 5,000 usable native-definition entries after parsing and deduplication.
4. Build and smoke-test an attributed offline pack through the existing SQLite pipeline.
5. Promote only after shared exact lookup, morphology, examples, related words, offline pack, and UI gates pass.
