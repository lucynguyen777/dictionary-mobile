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

## Update 2026-10-11: French-definition source (frwiktionary)

The source the decision above asked for now exists: Kaikki publishes a Wiktextract extraction of **French Wiktionary** (`https://kaikki.org/frwiktionary/Français/kaikki.org-dictionary-Français.jsonl`, dump dated 2026-10-01, extracted 2026-10-02, CC BY-SA 4.0/GFDL) with French definitions. It was measured in one streaming pass with `scripts/measure-kaikki-dump.mjs` (the dump is not stored):

| Metric | Result | Threshold | Decision |
| --- | ---: | ---: | --- |
| Representative probes found (exact headword) | 100/100 | 95% | Pass |
| Inflected probes (as headword or listed form) | 20/20 | 85% | Pass |
| Examples among probe entries | 100% | 40% | Pass |
| Related words among probe entries | 71% | 30% | Pass |
| Attributed corpus | 495,763 lemmas (1,934,989 headwords incl. inflected-form pages) | 5,000 | Pass |
| Examples / related words across all lemmas | 50.5% / 16.2% | — | Informational |
| Offline pack smoke | Candidate pack builds (5,000 source lines → 2,799 merged headwords, 95% examples, 56% related words, 96% playable audio) | Import/delete/lookup smoke | Pending hosting |
| Word/Reader/Library UI smoke | Not run | Required | Pending |

The earlier hosted-WiktAPI failures (`école`, `année`, …) no longer reproduce: a re-run on 2026-10-11 gave 100% exact and 100% morphology, so they were transient source errors, not an app encoding bug. The hosted API still exposes no synonyms, so related words must come from the pack.

French stays **preview** until a pack scope and host are chosen (owner decision D9 in `docs/completion-plan.md`) and the pack import and UI smokes pass.

```bash
node scripts/measure-kaikki-dump.mjs --lang fr --probes data/headword-lists/french-promotion-100.txt \
  --url 'https://kaikki.org/frwiktionary/Fran%C3%A7ais/kaikki.org-dictionary-Fran%C3%A7ais.jsonl'
node scripts/extract-kaikki-candidate.mjs --lang fr --definition-lang fr --limit 5000 \
  --source-url 'https://kaikki.org/frwiktionary/Fran%C3%A7ais/kaikki.org-dictionary-Fran%C3%A7ais.jsonl'
```

### Pack and UI smoke (2026-10-11)

- `tests/offlinePackProbeSmoke.test.ts`: a probe-scoped pack built from this dump (216 merged entries, `tests/fixtures/offline-packs/fr-probe-smoke/`) goes through the app's own validation, SQLite import (FTS5 schema on `node:sqlite`), lookup of all promotion probes (≥95% headwords, ≥85% inflected, every hit carries licence + attribution) and pack deletion. Passes.
- `e2e/language-preview-smoke.spec.js`: Word screen on Expo web with a recorded wiktapi.dev response shows the Wiktionary meaning, and the word can be favourited and found in Library. Passes. It caught and fixed: a placeholder "word" part-of-speech heading, French `\\…\\` IPA, and audio picked as a bare file name.
- Still open: the same pack import on a native device build, and choosing the production pack scope and host (D9).
