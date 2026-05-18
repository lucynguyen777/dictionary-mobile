# Arabic And Hebrew RTL Baseline Plan

## Scope
Plan Arabic and Hebrew monolingual lookup tracks before adding adapters or language metadata. This is a source, RTL UI/search, morphology, and fixture-gate document only.

Do not add `ar` or `he` adapters until a true monolingual source, RTL UI behavior, and licensing/attribution path are accepted.

## Current Metadata
Source: `data/languages.ts`

- Arabic is not registered.
- Hebrew is not registered.
- Current registered languages are all `writingDirection: 'ltr'`, so RTL display must be verified before exposing Arabic or Hebrew as app languages.

## Shared RTL Requirements
- Store canonical headwords in native script and NFC normalization.
- UI surfaces that render dictionary entries must support `writingDirection: 'rtl'` without reversing Latin UI chrome, numbers, IPA, source labels, or mixed-script examples.
- Search inputs must preserve Arabic/Hebrew text direction while still handling mixed Latin query text.
- Reader tap-token lookup needs script-aware token boundaries; whitespace alone is not enough for clitics/prefixes/suffixes.
- Do not strip diacritics for canonical lookup. Diacritic-insensitive fallback can be a later search feature after exact matching.

## Arabic Track

### Script And Normalization
- Script: Arabic abjad, RTL.
- Short vowels and many pronunciation marks are optional in normal text.
- Normalize Arabic presentation forms to standard code points before lookup if source data requires it.
- Preserve hamza, alif variants, ta marbuta, alef maqsurah, shadda, and vowel marks until an explicit search-normalization rule exists.

### Morphology
- Root-pattern morphology is central; local stem guessing is risky.
- Definite article `ال`, conjunctions, prepositions, object pronouns, and other clitics can attach to tokens.
- Baseline should prefer source-provided lemmas/forms over local root extraction.

### Source Candidates
1. Kaikki/Wiktextract Arabic entries from English Wiktionary
   - `https://kaikki.org/dictionary/Arabic/index.html` exists and exposes postprocessed JSONL.
   - The page states it is extracted from `enwiktionary`, so glosses are not an Arabic monolingual baseline.
   - Useful for forms, transliteration, IPA/audio if present, and morphology smoke only.
2. Hosted WiktAPI English edition with `lang=ar`
   - Search returns Arabic candidates for `كتاب`.
   - Direct word lookup for `كتاب` and `كتب` returned 404 in smoke.
   - Search can be a suggestion helper but is not enough for production lookup.
3. Arabic Wiktionary edition raw data
   - `https://kaikki.org/arwiktionary/rawdata.html` returned 404 in smoke.
   - Not a current viable monolingual source path through Kaikki.
4. Dedicated Arabic lexicon source
   - Needed for production-quality AR->AR definitions, roots, derived forms, and diacritics.
   - Must be reviewed for license and attribution before fixtures or adapters.

## Hebrew Track

### Script And Normalization
- Script: Hebrew abjad, RTL.
- Niqqud is optional in normal text.
- Preserve final-letter forms, matres lectionis, dagesh/niqqud, and geresh/gershayim until explicit search-normalization rules exist.

### Morphology
- Root-pattern morphology and binyanim affect verbs.
- Prefixes, prepositions, conjunctions, definite article, and pronominal suffixes can attach to tokens.
- Baseline should prefer source-provided lemma/form data and avoid local root extraction in the first adapter.

### Source Candidates
1. Kaikki/Wiktextract Hebrew entries from English Wiktionary
   - `https://kaikki.org/dictionary/Hebrew/index.html` exists and exposes postprocessed JSONL.
   - The page states it is extracted from `enwiktionary`, so glosses are not a Hebrew monolingual baseline.
   - Useful for forms, transliteration, IPA/audio if present, and morphology smoke only.
