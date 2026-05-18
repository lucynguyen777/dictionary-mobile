# Finnish Monolingual Baseline Plan

## Language
- Code: `fi`
- Name: Finnish
- Family: Uralic
- Script: Latin
- Writing direction: LTR
- Baseline target: `fi -> fi` monolingual lookup before any bilingual Finnish pair.

## Scope
This is a planning and gate document only. Do not add Finnish metadata or adapter code until a true Finnish-definition source, fixture policy, and attribution requirements are accepted.

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
1. Select a true Finnish-definition source before adding `fi` to language metadata.
2. Smoke source records for at least:
   - noun: `talo`
   - verb: `syödä`
   - diacritics: `käsi`, `yö`
   - inflected lookup: `talossa`, `kädessä`
3. Confirm fields: headword, part of speech, Finnish glosses, examples, pronunciation/IPA/audio if available, forms if available, and attribution.
4. Add adapter tests for monolingual lookup, inflected-form fallback, diacritic preservation, and missing-source behavior.
5. Keep Finnish bilingual lookup blocked until a trustworthy lexical bilingual source exists.

## Tests
- `data/languages.ts` metadata test after adding `fi`.
- `data/adapterRegistry.ts` dispatch test after adapter registration.
- Dictionary API parse tests for Finnish source records.
- NFC/diacritic-preserving normalization tests for `ä`, `ö`, and composed/decomposed forms.
- Form lookup tests for source-provided case forms before any local suffix stripping.

## Blocked Decisions
- Production Finnish monolingual lookup remains blocked until a true Finnish-definition source is accepted.
- Committed fixtures or bundled data are blocked until licensing/attribution policy is accepted.
- Offline Finnish bundle is blocked by `.docs/decisions/offline-dictionary-bundle.md`.

## First Safe Task
Decide whether Suomi Sanakirja API terms or another Finnish-definition source can be used for production and fixture tests. Until then, only morphology planning and non-production source smoke are safe.

## Sources Checked
- WiktAPI overview: https://wiktapi.dev/
- WiktAPI quickstart: https://wiktapi.dev/quickstart
- Kaikki English-edition Finnish index: https://kaikki.org/dictionary/Finnish/index.html
- Kaikki raw data downloads: https://kaikki.org/dictionary/rawdata.html
- Suomi Sanakirja API: https://www.suomisanakirja.fi/api.php
- UniMorph project: https://unimorph.github.io/
