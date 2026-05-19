# Yoruba Monolingual Baseline Plan

## Language Metadata
- **Code**: `yo`
- **Display name**: Èdè Yorùbá (Yoruba)
- **Family**: Niger-Congo (Defoid)
- **Script**: Latin script with extensive diacritics and tone marks
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Yoruba dictionary lookup (YO→YO), focusing on tone mark normalization, diacritic-safe search, and local fixtures.

## Diacritics & Tone-Insensitive Search
- **Yoruba Diacritics**:
  - Underdots: `ẹ`, `ọ`, `ṣ` (indicate open vowels/consonants).
  - Tone marks: acute accent `´` (high tone), grave accent ``` (low tone).
- **Search Normalization**:
  - Searching with or without tone marks must resolve to the correct lemma.
  - Normalization should strip tone marks (combining characters for acute/grave) but preserve underdots if possible, or fall back to a multi-stage match (first exact, then tone-insensitive, then diacritic-insensitive).
  - Tone-insensitive normalization function:
    ```typescript
    export function normalizeYorubaWord(value: string) {
      // Normalize to NFD, strip combining acute (U+0301) and grave (U+0300) accents, then normalize back to NFC
      return value
        .normalize('NFD')
        .replace(/[\u0300\u0301]/g, '')
        .normalize('NFC')
        .toLowerCase()
        .trim();
    }
    ```

## Orthography & Word Segmentation
- Yoruba uses Latin-based script with standard spacing. Standard space-based and regex-based tokenization in the Reader requires no extra scripts or libraries.

## Morphology & Grammar
- Yoruba words often feature vowel prefixes (e.g., `ì-` prefix for nominalization, `o-` or `a-` prefix).
- Compounding and reduplication are common.
- For the baseline, the lookup will try tone-insensitive exact match first. If unsuccessful, it can strip common nominalizing prefixes (like `ì-` or `a-`) to find the base verb.

## Data Source Candidates & Status
1. **Yoruba Wiktionary (`yowiktionary`)**:
   - Live query `https://api.wiktapi.dev/v1/yo/word/...` returns 404.
2. **Offline Dictionaries & Local Fixtures**:
   - Local mock entries will be created for common words:
     - `ìwé` (book)
     - `ilé` (house)
     - `ológbò` (cat)

## Implementation Plan
1. **Metadata Configuration**:
   - Register `yo` in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'yo'`.
2. **Local Lexicon Fixtures (`data/localLexicon.ts`)**:
   - Update `normalizeLookupTerm` or create `normalizeYorubaWord` to normalize tone marks.
   - Add monolingual fixtures for `ìwé`, `ilé`, and `ológbò`.
3. **Adapter Integration & Dispatch**:
   - Register the Yoruba adapter in `data/adapterRegistry.ts` and dispatch to `fetchYorubaMeaning` / `fetchYorubaRelatedWords` in `data/dictionaryApi.ts`.
4. **Unit Tests**:
   - Write tests under `tests/dictionaryApi.test.ts` to cover exact lookups, tone-insensitive lookups, and synonym/antonym fetching.
