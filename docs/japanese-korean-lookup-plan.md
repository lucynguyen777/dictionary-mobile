# Japanese And Korean Lookup Track Plan

## Scope
Plan Japanese and Korean monolingual lookup tracks before adding adapters. This is a source, segmentation, and UI/storage plan only; no production lookup code should be added until source and parser smoke tests pass.

## Current Implementation Status

- Japanese and Korean metadata, monolingual preview adapters, local attributed fixtures, morphology fallbacks, and focused tests are now implemented.
- Both remain preview-only because production corpus coverage, parser measurement, segmentation UI smoke, and offline packaging have not passed.
- Current Japanese promotion evidence and remaining boundaries are recorded in `docs/japanese-production-source-audit.md`.
- Current Korean promotion evidence and remaining boundaries are recorded in `docs/korean-production-source-audit.md`.

## Current Metadata
Source: `data/languages.ts`

- `ja`: 日本語, Japonic, kanji-kana, LTR, adapter key `ja`, monolingual preview.
- `ko`: 한국어, Koreanic, Hangul, LTR, adapter key `ko`, monolingual preview.

Both languages are usable as bounded previews but must not be promoted until a measured monolingual corpus and segmentation strategy are verified.

## Japanese Track

### Script And Normalization
- Mixed script: kanji, hiragana, katakana, Latin romaji, Arabic numerals, punctuation.
- Normalize to NFC and preserve native script display.
- Do not convert kanji/kana to romaji as the canonical stored headword.
- Kana search fallback can be planned later, but the first adapter should use source headwords/readings rather than local transliteration guesses.

### Segmentation
- Japanese does not use spaces between words, so whitespace splitting is insufficient.
- `Intl.Segmenter('ja-JP', { granularity: 'word' })` is a reasonable first web/runtime baseline where supported.
- For production-quality dictionary lookup, dictionary-backed tokenization or longest-prefix lookup may be needed because segmenter output can differ from dictionary headwords.

### Morphology
- Verbs/adjectives inflect heavily.
- Baseline should prefer source-provided lemma/headword and forms over local rules.
- Do not ship broad conjugation tables until a reliable source is accepted.

### Pronunciation And Romanization
- Prefer source-provided kana reading and audio/IPA if available.
- Pitch accent is useful but should be optional and source-backed.
- Romaji is a display/search aid, not canonical dictionary data.

### Source Strategy
Candidate sources:
- Kaikki/Wiktextract Japanese data for machine-readable entries.
- Kaikki/Wiktextract `jawiktionary` raw data is the preferred first JA->JA candidate because the raw dump page states glosses and metadata are in Japanese.
- WiktAPI if the target endpoint returns usable Japanese entries from a suitable Wiktionary edition.
- Japanese Wiktionary edition extracts for monolingual Japanese definitions, if coverage and extraction quality are acceptable.

Do not use English Wiktionary Japanese entries as the monolingual baseline if definitions are primarily English. That would be JA->EN, not JA->JA.

## Korean Track

### Script And Normalization
- Main script: Hangul syllable blocks.
- Hanja can appear for Sino-Korean words and should be optional metadata.
- Normalize to NFC and preserve Hangul display.
- Do not decompose jamo for storage unless a dedicated search fallback requires it.

### Segmentation
- Korean uses spaces, but spacing units (`eojeol`) can contain stems plus particles/endings.
- Whitespace tokenization can be a fallback for simple lookup, but particle/ending handling is required for useful Reader lookup.
- `Intl.Segmenter('ko-KR', { granularity: 'word' })` may help, but a Korean-aware morphology/tokenization strategy is still needed before claiming robust lookup.

### Morphology
- Nouns combine with particles.
- Verbs/adjectives carry endings for tense, politeness, speech level, mood, and connective forms.
- Baseline should avoid broad local conjugation guesses; prefer source-provided forms or a dedicated morphology dataset.

### Pronunciation And Romanization
- Hangul is phonemic enough for basic display, but pronunciation changes can occur through sound rules.
- Romanization should be explicit and source-backed if shown.
- Audio and IPA/phonetic fields should remain optional.

### Source Strategy
Candidate sources:
- Kaikki/Wiktextract Korean data for machine-readable entries.
- Kaikki/Wiktextract `kowiktionary` raw data is the preferred first KO->KO candidate because the raw dump page states glosses and metadata are in Korean.
- WiktAPI if the target endpoint returns usable Korean entries from a suitable Wiktionary edition.
- Korean Wiktionary edition extracts for monolingual Korean definitions, if extraction quality is acceptable.
- UniMorph or Korean-specific morphology datasets only for inflection/paradigm support, not definitions.
- NIKL data remains a separate candidate whose API/license/redistribution terms must be validated before integration.

Do not use machine translation or bilingual dictionary output to fake Korean monolingual definitions.

## Shared Implementation Gates
Before adding `ja` or `ko` adapter code:
1. Smoke test the candidate source endpoint for common headwords and confirm monolingual definitions.
2. Document source license/attribution requirements.
3. Confirm segmentation behavior on app-supported platforms.
4. Decide whether source data returns readings, romanization, audio, inflection forms, and part-of-speech tags.
5. Keep unsupported bilingual pairs guarded in `data/languages.ts` and `data/dictionaryApi.ts`.
6. Add tests for adapter registration, dispatch, unsupported bilingual routing, and source-missing behavior.

Current smoke evidence is tracked in `docs/japanese-korean-source-smoke.md`. WiktAPI returned 404 for tested Japanese/Korean common words, and Kaikki's indexed Japanese/Korean pages are based on English Wiktionary extraction. The newly identified `jawiktionary` and `kowiktionary` raw dumps are valid monolingual source candidates, but no adapter is unblocked until tiny fixture smoke proves the needed app fields.

## First Safe Production-Promotion Slice
After source/corpus measurement passes for one language:
- ingest only verified target-language rows with source attribution;
- keep bilingual pairs unsupported;
- preserve source-provided lemma/form-of/readings instead of broad local guesses;
- add segmentation UI smoke before offline packaging or production promotion.

## Blocked Items
- Production Japanese/Korean monolingual promotion remains blocked until measured corpus/parser and segmentation smoke tests pass.
- Production Japanese/Korean bilingual lookup remains blocked until trustworthy lexical bilingual sources are selected.
- Full Japanese pitch accent and Korean pronunciation rule support remain blocked until source-backed data is selected.
- Offline Japanese/Korean bundles remain blocked by `.docs/decisions/offline-dictionary-bundle.md`.

## Sources Checked
- WiktAPI overview: https://wiktapi.dev/
- Kaikki Japanese machine-readable dictionary: https://kaikki.org/dictionary/Japanese/index.html
- Kaikki Korean machine-readable dictionary: https://kaikki.org/dictionary/Korean/index.html
- Kaikki Japanese Wiktionary raw data: https://kaikki.org/jawiktionary/rawdata.html
- Kaikki Korean Wiktionary raw data: https://kaikki.org/kowiktionary/rawdata.html
- `Intl.Segmenter` reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter
