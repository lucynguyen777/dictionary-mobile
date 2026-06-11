# French 100-Headword Corpus Measurement

Measured on **2026-06-11** against `https://api.wiktapi.dev/v1/fr/word/{word}`.

The bounded sample is committed at `data/headword-lists/french-promotion-100.txt`. It contains nouns, verbs, adjectives, adverbs, function words, and 20 inflected probes. Detailed live responses remain ignored under `tmp/language-measurements/`.

## Frozen Results

| Metric | Result | Promotion threshold | Decision |
| --- | ---: | ---: | --- |
| Representative probes | 100 | 100 | Pass |
| Exact/source lookup | 92% | 95% | Fail |
| Attributed corpus candidate | 5,000 | 5,000 corpus entries | Pass |
| Inflected probe source coverage | 85% | 85% | Pass |
| Examples among resolved entries | 100% | 40% | Pass |
| Related words among resolved entries | 0% | 30% | Fail |
| Offline candidate pack entries | 5,000 | 5,000 | Pass |
| Offline pack smoke | Not run | Required | Fail |

Failed source probes: `école`, `année`, `réponse`, `écrire`, `après`, `écoles`, `années`, and `écrit`.

## Decision

French remains **measured preview**. A reproducible 5,000-entry Kaikki/French-Wiktionary candidate and candidate pack were built from source revision `2026-06-07`, but the bounded 100-headword sample found only 39/100 words inside the first-5,000-row candidate. This proves packaging mechanics, not representative production coverage. Hosted API coverage also remains below the exact threshold and exposes no related-word coverage in the original measurement. Do not publish the candidate until a frequency/headword-aware extraction passes exact, related-word, import/delete/lookup, and UI smoke.

```bash
node scripts/measure-language-corpus.mjs --lang fr --input data/headword-lists/french-promotion-100.txt
node scripts/extract-kaikki-candidate.mjs --lang fr --limit 5000
node scripts/build-offline-pack.mjs --input tmp/language-candidates/fr-kaikki-5000.jsonl --lang fr --source kaikki-frwiktionary --source-url https://kaikki.org/dictionary/French/ --source-revision 2026-06-07 --out tmp/offline-packs/fr-kaikki-candidate
```
