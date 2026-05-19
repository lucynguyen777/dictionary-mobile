# Hungarian Monolingual Baseline Plan

## Language
- Code: `hu`
- Name: Hungarian (Magyar)
- Family: Uralic
- Script: Latin
- Writing direction: LTR
- Baseline target: `hu -> hu` monolingual lookup before any bilingual Hungarian pair.

## Scope
This is a planning and gate document only. Do not add Hungarian metadata or adapter code until source smoke, fixture policy, and attribution requirements are accepted.

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
1. Select a true Hungarian-definition source before adding `hu` to language metadata.
2. Smoke source records for at least:
   - noun: `ház` (house)
   - verb: `enni` (to eat)
   - diacritics: `erdő` (forest), `fű` (grass)
   - inflected lookup: `házban` (in the house), `eszem` (I eat [definite])
3. Confirm fields: headword, part of speech, Hungarian glosses, examples, pronunciation/IPA/audio if available, forms if available, and attribution.
4. Add adapter tests for monolingual lookup, inflected-form fallback, diacritic preservation, and missing-source behavior.
5. Keep Hungarian bilingual lookup blocked until a trustworthy lexical bilingual source exists.

## Tests
- `data/languages.ts` metadata test after adding `hu`.
- `data/adapterRegistry.ts` dispatch test after adapter registration.
- Dictionary API parse tests for Hungarian source records.
- NFC/diacritic-preserving normalization tests for Hungarian diacritics (`ő`, `ű`, etc.).
- Form lookup tests for source-provided case forms before any local suffix stripping.

## Blocked Decisions
- Production Hungarian monolingual lookup remains blocked until a true Hungarian-definition source is accepted.
- Committed fixtures or bundled data are blocked until licensing/attribution policy is accepted.
- Offline Hungarian bundle is blocked by `.docs/decisions/offline-dictionary-bundle.md`.

## First Safe Task
Decide whether a Hungarian monolingual definition source can be licensed for production and fixture tests. Until then, only morphology planning and non-production source smoke are safe.

## Sources Checked
- WiktAPI overview: https://wiktapi.dev/
- WiktAPI quickstart: https://wiktapi.dev/quickstart
- Kaikki English-edition Hungarian index: https://kaikki.org/dictionary/Hungarian/index.html
- Kaikki raw data downloads: https://kaikki.org/dictionary/rawdata.html
- UniMorph project: https://unimorph.github.io/
