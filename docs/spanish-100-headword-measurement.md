# Spanish 100-Headword Corpus Measurement

This report tracks the third API-preview production candidate after French and Malay. The bounded sample is committed at `data/headword-lists/spanish-promotion-100.txt` and includes accents, plural/gender forms, regular conjugations, and common irregular verbs.

Spanish remains **monolingual preview** until live WiktAPI and a revisioned Kaikki/Spanish-Wiktionary candidate pass every shared production gate. Accent marks remain semantically meaningful and must not be removed globally; fallback must be evidence-backed and narrow.

## Frozen Results

Measured on **2026-06-12**. Live WiktAPI resolved 84/100 probes, 90% of inflected probes, 60% examples among resolved entries, and 0% related words. Accent-bearing failures included `avión`, `niño`, `día`, `mañana`, `oír`, `pequeño`, `rápido`, `frío`, `fácil`, `difícil`, `débil`, `aquí`, and `allí`.

A revisioned Kaikki candidate (`2026-06-07`) produced a 5,000-entry candidate pack, but the first-5,000-row candidate contained only 38/100 representative probes, with examples on 19 and relations on 22. It proves packaging mechanics, not representative production coverage.

Spanish remains preview because exact/source coverage, live related words, representative candidate coverage, and offline runtime smoke are below production gates. A bounded irregular-verb fallback is implemented; global accent stripping remains intentionally rejected.

## Commands

```bash
node scripts/measure-language-corpus.mjs --lang es --input data/headword-lists/spanish-promotion-100.txt
node scripts/extract-kaikki-candidate.mjs --lang es --limit 5000 --source-url https://kaikki.org/dictionary/Spanish/kaikki.org-dictionary-Spanish.jsonl
node scripts/build-offline-pack.mjs --input tmp/language-candidates/es-kaikki-5000.jsonl --lang es --source kaikki-eswiktionary --source-url https://kaikki.org/dictionary/Spanish/ --source-revision 2026-06-07 --out tmp/offline-packs/es-kaikki-candidate
```
