# Estonian Monolingual Baseline Plan

## Language
- Code: `et`
- Name: Estonian
- Family: Uralic
- Script: Latin
- Writing direction: LTR
- Baseline target: `et -> et` monolingual lookup before any bilingual Estonian pair.

## Scope
This is now an implementation-ready planning document for a tiny curated Estonian baseline. Do not add Estonian metadata or adapter code until the first `etwiktionary` fixture set and attribution metadata land with tests.

## Current Code Audit
- Status refreshed: May 22, 2026.
- Current code status: `et` is not registered in `data/languages.ts`, has no adapter in `data/adapterRegistry.ts`, and has no Estonian fixture set or dictionary API dispatch.
- Family context: Finnish and Hungarian are implemented tiny Uralic baselines; Estonian remains the next unblocked-planning/blocked-implementation slice in this family.
- Source gate: DONE for tiny curated fixtures via Estonian Wiktionary MediaWiki pages under CC BY-SA 4.0; see `docs/estonian-source-smoke.md`.
- Remaining gate: Sõnaveeb/Ekilex production API use needs API key handling and endpoint parser work before runtime integration.

## Script And Normalization
- Estonian uses the Latin alphabet with native letters `ä`, `ö`, `ü`, and `õ`.
- Normalize text to NFC and preserve diacritics. Do not strip `ä`/`ö`/`ü`/`õ` to ASCII for canonical lookup.
- Lowercasing can use normal locale-aware behavior, but search must keep diacritic-sensitive exact matching before any fuzzy fallback.

## Morphology
- Estonian is agglutinative and case-rich (14 cases).
- Nouns and adjectives need case and number awareness.
- Verbs need tense, mood, voice, person, participles, infinitives, and negative-form handling.
- Estonian has consonant gradation (astmevaheldus) which affects stems, but unlike Finnish and Hungarian, it does not have vowel harmony.
- First adapter should prefer source headwords and source-provided forms where available.

## Search Implications
- Reader lookup must not rely on whitespace alone because a single token can contain stem plus case suffixes.
- First production search should support exact headword lookup and source-provided inflected forms.
- Lemmatization or suffix stripping is a later slice unless backed by UniMorph or another accepted morphology source.

## Pronunciation
- Estonian spelling is relatively regular, but IPA/audio should still be source-backed if displayed.
- Do not generate IPA locally for production lookup.

## Data Source Candidates
1. Estonian Wiktionary via MediaWiki API
   - Accepted for tiny curated fixtures under CC BY-SA 4.0.
   - Source smoke found native Estonian definitions for `maja`, `jää`, `öö`, and useful verb material for `sööma`.
2. Estonian Wiktionary edition through WiktAPI
   - Not viable. WiktAPI editions do not list `et`, and direct Estonian search returned an empty result array.
3. Kaikki/Wiktextract Estonian entries from the English Wiktionary edition
   - Machine-readable Estonian entries are available under `https://kaikki.org/dictionary/Estonian/index.html`.
   - Useful for forms, IPA, examples, and EN glosses, but this is not an Estonian monolingual definition source.
4. Hosted WiktAPI English edition with `lang=et`
   - Useful as a morphology/form smoke path, not an `et -> et` baseline.
5. Sõnaveeb / EKI (Eesti Keele Instituut) API
   - The official dictionary of the Institute of the Estonian Language.
   - Candidate for Estonian definitions, synonyms, antonyms, examples, and related lexical fields.
   - Source smoke confirms Ekilex standard license is CC BY 4.0, but API integration needs an API key and parser work.
6. UniMorph Estonian
   - Candidate for morphology/form support only.
   - Not a definition source.

## License Risks
- Wiktionary-derived data requires attribution and compatible use policy before committed fixtures or production integration.
- Sõnaveeb / EKI requires API key handling before relying on it for production lookup.
- Offline/bundled Estonian data remains blocked until `.docs/decisions/offline-dictionary-bundle.md` and `.docs/decisions/dictionary-source-licensing.md` are accepted.

## Implementation Plan
Status: source gate is accepted for a tiny `etwiktionary` fixture baseline; implementation remains pending.

1. Select a true Estonian-definition source before adding `et` to language metadata: DONE for tiny curated `etwiktionary` fixtures.
2. Smoke source records for at least:
   - noun: `maja` (house)
   - verb: `sööma` (to eat)
   - diacritics: `öö` (night), `jää` (ice)
   - inflected lookup: `majas` (in the house)
3. Confirm fixture fields: headword, part of speech, Estonian glosses, examples if available, forms, source URL, revision id, and CC BY-SA 4.0 attribution.
4. Add adapter tests for monolingual lookup, inflected-form fallback, diacritic preservation, and missing-source behavior.
5. Keep Estonian bilingual lookup blocked until a trustworthy lexical bilingual source exists.

## Tests
- `data/languages.ts` metadata test after adding `et`.
- `data/adapterRegistry.ts` dispatch test after adapter registration.
- Dictionary API parse tests for Estonian source records.
- NFC/diacritic-preserving normalization tests for `ä`, `ö`, `ü`, `õ`, and composed/decomposed forms.
- Form lookup tests for source-provided case forms before any local suffix stripping.

## Blocked Decisions
- Production-scale Estonian monolingual lookup remains blocked until Sõnaveeb/Ekilex API key handling or a bulk source path is implemented.
- Additional committed fixtures or bundled data must follow `docs/source-attribution-packaging.md`.
- Offline Estonian bundle is blocked by `.docs/decisions/offline-dictionary-bundle.md`.

## First Safe Task
Implement a tiny `etwiktionary` fixture baseline for `et`, then defer Sõnaveeb/Ekilex production integration until API key handling is designed.
