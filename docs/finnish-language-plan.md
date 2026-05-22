# Finnish Monolingual Baseline Plan

## Language
- Code: `fi`
- Name: Finnish
- Family: Uralic
- Script: Latin
- Writing direction: LTR
- Baseline target: `fi -> fi` monolingual lookup before any bilingual Finnish pair.

## Scope
This document now tracks the implemented Finnish baseline and the remaining production source gates. Finnish metadata and a small local fixture adapter are implemented; broader production/bulk source expansion remains gated.

## Current Code Audit
- Status refreshed: May 22, 2026.
- Implemented in code: `fi` is registered in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'fi'`; `data/adapterRegistry.ts` dispatches to `fetchFinnishMeaning` and `fetchFinnishRelatedWords`.
- Fixture/runtime path: `data/localLexicon.ts` contains a tiny `fiwiktionary`-attributed Finnish fixture set; `data/morphology.ts` includes case/gradation and verb-form fallback candidates used by `data/dictionaryApi.ts`.
- Test coverage: `tests/dictionaryApi.test.ts` covers exact lookup, `talossa -> talo`, `syön -> syödä`, `kädessä -> käsi`, `yötä -> yö`, and related words.
- Remaining gate: Estonian is still the next Uralic blocker; Finnish only needs future production/bulk source approval and offline bundle packaging before expansion beyond curated fixtures.

## Script And Normalization
- Finnish uses the Latin alphabet with native letters `ä` and `ö`; `å` appears mostly in Swedish-origin names and loan contexts.
- Normalize text to NFC and preserve diacritics. Do not strip `ä`/`ö` to ASCII for canonical lookup.
- Lowercasing can use normal locale-aware behavior, but search must keep diacritic-sensitive exact matching before any fuzzy fallback.

## Morphology
- Finnish is agglutinative and case-rich.
- Nouns and adjectives need case, number, possessive suffix, and consonant-gradation awareness.
- Verbs need tense, mood, voice, person, participles, infinitives, and negative-form handling.
- Vowel harmony affects suffix choice, so local fallback morphology should not guess broad lemmas without fixtures.
- First adapter should prefer source headwords and source-provided forms where available.

## Search Implications
- Reader lookup must not rely on whitespace alone because a single token can contain stem plus case or possessive suffixes.
- First production search should support exact headword lookup and source-provided inflected forms.
- Lemmatization or suffix stripping is a later slice unless backed by UniMorph or another accepted morphology source.

## Pronunciation
- Finnish spelling is relatively regular, but IPA/audio should still be source-backed if displayed.
- Do not generate IPA locally for production lookup.

## Data Source Candidates
1. Finnish Wiktionary edition through WiktAPI
   - Not currently viable. `https://api.wiktapi.dev/v1/editions` does not list `fi`, and direct `fi` edition probes for `talo` and `syödä` returned 404.
2. Kaikki/Wiktextract Finnish entries from the English Wiktionary edition
   - Machine-readable Finnish entries are available under `https://kaikki.org/dictionary/Finnish/index.html`.
   - Useful for forms, IPA, examples, and EN glosses, but this is not a Finnish monolingual definition source.
3. Hosted WiktAPI English edition with `lang=fi`
   - `talo` returns detailed Finnish forms and English glosses from the English edition.
   - Useful as a morphology/form smoke path, not a `fi -> fi` baseline.
4. Suomi Sanakirja API
   - Candidate for Finnish definitions, synonyms, antonyms, examples, and related lexical fields.
   - Public page documents only the open word-of-the-day endpoint and says API-key access is required for broader dictionary integration, so production use needs terms/API approval.
5. UniMorph Finnish
   - Candidate for morphology/form support only.
   - Not a definition source.

## License Risks
- Wiktionary-derived data requires attribution and compatible use policy before committed fixtures or production integration.
- Suomi Sanakirja requires terms/API approval before relying on it for production lookup.
- Offline/bundled Finnish data remains blocked until `.docs/decisions/offline-dictionary-bundle.md` and `.docs/decisions/dictionary-source-licensing.md` are accepted.

## Implementation Plan
Status: first small baseline is implemented; production/bulk source expansion remains gated.

1. Metadata, adapter dispatch, tiny fixtures, and local morphology fallback: DONE.
2. Keep source-smoke records documented for future expansion:
   - noun: `talo`
   - verb: `syödä`
   - diacritics: `käsi`, `yö`
   - inflected lookup: `talossa`, `kädessä`
3. Confirm any future source fields: headword, part of speech, Finnish glosses, examples, pronunciation/IPA/audio if available, forms if available, and attribution.
4. Add adapter tests for each new production source parser or bulk fixture importer.
5. Keep Finnish bilingual lookup blocked until a trustworthy lexical bilingual source exists.

## Tests
- `data/languages.ts` metadata test after adding `fi`.
- `data/adapterRegistry.ts` dispatch test after adapter registration.
- Dictionary API parse tests for Finnish source records.
- NFC/diacritic-preserving normalization tests for `ä`, `ö`, and composed/decomposed forms.
- Form lookup tests for source-provided case forms before any local suffix stripping.

## Blocked Decisions
- Production-scale Finnish monolingual lookup remains blocked until a true Finnish-definition source or bulk fixture source is accepted.
- Additional committed fixtures or bundled data are blocked until licensing/attribution policy is accepted.
- Offline Finnish bundle is blocked by `.docs/decisions/offline-dictionary-bundle.md`.

## First Safe Task
Next safe task: decide whether Suomi Sanakirja API terms or another Finnish-definition source can be used for production/bulk fixtures. Code expansion should stay source-gated until then.

## Sources Checked
- WiktAPI overview: https://wiktapi.dev/
- WiktAPI quickstart: https://wiktapi.dev/quickstart
- Kaikki English-edition Finnish index: https://kaikki.org/dictionary/Finnish/index.html
- Kaikki raw data downloads: https://kaikki.org/dictionary/rawdata.html
- Suomi Sanakirja API: https://www.suomisanakirja.fi/api.php
- UniMorph project: https://unimorph.github.io/
