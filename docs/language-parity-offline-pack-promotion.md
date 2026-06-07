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

Current frozen evidence covers three passing common-word probes and live attribution behavior, but does not meet corpus-size, examples, relations, morphology, or offline-pack gates. Do not promote French or publish a French pack yet.

The executable gate lives in `data/languagePromotionGate.ts`. It records French as the only active candidate and deliberately fails promotion while the source date, measured corpus, and offline pack smoke are missing.

## Execution Order

1. Measure a 100-headword French sample from an approved French Wiktionary/Wiktextract source.
2. Build a generated candidate pack under `tmp/offline-packs/`.
3. Verify source date, license, attribution, checksums, exact/morphology/missing lookup, examples, and relations.
4. Run native import/delete/lookup plus Word/Reader/Library UI smoke.
5. Only then move the pack to `public/offline-packs/` and change French from preview to production parity.

After French passes or is explicitly rejected, repeat the same gate for Malay, then Spanish. No two preview languages are promoted in the same module.

## Current French Measurement

| Measurement | Current | Required | Result |
| --- | ---: | ---: | --- |
| Representative headwords | 3 | 100 | Blocked |
| Attributed entries | 3 | 5,000 | Blocked |
| Exact lookup | 100% | 95% | Pass for bounded sample only |
| Morphology | 0% measured | 85% | Blocked |
| Examples | 0% measured | 40% | Blocked |
| Related words | 0% measured | 30% | Blocked |
| Source license | Recorded | Recorded | Pass |
| Source date | Not recorded | Recorded | Blocked |
| Offline pack entries | 0 | 5,000 | Blocked |
| Offline pack smoke | Not run | Pass | Blocked |
| UI smoke | Pass | Pass | Pass |

The next implementation module must first produce a reproducible 100-headword report and record the exact source/dump date. A candidate pack must stay under `tmp/offline-packs/` until every promotion gate passes.
