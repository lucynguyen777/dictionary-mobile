# Mandarin Monolingual Baseline Plan

## Language Metadata
- **Code**: `zh`
- **Display name**: Chinese (中文 / 汉语)
- **Family**: Sino-Tibetan
- **Script**: Hanzi (Simplified & Traditional)
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Mandarin Chinese dictionary lookup (ZH→ZH) and morphology baseline, focusing on character-based lookups, Traditional/Simplified variant normalization, and word segmentation.

## Script & Orthography (Hanzi)
- **No Word Spaces**: Chinese characters (Hanzi) are written continuously without spaces between words. 
- **Word Segmentation**:
  - The Reader tokenization system must use `Intl.Segmenter` (with `granularity: 'word'` and locale `zh`) if supported by the environment.
  - If `Intl.Segmenter` is not available, fall back to character-by-character tokenization.
- **Traditional vs. Simplified Variants**:
  - Users might search for Traditional characters (e.g., `書`, `貓`) or Simplified characters (e.g., `书`, `猫`).
  - Search lookup should check both variants to find dictionary entries. We will include a local fallback mapping for core test words.

## Morphology & Variant Fallbacks
Mandarin is an isolating (analytic) language with no inflectional morphology (no cases, genders, plural endings, or verb tenses). However, it has specific orthographic and syntactic challenges:
- **Variant Normalization**:
  - `书` <-> `書` (book)
  - `猫` <-> `貓` (cat)
  - `读` <-> `讀` (read)
- **Morphology Candidates Strategy**:
  - **Direct Lookup**: Primary query.
  - **Variant Lookup**: Convert Traditional characters to Simplified (or vice versa) for core lexicon terms.

## Data Source Candidates & Status
1. **Chinese Wiktionary (`zhwiktionary`)**:
   - High-quality, comprehensive CC BY-SA definitions.
   - Hosted WiktAPI query `https://api.wiktapi.dev/v1/zh/word/书` is unavailable (not supported in the main hosted edition list).
2. **Offline Community Dumps & Fixtures**:
   - Local mock entries will be created using open-licensed (CC BY-SA) definitions from English/Chinese Wiktionary dumps.
   - Core test cases will cover basic nouns (`书`/`書` - book, `猫`/`貓` - cat) and verbs (`读`/`讀` - to read).

## Implementation Plan
1. **Metadata Configuration**:
   - Register `zh` in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'zh'`.
2. **Morphology & Variant Rules (`data/morphology.ts`)**:
   - Implement `getMandarinMorphologyCandidates(input: string)`:
     - Traditional/Simplified basic variant fallback mapping.
3. **Local Lexicon Fixtures (`data/localLexicon.ts`)**:
   - Add monolingual fixtures for:
     - `书` / `書` (book)
     - `猫` / `貓` (cat)
     - `读` / `讀` (read)
4. **Adapter Integration & Dispatch**:
   - Hook up `fetchMandarinMeaning` and `fetchMandarinRelatedWords` in `data/dictionaryApi.ts` and register in `data/adapterRegistry.ts`.
5. **Unit Tests**:
   - Write unit tests under `tests/dictionaryApi.test.ts` to cover exact, Simplified, and Traditional variant lookups.
