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
