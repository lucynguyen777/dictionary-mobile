# Spanish 100-Headword Corpus Measurement

This report tracks the third API-preview production candidate after French and Malay. The bounded sample is committed at `data/headword-lists/spanish-promotion-100.txt` and includes accents, plural/gender forms, regular conjugations, and common irregular verbs.

Spanish remains **monolingual preview** until live WiktAPI and a revisioned Kaikki/Spanish-Wiktionary candidate pass every shared production gate. Accent marks remain semantically meaningful and must not be removed globally; fallback must be evidence-backed and narrow.

## Frozen Results

Measured on **2026-06-12**. Live WiktAPI resolved 84/100 probes, 90% of inflected probes, 60% examples among resolved entries, and 0% related words. Accent-bearing failures included `avión`, `niño`, `día`, `mañana`, `oír`, `pequeño`, `rápido`, `frío`, `fácil`, `difícil`, `débil`, `aquí`, and `allí`.

A revisioned Kaikki packaging candidate (`2026-06-07`) contained only 38/100 representative probes. More importantly, it is English-Wiktionary-derived with English definitions and is ineligible for Spanish monolingual production.

Spanish remains preview because exact/source coverage, live related words, an eligible Spanish-definition corpus, and offline runtime smoke are below production gates. A bounded irregular-verb fallback is implemented; global accent stripping remains intentionally rejected.

## Commands

```bash
node scripts/measure-language-corpus.mjs --lang es --input data/headword-lists/spanish-promotion-100.txt
node scripts/extract-kaikki-candidate.mjs --lang es --definition-lang en --limit 5000 --source-url https://kaikki.org/dictionary/Spanish/kaikki.org-dictionary-Spanish.jsonl
# Rejected by the monolingual definition-language guard.
```

## Update 2026-10-11: Spanish Wiktionary (eswiktionary) extraction

Measured in one streaming pass over Kaikki's Wiktextract extraction of **Spanish Wiktionary** (`https://kaikki.org/eswiktionary/Español/kaikki.org-dictionary-Español.jsonl`, published 2026-10-02, CC BY-SA 4.0/GFDL, Spanish definitions) with `scripts/measure-kaikki-dump.mjs`:

| Metric | Result | Threshold | Decision |
| --- | ---: | ---: | --- |
| Probes found (exact headword) | 100/100 | 95% | Pass |
| Examples among probe entries | 56% | 40% | Pass |
| Related words among probe entries | 74% | 30% | Pass |
| Attributed corpus | 136,522 lemmas (833,181 headwords incl. inflected-form pages) | 5,000 | Pass |
| Offline pack and UI smoke | Not run | Required | Pending pack scope/host (D9) |

Spanish source gates pass; promotion waits on the pack decision (D9) and the pack/UI smokes.

```bash
node scripts/measure-kaikki-dump.mjs --lang es --probes data/headword-lists/spanish-promotion-100.txt \\
  --url 'https://kaikki.org/eswiktionary/Espa%C3%B1ol/kaikki.org-dictionary-Espa%C3%B1ol.jsonl'
```

### Pack and UI smoke (2026-10-11)

- `tests/offlinePackProbeSmoke.test.ts`: a probe-scoped pack built from this dump (126 merged entries, `tests/fixtures/offline-packs/es-probe-smoke/`) goes through the app's own validation, SQLite import (FTS5 schema on `node:sqlite`), lookup of all promotion probes (≥95% headwords, ≥85% inflected, every hit carries licence + attribution) and pack deletion. Passes.
- `e2e/language-preview-smoke.spec.js`: Word screen on Expo web with a recorded wiktapi.dev response shows the Wiktionary meaning, and the word can be favourited and found in Library. Passes. It caught and fixed: a placeholder "word" part-of-speech heading, French `\\…\\` IPA, and audio picked as a bare file name.
- Still open: the same pack import on a native device build, and choosing the production pack scope and host (D9).
