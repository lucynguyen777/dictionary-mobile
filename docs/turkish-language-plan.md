# Turkish Monolingual Baseline Plan

## Language
- Code: `tr`
- Name: Turkish
- Family: Turkic
- Script: Latin
- Writing direction: LTR
- Baseline target: `tr -> tr` monolingual lookup before any bilingual Turkish pair.

## Scope
This document tracks the implemented Turkish local-fixture preview and its remaining production promotion gates.

## Current Code Audit
- Status refreshed: June 12, 2026.
- Implemented in code: `tr` metadata, adapter routing, local `trwiktionary`-attributed fixtures, dotted/dotless-I normalization, case/plural morphology fallbacks, and focused lookup tests.
- Production source audit: `docs/turkish-production-source-audit.md` accepts Turkish-edition Wiktextract or native `tr.wiktionary.org` as the measured extraction path while keeping English-definition data helper-only.
- Remaining gate: production promotion needs a bounded extractor, balanced measurement, attributed corpus/offline pack, and UI smoke.

## Script And Normalization
- Turkish uses a Latin alphabet with dotted/dotless I contrast: `i`, `I`, `İ`, `ı`.
- Normalize text to NFC and preserve native casing.
- Search must not use English-only lowercasing rules. Turkish casing should be handled deliberately before any broad lookup normalization.

## Morphology
- Turkish is agglutinative and suffix-heavy.
- Nouns take plural, possessive, and case suffixes; verbs take tense/aspect/mood/person suffix chains.
- Vowel harmony affects many suffix forms, so local fallback morphology should not guess broad lemmas without tests.
- First adapter should prefer source headwords and source-provided forms where available.

## Pronunciation
- Turkish spelling is mostly regular, but pronunciation/audio/IPA should still be source-backed if displayed.
- Do not invent IPA locally for production lookup.

## Data Source Candidates
1. Kaikki/Wiktextract Turkish Wiktionary raw data (`trwiktionary`)
   - Candidate for Turkish-edition glosses and metadata.
   - Source smoke passed for `ev`, `ışık`, and `İstanbul`; `yemek` needs follow-up for clearly verbal usage.
2. Hosted WiktAPI Turkish edition
   - Candidate access layer if direct word endpoints return stable Turkish gloss records.
   - Smoke passed for simple direct lookups (`ev`, `yemek`) but failed for Turkish-specific casing examples (`ışık`, `İstanbul`).
3. UniMorph Turkish
   - Candidate for morphology/form support only.
   - Not a definition source.

## License Risks
- Wiktionary-derived data requires attribution and compatible use policy before committed fixtures or production integration.
- Offline/bundled Turkish data remains blocked until `.docs/decisions/offline-dictionary-bundle.md` and `.docs/decisions/dictionary-source-licensing.md` are accepted.

## Implementation Plan
1. Turkish metadata, adapter dispatch, tiny fixtures, and local morphology fallback: DONE.
2. Smoke source records for at least:
   - noun: `ev`
   - verb: `yemek`
   - dotted/dotless casing: `ışık`, `İstanbul`
3. Confirm fields: headword, part of speech, Turkish glosses, examples, pronunciation/IPA/audio if available, forms if available, and attribution.
4. Add adapter tests for monolingual lookup and missing-source behavior.
5. Keep Turkish bilingual lookup blocked until a trustworthy lexical bilingual source exists.

## Tests
- Turkish casing normalization tests exist in `tests/languageNormalization.test.ts` for dotted and dotless I.
- `data/languages.ts` metadata test after adding `tr`.
- `data/adapterRegistry.ts` dispatch test after adapter registration.
- Dictionary API parse tests for Turkish source records.
- Casing/normalization tests for dotted and dotless I.

## Blocked Decisions
- Production-scale promotion remains blocked until the native-definition corpus is measured and packaged.
- Committed fixtures or bundled data blocked until licensing/attribution policy is accepted.
- Offline Turkish bundle blocked by `.docs/decisions/offline-dictionary-bundle.md`.

## First Safe Task
Build a bounded Turkish-edition Wiktextract or native Wiktionary extractor, then run the balanced 100-headword measurement across casing, suffix chains, vowel harmony, consonant gradation, and verbs.

## Sources Checked
- Kaikki Turkish Wiktionary raw data: https://kaikki.org/trwiktionary/rawdata.html
- WiktAPI overview: https://wiktapi.dev/
- WiktAPI quickstart: https://wiktapi.dev/quickstart
- UniMorph project: https://unimorph.github.io/
