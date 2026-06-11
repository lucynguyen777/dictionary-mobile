# Language Parity And Offline Pack Promotion

Promotion is executed one language at a time from measured corpus evidence. The first candidate is French monolingual (`fr`), selected because its bounded WiktAPI noun/verb probes pass, live lexical rows carry Wiktionary attribution, and `fr->vi` is already a supported production pair.

## Promotion Gate

French remains **measured preview** until all gates pass:

| Gate | Minimum |
| --- | ---: |
| Representative headword sample | 100 |
| Attributed corpus entries | 5,000 |
| Exact lookup pass | 95% |
| Morphology pass | 85% |
| Entries with examples | 40% |
| Entries with related words | 30% |
| Missing-result behavior | Pass |
| Offline pack entries | 5,000 |
| Offline import/delete/lookup smoke | Pass |
| Word/Reader/Library UI smoke | Pass |

Current frozen evidence covers the bounded 100-headword report and a reproducible 5,000-entry Kaikki candidate in `docs/french-100-headword-measurement.md`. Source revision, attributed corpus size, and candidate pack size now pass, but exact lookup, related words, representative candidate coverage, and offline runtime smoke still fail. Do not promote French or publish a French pack yet.

The executable gate lives in `data/languagePromotionGate.ts`. It records French as the only active candidate and deliberately fails promotion while the upstream source revision date, full corpus, related words, exact coverage, and offline pack smoke are missing.

## Execution Order

1. Select an approved French Wiktionary/Wiktextract corpus with at least 5,000 attributed entries and a recorded revision date.
2. Build a generated candidate pack under `tmp/offline-packs/`.
3. Verify source date, license, attribution, checksums, exact/morphology/missing lookup, examples, and relations.
4. Run native import/delete/lookup plus Word/Reader/Library UI smoke.
5. Only then move the pack to `public/offline-packs/` and change French from preview to production parity.

After French passes or is explicitly rejected, repeat the same gate for Malay, then Spanish. No two preview languages are promoted in the same module.

## Current French Measurement

| Measurement | Current | Required | Result |
| --- | ---: | ---: | --- |
| Representative headwords | 100 | 100 | Pass |
| Attributed entries | 5,000-entry Kaikki candidate | 5,000 | Pass |
| Exact lookup | 92% | 95% | Blocked |
| Morphology | 85% source coverage | 85% | Pass for bounded sample |
| Examples | 100% of resolved entries | 40% | Pass for bounded sample |
| Related words | 0% measured | 30% | Blocked |
| Source license | Recorded | Recorded | Pass |
| Source date | Kaikki source revision `2026-06-07` | Recorded | Pass |
| Offline pack entries | 5,000 candidate entries | 5,000 | Pass |
| Offline pack smoke | Not run | Pass | Blocked |
| UI smoke | Pass | Pass | Pass |

The next implementation module must select a reproducible 5,000-entry corpus candidate and record its exact source/dump revision date. A candidate pack must stay under `tmp/offline-packs/` until every promotion gate passes.
