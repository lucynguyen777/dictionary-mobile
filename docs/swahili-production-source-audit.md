# Swahili Production Source Audit

## Decision

Swahili remains an **implemented local-fixture monolingual preview with a strong native-source candidate**.

- Hosted WiktAPI returned `404` for `kitabu`, `mtu`, and `kula` on 2026-06-12.
- The Kaikki Swahili dataset is English-Wiktionary-derived and uses English definitions. It remains ineligible for Swahili monolingual production packaging.
- `sw.wiktionary.org` exposes native Kiswahili definitions through the MediaWiki API and reports about 93,000 articles. Sampled pages include `mtu`, `kitabu`, `nyumba`, `mti`, and `kula`.
- The native source is a strong extraction/measurement candidate, but the repository does not yet have a Swahili Wiktionary template extractor, balanced 100-headword report, or attributed offline pack.

## Safe Work Completed

- Preserved existing fixture-backed noun-class plural mappings.
- Added direct infinitive `ku-` stripping for verified verb-root lookup.
- Generalized the existing subject + tense + object-prefix parser conservatively around roots ending in `-a`.
- Kept English-definition data out of Swahili production fixtures and packs.

## Next Promotion Module

1. Build a bounded `sw.wiktionary.org` extractor preserving page URL, revision id/date, license, noun class, plural form, part of speech, examples, and relations.
2. Measure a balanced 100-headword sample across noun classes, singular/plural pairs, verbs, subject/tense/object chains, and common derivational suffixes.
3. Confirm at least 5,000 usable native-definition entries after parsing and deduplication.
4. Build and smoke-test an attributed offline pack through the existing SQLite pipeline.
5. Promote only after shared exact lookup, morphology, examples, related words, offline pack, and UI gates pass.
