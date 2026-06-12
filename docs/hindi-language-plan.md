# Hindi Monolingual Baseline Plan

## Language
- Code: `hi`
- Display name: हिन्दी (Hindi)
- Family: Indo-European (Indo-Aryan)
- Script: Devanagari
- Writing direction: LTR
- Baseline target: `hi -> hi` monolingual lookup before any bilingual Hindi pair.

## Scope
This document tracks the implemented tiny curated Hindi baseline. The app now supports `hi -> hi` monolingual lookup from local `hiwiktionary`-attributed fixtures, while production-scale Hindi sources, transliteration search, and offline-pack expansion remain later gates.

## Current Code Audit
- Status refreshed: June 12, 2026.
- Current code status: `hi` is registered in `data/languages.ts` with `dictionaryStatus: 'monolingual'`, `adapterKey: 'hi'`, Indo-European family metadata, Devanagari script, and LTR writing direction.
- Adapter/API status: `data/adapterRegistry.ts` dispatches `hi` through `fetchHindiMeaning` and `fetchHindiRelatedWords`; `data/dictionaryApi.ts` enables Hindi monolingual lookup and related-word routing.
- Fixture status: `data/localLexicon.ts` includes a tiny curated Hindi fixture set for `घर`, `किताब`, `करना`, and `हिंदी`, with paraphrased local educational definitions and `hiwiktionary` attribution notes.
- Normalization/morphology status: `data/languageNormalization.ts` uses the Hindi locale; `data/localLexicon.ts` normalizes NFC, chandrabindu/anusvara display variants, and the narrow `हिन्दी`/`हिंदी` spelling variant; `data/morphology.ts` has conservative noun/postposition and fixture-backed verb fallbacks.
- Test status: `tests/dictionaryApi.test.ts`, `tests/adapterRegistry.test.ts`, and `tests/languageNormalization.test.ts` cover Hindi lookup, fallback, Devanagari-only baseline behavior, related words, adapter registration, and normalization.
- Source gate: DONE for tiny curated fixtures via Hindi Wiktionary MediaWiki pages under CC BY-SA 4.0.
- Production source audit: `docs/hindi-production-source-audit.md` accepts native `hi.wiktionary.org` as a bounded extraction/measurement candidate while keeping Latin transliteration and English-definition data outside canonical production lookup.
- Remaining gates: representative corpus measurement, Latin transliteration policy, IPA/audio expansion, and offline packs need separate modules.

## Script And Normalization
- Hindi uses Devanagari and has no upper/lower case distinction in the native script.
- Normalize text to NFC and use `hi-IN` locale lowercasing for consistency with the shared lookup pipeline.
- Preserve Devanagari characters. The first baseline does not transliterate Latin input such as `hindi` to `हिंदी`.
- Normalize chandrabindu (`ँ`) to anusvara (`ं`) for lookup keys, and keep the spelling-variant rule for `हिन्दी` -> `हिंदी` narrow until broader orthographic normalization is source-backed.

## Morphology
- Hindi nouns vary by gender, number, and case. The first baseline supports only conservative fixture-backed forms:
  - oblique/plural `-ों`, such as `घरों` -> `घर` and `किताबों` -> `किताब`;
  - postposition-attached forms, such as `किताबों को` -> `किताब`.
- Hindi verbs are highly inflected. The first baseline handles only common local forms for `करना`, such as `करता`, `करती`, `करते`, `किया`, and `की`.
- Broader lemmatization, compound verbs, honorific forms, and Latin transliteration remain later slices.

## Data Source Candidates
1. Hindi Wiktionary via MediaWiki API
   - Accepted for tiny curated fixtures under CC BY-SA 4.0.
   - Source smoke confirmed useful native Hindi material for `घर`, `किताब`, `करना`, and `हिंदी`.
2. WiktAPI Hindi edition
   - Still not viable for the runtime adapter; previous endpoint smoke returned 404 for Hindi edition lookups.
3. English Wiktionary Hindi entries
   - Useful for forms or bilingual glosses, but not enough for the monolingual-first Hindi baseline.
4. Production Hindi dictionaries or corpora
   - Need separate licensing and attribution review before runtime integration or bundled data use.

## Implementation Plan
Status: the tiny `hiwiktionary` fixture baseline is implemented.

1. Add `hi` language metadata and adapter routing: DONE.
2. Add curated `hiwiktionary` fixtures for noun, verb, and noun/adjective coverage: DONE.
3. Add Hindi normalization and Devanagari-only lookup boundaries: DONE.
4. Add conservative morphology fallbacks and related-word routing: DONE.
5. Update docs/progress and run verification: DONE.

## Tests
- Adapter registry coverage confirms `hi` is registered.
- Dictionary API tests cover exact entries for `घर`, `किताब`, `करना`, and `हिंदी`.
- Morphology tests cover `घरों`, `किताबों को`, `करता`, and `किया`.
- Normalization tests cover Hindi locale routing; API tests cover `हिन्दी` -> `हिंदी`.
- Missing-source tests reject Latin transliteration input such as `hindi`.

## Blocked Decisions
- Hindi bilingual lookup remains blocked until a trustworthy bilingual lexical source exists.
- Latin-to-Devanagari transliteration search should not ship until the supported romanization scope is defined.
- Additional committed fixtures or bundled data must follow `docs/source-attribution-packaging.md`.
- Offline Hindi bundles remain blocked by the offline dictionary pack attribution and production-source path.

## First Safe Follow-Up
Build a bounded native Hindi Wiktionary extractor and run the balanced 100-headword Devanagari/morphology measurement before considering transliteration search or production promotion.
