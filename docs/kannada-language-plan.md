# Kannada Monolingual Baseline Plan

## Current Implementation Status

- **State**: Implemented monolingual preview.
- **Evidence**: Kannada metadata, adapter routing, local fixtures, Reader script support, suffix fallbacks, and lookup tests are present.
- **Production gap**: Corpus coverage, Kannada-section parser precision, glide/sandhi evidence, and offline packaging are not measured.
- **Current production-source audit**: `docs/kannada-production-source-audit.md`.

## Language Metadata
- **Code**: `kn`
- **Display name**: ಕನ್ನಡ (Kannada)
- **Family**: Dravidian (South)
- **Script**: Kannada script (abugida, `\u0C80-\u0CFF`)
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Kannada dictionary lookup (KN→KN), focusing on script-specific characteristics, agglutinative morphology candidates, and local fixtures.

## Script & Word Tokenization
- **Kannada Unicode block**: `\u0C80-\u0CFF`
- **Segmentation**: Kannada words are space-separated. The Reader tokenizer should group consecutive Kannada characters as a single word token.
- **Regex Fallback**:
  Add `|[\u0C80-\u0CFF]+` to the fallback regex inside `tokenizeReaderText` in `app/reader.tsx`.
- **Word Identifier**:
  Add `\u0C80-\u0CFF` to the `isWord` regex character class.

## Morphology & Agglutinative Fallbacks
- Kannada uses nominal suffix declensions and verbal agglutination.
- **Common Suffixes to Strip / Handle**:
  - Plural marker: `ಗಳು` (`-gaḷu`, e.g. `ಪುಸ್ತಕಗಳು` -> `ಪುಸ್ತಕ`)
  - Plural Oblique + Cases:
    - Locative: `ಗಳಲ್ಲಿ` (`-gaḷalli`)
    - Accusative: `ಗಳನ್ನು` (`-gaḷannu`)
    - Dative: `ಗಳಿಗೆ` (`-gaḷige`)
    - Instrumental: `ಗಳಿಂದ` (`-gaḷinda`)
    - Genitive: `ಗಳ` (`-gaḷa`)
  - Singular Case Suffixes:
    - Accusative: `ವನ್ನು` (`-vannu`), `ಅನ್ನು` (`-annu`), `ನ್ನು` (`-nnu`)
    - Dative: `ಗೆ` (`-ge`), `ಕೆ` (`-ke`), `ಳಿಗೆ` (`-ḷige`), `ಿಗೆ` (`-ige`)
    - Instrumental: `ಿಂದ` / `ಇಂದ` (`-inda`), `ದಿಂದ` (`-dinda`)
    - Locative: `ಅಲ್ಲಿ` (`-alli`), `ದಲ್ಲಿ` (`-dalli`), `ನಲ್ಲಿ` (`-nalli`), `ಯಲ್ಲಿ` (`-yalli`)
    - Genitive: `ಯ` (`-ya`), `ದ` (`-da`), `ಅ` (`-a`)
- **Morphology Candidate Logic**:
  Write `getKannadaMorphologyCandidates(input)` in `data/morphology.ts` to sequentially check and strip these common suffixes, handling glide consonants (`v`, `y`, `d` sandhi inserters).

## Data Source Candidates & Status
- **Kannada Wiktionary (`knwiktionary`)**:
  - Live query `https://api.wiktapi.dev/v1/kn/word/...` can be queried or gated.
  - Kannada Wiktionary edition pages can describe Kannada and other languages; production extraction must select verified Kannada-language sections rather than treating edition page count as Kannada lemma coverage.
  - Hosted access and parser quality must be measured before production promotion; local fixtures remain preview smoke data only.
- **Local Fixtures (`data/localLexicon.ts`)**:
  Add common target entries:
  - `ಪುಸ್ತಕ` (book)
  - `ಮನೆ` (house)
  - `ಬೆಕ್ಕು` (cat)

## Implementation Plan
1. **Reader Update**:
   - Update `app/reader.tsx` tokenizer and `isWord` regex to support the Kannada Unicode range (`\u0C80-\u0CFF`).
2. **Morphology Suffix Handler**:
   - Implement suffix-stripping and plural oblique sandhi reversal logic in `data/morphology.ts`.
3. **Registry and Adapters**:
   - Register the `kn` language in `data/languages.ts`.
   - Register the `kn` adapter in `data/adapterRegistry.ts` and `data/dictionaryApi.ts`.
4. **Local Lexicon Entries**:
   - Add local Kannada fixtures for `ಪುಸ್ತಕ`, `ಮನೆ`, and `ಬೆಕ್ಕು` to support offline/local smoke tests.
5. **Testing**:
   - Add unit tests in `tests/dictionaryApi.test.ts` validating exact lookups, suffix-stripped lookups, and synonym retrieval.
