# French 100-Headword Corpus Measurement

Measured on **2026-06-11** against `https://api.wiktapi.dev/v1/fr/word/{word}`.

The bounded sample is committed at `data/headword-lists/french-promotion-100.txt`. It contains nouns, verbs, adjectives, adverbs, function words, and 20 inflected probes. Detailed live responses remain ignored under `tmp/language-measurements/`.

## Frozen Results

| Metric | Result | Promotion threshold | Decision |
| --- | ---: | ---: | --- |
| Representative probes | 100 | 100 | Pass |
| Exact/source lookup | 92% | 95% | Fail |
| Attributed entries in measured sample | 92 | 5,000 corpus entries | Fail |
| Inflected probe source coverage | 85% | 85% | Pass |
| Examples among resolved entries | 100% | 40% | Pass |
| Related words among resolved entries | 0% | 30% | Fail |
| Offline pack entries | 0 | 5,000 | Fail |
| Offline pack smoke | Not run | Required | Fail |

Failed source probes: `école`, `année`, `réponse`, `écrire`, `après`, `écoles`, `années`, and `écrit`.

## Decision

French remains **measured preview**. The 100-headword gate is complete, but hosted API coverage does not pass the exact-lookup threshold and exposes no related-word coverage in this measurement. The measurement date is recorded, but WiktAPI does not expose the required upstream dump/revision date. No French offline pack may be published until an approved Wiktionary/Wiktextract corpus supplies at least 5,000 attributed entries and passes import, delete, lookup, UI, checksum, and source-date smoke.

```bash
node scripts/measure-language-corpus.mjs --lang fr --input data/headword-lists/french-promotion-100.txt
```
