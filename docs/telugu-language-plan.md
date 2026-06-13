# Telugu Monolingual Baseline Plan

## Current Implementation Status

- **State**: Implemented monolingual preview.
- **Evidence**: Telugu metadata, adapter routing, local fixtures, Reader script support, suffix/irregular-oblique fallbacks, and focused lookup tests are present.
- **Production gap**: Corpus coverage, Telugu-section parser precision, suffix-chain evidence, and offline packaging are not measured.
- **Current production-source audit**: `docs/telugu-production-source-audit.md`.

## Language Metadata
- **Code**: `te`
- **Display name**: తెలుగు (Telugu)
- **Family**: Dravidian (South-Central)
- **Script**: Telugu script (abugida, `\u0C00-\u0C7F`)
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Telugu dictionary lookup (TE→TE), focusing on script-specific characteristics, agglutinative morphology candidates, and local fixtures.

## Script & Word Tokenization
- **Telugu Unicode block**: `\u0C00-\u0C7F`
- **Segmentation**: Telugu words are space-separated. The Reader tokenizer should group consecutive Telugu characters (consonants, dependent vowels, and independent vowels) as a single word token.
- **Regex Fallback**:
  Add `|[\u0C00-\u0C7F]+` to the fallback regex inside `tokenizeReaderText` in `app/reader.tsx`.
- **Word Identifier**:
  Add `\u0C00-\u0C7F` to the `isWord` regex character class.

## Morphology & Agglutinative Fallbacks
- Telugu uses nominal suffix declensions and verbal agglutination.
- **Common Suffixes to Strip**:
  - Plural marker: `-లు` (`-lu`, e.g. `పుస్తకాలు` -> `పుస్తకము` / `పుస్తకం`)
  - Accusative: `-ని` (`-ni`) / `-ను` (`-nu`) / `-లను` (`-lanu`, plural accusative)
  - Dative: `-కొరకు` (`-koraku`) / `-కై` (`-kai`)
  - Instrumental: `-తో` (`-tō`) / `-చే` (`-cē`) / `-చేత` (`-cēta`)
  - Locative: `-లో` (`-lō`) / `-లందు` (`-landu`)
  - Ablative: `-nuṇḍi` (`-నుండి`) / `-కంటే` (`-kaṇṭē`)
  - Genitive: `-యొక్క` (`-yokka`)
- **Morphology Candidate Logic**:
  Write `getTeluguMorphologyCandidates(input)` in `data/morphology.ts` to sequentially check and strip these common suffixes, and handle sandhi changes (like mapping `-ాలు` plural to `-ము` root form, or `-ల` oblique plural to `-ము`).

## Data Source Candidates & Status
- **Telugu Wiktionary (`tewiktionary`)**:
  - Live query `https://api.wiktapi.dev/v1/te/word/...` can be queried or gated.
  - Telugu Wiktionary edition pages can describe Telugu and other languages; production extraction must select verified Telugu-language sections rather than treating edition page count as Telugu lemma coverage.
  - Hosted access and parser quality must be measured before production promotion; local fixtures remain preview smoke data only.
- **Local Fixtures (`data/localLexicon.ts`)**:
  Add common target entries:
  - `పుస్తకము` (book)
  - `ఇల్లు` (house)
  - `పిల్లి` (cat)

## Implementation Plan
1. **Reader Update**:
   - Update `app/reader.tsx` tokenizer and `isWord` regex to support the Telugu Unicode range (`\u0C00-\u0C7F`).
2. **Morphology Suffix Handler**:
   - Implement suffix-stripping and plural sandhi reversal logic in `data/morphology.ts`.
3. **Registry and Adapters**:
   - Register the `te` language in `data/languages.ts`.
   - Register the `te` adapter in `data/adapterRegistry.ts` and `data/dictionaryApi.ts`.
4. **Local Lexicon Entries**:
   - Add local Telugu fixtures for `పుస్తకము`, `ఇల్లు`, and `పిల్లి` to support offline/local smoke tests.
5. **Testing**:
   - Add unit tests in `tests/dictionaryApi.test.ts` validating exact lookups, suffix-stripped lookups, and synonym retrieval.
