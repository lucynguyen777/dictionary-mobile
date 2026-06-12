# French 100-Headword Corpus Measurement

Measured on **2026-06-11** against `https://api.wiktapi.dev/v1/fr/word/{word}`.

The bounded sample is committed at `data/headword-lists/french-promotion-100.txt`. It contains nouns, verbs, adjectives, adverbs, function words, and 20 inflected probes. Detailed live responses remain ignored under `tmp/language-measurements/`.

## Frozen Results

| Metric | Result | Promotion threshold | Decision |
| --- | ---: | ---: | --- |
| Representative probes | 100 | 100 | Pass |
| Exact/source lookup | 92% | 95% | Fail |
| Eligible attributed monolingual corpus | 92 live resolved rows; no approved 5,000-entry corpus | 5,000 corpus entries | Fail |
| Inflected probe source coverage | 85% | 85% | Pass |
| Examples among resolved entries | 100% | 40% | Pass |
| Related words among resolved entries | 0% | 30% | Fail |
| Eligible offline candidate pack entries | 0 | 5,000 | Fail |
| Offline pack smoke | Not run | Required | Fail |

Failed source probes: `école`, `année`, `réponse`, `écrire`, `après`, `écoles`, `années`, and `écrit`.

## Decision

French remains **measured preview**. A reproducible 5,000-entry Kaikki candidate and candidate pack were built from source revision `2026-06-07`, but that `/dictionary/French/` dataset is English-Wiktionary-derived and uses English definitions. It proves packaging mechanics but is ineligible for French monolingual production and no longer counts toward corpus/pack gates. Hosted French WiktAPI coverage also remains below the exact threshold and exposes no related-word coverage. The next candidate must come from a revisioned French-definition edition/extraction.

```bash
node scripts/measure-language-corpus.mjs --lang fr --input data/headword-lists/french-promotion-100.txt
node scripts/extract-kaikki-candidate.mjs --lang fr --definition-lang en --limit 5000
# Rejected by the monolingual definition-language guard.
```