2. Hosted WiktAPI English edition with `lang=he`
   - Search returns Hebrew candidates for `ספר`.
   - Direct word lookup for `ספר` returned 404 in smoke.
   - Search can be a suggestion helper but is not enough for production lookup.
3. Hebrew Wiktionary edition raw data
   - `https://kaikki.org/hewiktionary/rawdata.html` returned 404 in smoke.
   - Not a current viable monolingual source path through Kaikki.
4. Dedicated Hebrew lexicon source
   - Needed for production-quality HE->HE definitions, roots, binyanim, and vowel/niqqud behavior.
   - Must be reviewed for license and attribution before fixtures or adapters.

## Smoke Tests
Run on May 18, 2026.

| Source | Query | Result | Decision |
|--------|-------|--------|----------|
| WiktAPI editions | `curl https://api.wiktapi.dev/v1/editions` | Editions list does not include `ar` or `he`. | No hosted Arabic/Hebrew monolingual edition available through WiktAPI. |
| WiktAPI English search | `كتاب`, `lang=ar` | Search returns Arabic candidates including `كتاب`. | Search can support suggestions only. |
| WiktAPI English direct word | `كتاب`, `كتب`, `lang=ar` | Direct word endpoints returned 404. | Not viable for production lookup. |
| WiktAPI English search | `ספר`, `lang=he` | Search returns Hebrew candidates including noun/verb `ספר`. | Search can support suggestions only. |
| WiktAPI English direct word | `ספר`, `lang=he` | Direct word endpoint returned 404. | Not viable for production lookup. |
| Kaikki Arabic English-edition index | `https://kaikki.org/dictionary/Arabic/index.html` | Page exists; download is based on `enwiktionary`. | Useful for morphology smoke, not AR->AR definitions. |
| Kaikki Hebrew English-edition index | `https://kaikki.org/dictionary/Hebrew/index.html` | Page exists; download is based on `enwiktionary`. | Useful for morphology smoke, not HE->HE definitions. |
| Kaikki Arabic edition raw page | `https://kaikki.org/arwiktionary/rawdata.html` | HTTP 404. | No AR edition raw path found. |
| Kaikki Hebrew edition raw page | `https://kaikki.org/hewiktionary/rawdata.html` | HTTP 404. | No HE edition raw path found. |

## Implementation Gates
Before adding `ar` or `he` adapter code:
1. Select a true Arabic/Hebrew-definition source and document license/attribution.
2. Add RTL UI smoke fixtures for dictionary result cards, search inputs, Reader token lookup, saved-word rows, and mixed Latin/native text.
3. Confirm exact lookup, diacritic-preserving lookup, and source-provided form lookup.
4. Add metadata with `writingDirection: 'rtl'` only after UI surfaces are verified.
5. Add adapter tests for registration, unsupported bilingual routing, source-missing behavior, and script normalization.
6. Keep bilingual Arabic/Hebrew lookup blocked until trustworthy lexical bilingual sources are selected.

## Blocked Decisions
- Production Arabic monolingual lookup is blocked until an AR->AR source is accepted.
- Production Hebrew monolingual lookup is blocked until an HE->HE source is accepted.
- Committed fixtures or bundled data are blocked until licensing/attribution policy is accepted.
- Offline Arabic/Hebrew bundles are blocked by `.docs/decisions/offline-dictionary-bundle.md`.

## First Safe Task
Add RTL UI smoke coverage with static local sample strings before source adapter work. This can verify layout direction, mixed-script rendering, and Reader token behavior without committing dictionary data.

## Sources Checked
- WiktAPI overview: https://wiktapi.dev/
- WiktAPI quickstart: https://wiktapi.dev/quickstart
- Kaikki Arabic English-edition index: https://kaikki.org/dictionary/Arabic/index.html
- Kaikki Hebrew English-edition index: https://kaikki.org/dictionary/Hebrew/index.html
- Kaikki raw data downloads: https://kaikki.org/dictionary/rawdata.html
