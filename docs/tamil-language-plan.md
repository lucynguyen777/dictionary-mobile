# Tamil Monolingual Baseline Plan

## Current Implementation Status

- **State**: Implemented monolingual preview.
- **Evidence**: Tamil metadata, adapter routing, local fixtures, Reader script support, suffix fallbacks, and focused lookup tests are present.
- **Production gap**: Corpus coverage, Tamil-section parser precision, sandhi evidence, and offline packaging are not measured.
- **Current production-source audit**: `docs/tamil-production-source-audit.md`.

## Language Metadata
- **Code**: `ta`
- **Display name**: தமிழ் (Tamil)
- **Family**: Dravidian (Southern)
- **Script**: Tamil script (abugida, `\u0B80-\u0BFF`)
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Tamil dictionary lookup (TA→TA), focusing on script-specific characteristics, agglutinative morphology candidates, and local fixtures.

## Script & Word Tokenization
- **Tamil Unicode block**: `\u0B80-\u0BFF`
- **Segmentation**: Tamil words are space-separated. The Reader tokenizer should group consecutive Tamil characters (consonants, dependent vowels, and independent vowels) as a single word token.
- **Regex Fallback**:
  Add `|[\u0B80-\u0BFF]+` to the fallback regex inside `tokenizeReaderText` in `app/reader.tsx`.
- **Word Identifier**:
  Add `\u0B80-\u0BFF` to the `isWord` regex character class.

## Morphology & Agglutinative Fallbacks
- Tamil is highly agglutinative. Suffixes represent case markers, plural markers, postpositions, and tense/aspect/person verb inflections.
- **Common Suffixes to Strip**:
  - Plural marker: `-கள்` (`-kaḷ`, e.g. `புத்தகங்கள்` -> `புத்தகம்`)
  - Accusative: `-ஐ` (`-ai`)
  - Dative: `-க்கு` (`-kku`) / `-உக்கு` (`-ukku`)
  - Instrumental: `-ஆல்` (`-āl`)
  - Sociative: `-ஓடு` (`-ōṭu`) / `-உடன்` (`-uṭan`)
  - Locative: `-இல்` (`-il`) / `-இடம்` (`-iṭam`)
  - Ablative: `-இலிருந்து` (`-iliruntu`)
  - Genitive: `-உடைய` (`-uṭaiya`) / `-இன்` (`-in`)
- **Morphology Candidate Logic**:
  Write `getTamilMorphologyCandidates(input)` in `data/morphology.ts` to sequentially check and strip these common nominal/verbal suffixes, keeping track of sandhi changes (like doubling consonants `க்`, `ச்`, `த்`, `ப்` or glide insertions `வ்`, `ய்` that appear between root and suffix).

## Data Source Candidates & Status
- **Tamil Wiktionary (`tawiktionary`)**:
  - Live query `https://api.wiktapi.dev/v1/ta/word/...` can be tested or gated.
  - Tamil Wiktionary edition pages can describe Tamil and other languages; production extraction must select verified Tamil-language sections rather than treating edition page count as Tamil lemma coverage.
  - Since hosted access and parser quality vary, a measured Tamil-edition dump/import path is required before production promotion.
- **Local Fixtures (`data/localLexicon.ts`)**:
  Add common target entries:
  - `புத்தகம்` (book)
  - `வீடு` (house)
  - `பூனை` (cat)

## Implementation Plan
1. **Reader Update**:
   - Update `app/reader.tsx` tokenizer and `isWord` regex to support the Tamil Unicode range (`\u0B80-\u0BFF`).
2. **Morphology Suffix Handler**:
   - Implement suffix-stripping and sandhi-reversal logic in `data/morphology.ts`.
3. **Registry and Adapters**:
   - Register the `ta` language in `data/languages.ts`.
   - Register the `ta` adapter in `data/adapterRegistry.ts` and `data/dictionaryApi.ts`.
4. **Local Lexicon Entries**:
   - Add local Tamil fixtures for `புத்தகம்`, `வீடு`, and `பூனை` to support off-line/local smoke tests.
5. **Testing**:
   - Add unit tests in `tests/dictionaryApi.test.ts` validating exact lookups, suffix-stripped lookups, and synonym retrieval.
