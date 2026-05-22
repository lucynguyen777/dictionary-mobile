# Burmese Monolingual Baseline Plan

## Language Metadata
- **Code**: `my`
- **Display name**: မြန်မာဘာသာ (Burmese)
- **Family**: Sino-Tibetan (Lolo-Burmese)
- **Script**: Burmese script (derived from Brahmic scripts)
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Burmese dictionary lookup (MY→MY), focusing on script-specific word segmentation challenges and local mockups.

## Current Code Audit
- Status refreshed: May 22, 2026.
- Implemented in code: `my` is registered in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'my'`; `data/adapterRegistry.ts` dispatches to `fetchBurmeseMeaning` and `fetchBurmeseRelatedWords`.
- Fixture/runtime path: local Burmese fixtures and exact isolating-language lookup are wired through `data/localLexicon.ts`, `data/morphology.ts`, and `data/dictionaryApi.ts`.
- Remaining gate: broader Burmese production/bulk coverage and offline bundles still need accepted source/license terms.

## Orthography & Word Segmentation
- Written in the Burmese script, which features circular letters and uses no spaces between words. Spaces are used only for pauses or readability between clauses.
- **Intelligent Word Segmentation**:
  - Word tokenization in the Reader must use `Intl.Segmenter` with `locale: 'my'` to identify word boundaries before tap interaction.
  - Fallback logic: Syllable segmenter or character-by-character fallback if `Intl.Segmenter` is unavailable.

## Morphology & Grammar
- Burmese is an isolating language and lacks inflectional morphology:
  - No verb conjugations or noun declensions.
  - Grammar is expressed through particles/clitics appended to words (e.g., `-thi` for subject, `-ko` for object, `-hma` for locative).
- **Morphology Strategy**: Exact string matching maps directly to lemmas. No complex stemming rules are required.

## Data Source Candidates & Status
1. **Burmese Wiktionary (`mywiktionary`)**:
   - WiktAPI query `https://api.wiktapi.dev/v1/my/word/ကြောင်` returns limited/no meanings or 404.
2. **Offline Dictionaries & Local Fixtures**:
   - Local mock entries will be created for common words:
     - `စာအုပ်` (book)
     - `အိမ်` (house)
     - `ကြောင်` (cat)

## Implementation Plan
1. **Metadata Configuration**:
   - Register `my` in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'my'`.
2. **Reader Integration**:
   - Ensure the word segmenter (`Intl.Segmenter`) is updated to include `my` in the CJK/non-spaced script checks.
3. **Local Lexicon Fixtures (`data/localLexicon.ts`)**:
   - Add monolingual fixtures for `စာအုပ်`, `အိမ်`, and `ကြောင်`.
4. **Adapter Integration & Dispatch**:
   - Register the Burmese adapter in `data/adapterRegistry.ts` and dispatch to `fetchBurmeseMeaning` / `fetchBurmeseRelatedWords`.
5. **Unit Tests**:
   - Write tests under `tests/dictionaryApi.test.ts` to cover exact lookups and synonym/antonym fetching.
