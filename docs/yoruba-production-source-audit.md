# Yoruba Production Source Audit

## Decision

Yoruba remains an **implemented local-fixture monolingual preview with production promotion source-blocked**.

- Hosted WiktAPI returned `404` for `ilé`, `omi`, and `ọmọ` on 2026-06-12.
- The Kaikki Yoruba dataset is English-Wiktionary-derived and uses English definitions. It remains ineligible for Yoruba monolingual production packaging.
- `yo.wiktionary.org` currently reports zero articles, and sampled fixture headwords are unavailable through its MediaWiki API.
- No approved Yoruba-definition corpus with at least 5,000 attributed entries is currently selected.

## Safe Work Completed

- Preserved tone-insensitive lookup for acute and grave marks.
- Added dictionary-style macron removal as another tone-only normalization.
- Preserved lexical underdots in `ẹ`, `ọ`, and `ṣ`; the app does not collapse those letters into `e`, `o`, and `s`.
- Kept English-definition data out of Yoruba production fixtures and packs.

## Unblock Requirements

1. Identify an approved Yoruba-definition source with explicit license, attribution, and revision/retrieval date.
2. Confirm representative native definitions and enough coverage for a balanced 100-headword measurement.
3. Measure exact, tone-insensitive, and underdot-preserving lookup separately.
4. Build an attributed offline candidate only after the definition-language and corpus-size gates pass.
5. Run Word/Reader/Library and offline import/delete/lookup smoke before promotion.
