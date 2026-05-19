# Tibetan Monolingual Baseline Plan

## Language Metadata
- **Code**: `bo`
- **Display name**: བོད་སྐད་ (Tibetan)
- **Family**: Sino-Tibetan (Tibeto-Burman)
- **Script**: Tibetan script (Indic origin abugida)
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Tibetan dictionary lookup (BO→BO), focusing on script-specific word segmentation challenges and local mockups.

## Orthography & Word Segmentation
- Tibetan syllables are separated by a small dot called `tsheg` (`་`, Unicode `\u0F0B`).
- Words are composed of one or more syllables, but there are no spaces between words. Spaces are only used to demarcate verses/sentences (along with the vertical line `shad` `།`, Unicode `\u0F0D`).
- **Intelligent Word Segmentation**:
  - Word tokenization in the Reader must use `Intl.Segmenter` with `locale: 'bo'` if available.
  - Fallback logic: Syllable segmenter using `tsheg` boundaries if `Intl.Segmenter` is unavailable, or character-by-character fallback.

## Morphology & Grammar
- Grammatical cases are represented by suffix-clitics (particles) attached to noun phrases (e.g., `-kyi` / `-gyi` / `-gyi` for genitive, `-la` for locative, `-kyis` for ergative).
- Verbs can change form based on tense (present, past, future, imperative).
- **Morphology Strategy**: Exact string matching maps directly to lemmas. Grammatical particles are stripped or handled as separate tokens. No complex stemming rules are required for the initial baseline.

## Data Source Candidates & Status
1. **Tibetan Wiktionary (`bowiktionary`)**:
   - Live query `https://api.wiktapi.dev/v1/bo/word/...` returns 404.
2. **Offline Dictionaries & Local Fixtures**:
   - Local mock entries will be created for common words:
     - `དེབ་` (book)
     - `ཁང་པ་` (house)
     - `ཞီမီ` (cat)

## Implementation Plan
1. **Metadata Configuration**:
   - Register `bo` in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'bo'`.
2. **Reader Integration**:
   - Update the word segmenter (`Intl.Segmenter` and the regex fallback) in `app/reader.tsx` to include the Tibetan Unicode range `\u0F00-\u0FFF`.
3. **Local Lexicon Fixtures (`data/localLexicon.ts`)**:
   - Add monolingual fixtures for `དེབ་`, `ཁང་པ་`, and `ཞီမီ`.
4. **Adapter Integration & Dispatch**:
   - Register the Tibetan adapter in `data/adapterRegistry.ts` and dispatch to `fetchTibetanMeaning` / `fetchTibetanRelatedWords`.
5. **Unit Tests**:
   - Write tests under `tests/dictionaryApi.test.ts` to cover exact lookups and synonym/antonym fetching.
