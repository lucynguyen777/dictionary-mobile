# Hungarian Monolingual Baseline Plan

## Language
- Code: `hu`
- Name: Hungarian (Magyar)
- Family: Uralic
- Script: Latin
- Writing direction: LTR
- Baseline target: `hu -> hu` monolingual lookup before any bilingual Hungarian pair.

## Scope
This document now tracks the implemented Hungarian baseline and the remaining production source gates. Hungarian metadata and a small local fixture adapter are implemented; broader production/bulk source expansion remains gated.

## Current Code Audit
- Status refreshed: June 12, 2026.
- Implemented in code: `hu` is registered in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'hu'`; `data/adapterRegistry.ts` dispatches to `fetchHungarianMeaning` and `fetchHungarianRelatedWords`.
- Fixture/runtime path: `data/localLexicon.ts` contains a tiny `huwiktionary`-attributed Hungarian fixture set; `data/morphology.ts` includes NFC/locale-safe plural, case-chain, vowel-harmony, and verb fallback candidates used by `data/dictionaryApi.ts`.
- Test coverage: `tests/dictionaryApi.test.ts` covers exact lookup, plural fallback, case fallback, `erdőben -> erdő`, `eszem/eszik -> enni`, and related words.
- Production source audit: `docs/hungarian-production-source-audit.md` accepts native `hu.wiktionary.org` as a strong extraction/measurement candidate while keeping English-definition Kaikki data helper-only.
- Remaining gate: production promotion needs a native extractor, balanced measurement, attributed corpus/offline pack, and UI smoke.

## Script And Normalization
- Hungarian uses the Latin alphabet with 9 additional letters containing diacritics: `á`, `é`, `í`, `ó`, `ö`, `ő`, `ú`, `ü`, `ű`.
- Note especially the double acute accents on `ő` and `ű` (unique to Hungarian).
- Normalize all text to NFC and preserve diacritics. Do not strip diacritics to ASCII for canonical lookup.
- Search must keep diacritic-sensitive exact matching before any fuzzy fallback.

## Morphology
- Hungarian is highly agglutinative and suffix-heavy.
- Nouns declension: Nouns take case suffixes (up to 18 cases, e.g., inessive `-ban`/`-ben`, illative `-ba`/`-be`, elative `-ból`/`-ből`), plural suffixes (`-k`), and possessive suffixes (e.g., `-am`/`-em`/`-om`/`-öm`).
- Verbs conjugation: Verbs conjugate for tense, mood, person, number, and definiteness (definite vs. indefinite conjugation, e.g., *látok* "I see [something]" vs. *látom* "I see [it]").
- Vowel harmony is extremely strong: Suffixes have front/back variants (e.g., `-ban` vs `-ben`) based on root vowels (back vowels: `a`, `á`, `o`, `ó`, `u`, `ú`; front unrounded: `e`, `é`, `i`, `í`; front rounded: `ö`, `ő`, `ü`, `ű`).
- First adapter should prefer source-provided headwords and inflected forms over local suffix-guessing rules.

## Search Implications
- Reader lookup must not rely on whitespace alone because a single word token can contain stem plus multiple case and possessive suffixes.
- First production search should support exact headword lookup and source-provided inflected forms.
- Suffix stripping is a later slice unless backed by UniMorph or another accepted morphology source.

## Pronunciation
- Hungarian spelling is mostly phonemic, but pronunciation/IPA/audio should still be source-backed if displayed.
- Do not generate IPA locally for production lookup.

## Data Source Candidates
1. Hungarian Wiktionary edition through WiktAPI
   - Not currently viable. `https://api.wiktapi.dev/v1/editions` does not list `hu`, and direct `hu` edition probes for `ház` returned 404.
2. Kaikki/Wiktextract Hungarian entries from the English Wiktionary edition
   - Machine-readable Hungarian entries are available under `https://kaikki.org/dictionary/Hungarian/index.html`.
   - Useful for forms, IPA, examples, and English glosses, but does not provide monolingual Hungarian definitions.
3. Hosted WiktAPI English edition with `lang=hu`
   - Direct query for `kutya` (dog) returns detailed Hungarian definitions, synonyms, IPA, and full declension forms.
   - Useful as a morphology/form smoke path, but definitions are in English.
4. Open Hungarian dictionary projects (e.g., SZTAKI or others)
   - Requires licensing and API review before integration.
5. UniMorph Hungarian
   - Candidate for morphology/form support only.
   - Not a definition source.

## License Risks
- Wiktionary-derived data requires attribution and compatible use policy before committed fixtures or production integration.
- Offline/bundled Hungarian data remains blocked until `.docs/decisions/offline-dictionary-bundle.md` and `.docs/decisions/dictionary-source-licensing.md` are accepted.

## Implementation Plan
Status: first small baseline is implemented; production/bulk source expansion remains gated.

1. Metadata, adapter dispatch, tiny fixtures, and local morphology fallback: DONE.
2. Keep source-smoke records documented for future expansion:
   - noun: `ház` (house)
   - verb: `enni` (to eat)
   - diacritics: `erdő` (forest), `fű` (grass)
   - inflected lookup: `házban` (in the house), `eszem` (I eat [definite])
3. Confirm any future source fields: headword, part of speech, Hungarian glosses, examples, pronunciation/IPA/audio if available, forms if available, and attribution.
4. Add adapter tests for each new production source parser or bulk fixture importer.
5. Keep Hungarian bilingual lookup blocked until a trustworthy lexical bilingual source exists.

## Tests
- `data/languages.ts` metadata test after adding `hu`.
- `data/adapterRegistry.ts` dispatch test after adapter registration.
- Dictionary API parse tests for Hungarian source records.
- NFC/diacritic-preserving normalization tests for Hungarian diacritics (`ő`, `ű`, etc.).
- Form lookup tests for source-provided case forms before any local suffix stripping.

## Blocked Decisions
- Production-scale Hungarian monolingual lookup remains blocked until a true Hungarian-definition source or bulk fixture source is accepted.
- Additional committed fixtures or bundled data are blocked until licensing/attribution policy is accepted.
- Offline Hungarian bundle is blocked by `.docs/decisions/offline-dictionary-bundle.md`.

## First Safe Task
Build a bounded native Hungarian Wiktionary extractor, then run the balanced 100-headword measurement across case chains, vowel harmony, vowel length, and source-provided forms.

## Sources Checked
- WiktAPI overview: https://wiktapi.dev/
- WiktAPI quickstart: https://wiktapi.dev/quickstart
- Kaikki English-edition Hungarian index: https://kaikki.org/dictionary/Hungarian/index.html
- Kaikki raw data downloads: https://kaikki.org/dictionary/rawdata.html
- UniMorph project: https://unimorph.github.io/
