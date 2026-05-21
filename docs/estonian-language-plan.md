# Estonian Monolingual Baseline Plan

## Language
- Code: `et`
- Name: Estonian
- Family: Uralic
- Script: Latin
- Writing direction: LTR
- Baseline target: `et -> et` monolingual lookup before any bilingual Estonian pair.

## Scope
This is a planning and gate document only. Do not add Estonian metadata or adapter code until a true Estonian-definition source, fixture policy, and attribution requirements are accepted.

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
1. Estonian Wiktionary edition through WiktAPI
   - Needs to be checked if `et` edition is supported by WiktAPI.
2. Kaikki/Wiktextract Estonian entries from the English Wiktionary edition
   - Machine-readable Estonian entries are available under `https://kaikki.org/dictionary/Estonian/index.html`.
   - Useful for forms, IPA, examples, and EN glosses, but this is not an Estonian monolingual definition source.
3. Hosted WiktAPI English edition with `lang=et`
   - Useful as a morphology/form smoke path, not an `et -> et` baseline.
4. Sõnaveeb / EKI (Eesti Keele Instituut) API
   - The official dictionary of the Institute of the Estonian Language.
   - Candidate for Estonian definitions, synonyms, antonyms, examples, and related lexical fields.
   - Needs terms/API approval for production use.
5. UniMorph Estonian
   - Candidate for morphology/form support only.
   - Not a definition source.

## License Risks
- Wiktionary-derived data requires attribution and compatible use policy before committed fixtures or production integration.
- Sõnaveeb / EKI requires terms/API approval before relying on it for production lookup.
- Offline/bundled Estonian data remains blocked until `.docs/decisions/offline-dictionary-bundle.md` and `.docs/decisions/dictionary-source-licensing.md` are accepted.

## Implementation Plan
1. Select a true Estonian-definition source before adding `et` to language metadata.
2. Smoke source records for at least:
   - noun: `maja` (house)
   - verb: `sööma` (to eat)
   - diacritics: `öö` (night), `jää` (ice)
   - inflected lookup: `majas` (in the house)
3. Confirm fields: headword, part of speech, Estonian glosses, examples, pronunciation/IPA/audio if available, forms if available, and attribution.
4. Add adapter tests for monolingual lookup, inflected-form fallback, diacritic preservation, and missing-source behavior.
5. Keep Estonian bilingual lookup blocked until a trustworthy lexical bilingual source exists.

## Tests
- `data/languages.ts` metadata test after adding `et`.
- `data/adapterRegistry.ts` dispatch test after adapter registration.
- Dictionary API parse tests for Estonian source records.
- NFC/diacritic-preserving normalization tests for `ä`, `ö`, `ü`, `õ`, and composed/decomposed forms.
- Form lookup tests for source-provided case forms before any local suffix stripping.

## Blocked Decisions
- Production Estonian monolingual lookup remains blocked until a true Estonian-definition source is accepted.
- Committed fixtures or bundled data are blocked until licensing/attribution policy is accepted.
- Offline Estonian bundle is blocked by `.docs/decisions/offline-dictionary-bundle.md`.

## First Safe Task
Decide whether Sõnaveeb / EKI API terms or another Estonian-definition source can be used for production and fixture tests. Until then, only morphology planning and non-production source smoke are safe.