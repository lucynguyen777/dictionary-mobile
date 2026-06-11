# Malayalam Monolingual Baseline Plan

## Current Implementation Status
- **State**: Implemented monolingual preview.
- **Evidence**: Malayalam metadata, Reader script support, adapter routing, local attributed fixtures, suffix morphology fallbacks, and focused lookup tests are present.
- **Production gap**: Coverage is fixture-sized and has no measured corpus/offline-pack promotion evidence.
- **Historical note**: The implementation plan below is retained as design history; its tasks are complete at preview-baseline level.

## Language Metadata
- **Code**: `ml`
- **Display name**: മലയാളം (Malayalam)
- **Family**: Dravidian (South)
- **Script**: Malayalam script (abugida, `\u0D00-\u0D7F`)
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Malayalam dictionary lookup (ML→ML), focusing on script-specific tokenization, agglutinative morphology fallbacks, transliteration considerations, and local fixtures.

## Script & Word Tokenization
- **Malayalam Unicode block**: `\u0D00-\u0D7F`
- **Segmentation**: Malayalam is generally whitespace-delimited at word level, but inflected forms can carry stacked suffixes. Reader tokenization should keep contiguous Malayalam letters/signs as a single token.
- **Regex Fallback**:
  Add `|[\u0D00-\u0D7F]+` to the fallback regex in `tokenizeReaderText` (`app/reader.tsx`).
- **Word Identifier**:
  Add `\u0D00-\u0D7F` to the `isWord` regex character class in Reader so tap-to-lookup works on Malayalam words.

## Morphology & Agglutinative Fallbacks
- Malayalam is suffix-heavy (case markers, plural markers, postposition-like endings, and verbal inflections).
- **Common Noun/Case Suffixes to Strip (initial baseline)**:
  - Plural: `-കൾ` (`-kaḷ`)  
  - Accusative: `-യെ` (`-ye`), `-നെ` (`-ne`)
  - Dative: `-ക്ക്` (`-kkŭ`), `-നു` (`-nu`)
  - Instrumental/Sociative: `-ആൽ` (`-āl`), `-ഓട്` / `-ഒട്` (`-ōṭŭ`)
  - Locative: `-യിൽ` (`-yil`), `-ഇൽ` (`-il`)
  - Genitive: `-യുടെ` (`-yuṭe`), `-ഉടെ` (`-uṭe`)
- **Plural + Case Chains (priority)**:
  - `-കളിൽ`, `-കളെ`, `-കൾക്ക്`, `-കളുടെ` should map back to likely singular stem candidate(s).
- **Morphology Candidate Logic**:
  Implement `getMalayalamMorphologyCandidates(input)` in `data/morphology.ts`:
  1. Normalize/trims input
  2. Try direct form
  3. Strip chained plural+case suffixes first
  4. Strip single case suffixes
  5. Strip plural suffix
  6. Return unique ordered candidates

## Transliteration & Orthographic Notes
- Baseline lookup should remain Malayalam-script-first.
- Romanized input can be deferred unless product explicitly requires transliteration search.
- Preserve chillu/virama-sensitive forms in display; fallback normalization should avoid destructive transforms unless proven safe by fixtures/tests.

## Data Source Candidates & Status
- **Malayalam Wiktionary (`mlwiktionary`) via WiktAPI**:
  - Candidate endpoint: `https://api.wiktapi.dev/v1/ml/word/{word}`
  - Must be smoke-tested for reliability and response richness (definitions, POS, related words).
- **Local Educational Fixtures (`data/localLexicon.ts`)**:
  Seed baseline entries to guarantee offline/fallback behavior:
  - `പുസ്തകം` (book)
  - `വീട്` (house/home)
  - `പൂച്ച` (cat)

## Family Baseline Comparison (Dravidian)
Before implementation, align with already-built Dravidian baselines:
- **Tamil (`ta`)**: script tokenization + nominal/verbal suffix fallback
- **Telugu (`te`)**: script tokenization + plural/case suffix chain fallback
- **Kannada (`kn`)**: script tokenization + plural oblique/case stripping
- **Malayalam (`ml`)** should reuse the same adapter architecture and fallback ordering pattern while using Malayalam-specific suffix inventory.

## Implementation Plan
1. **Reader Update**  
   Add Malayalam Unicode support in Reader tokenizer fallback and `isWord` detection.
2. **Morphology Handler**  
   Add `getMalayalamMorphologyCandidates()` with ordered suffix stripping for plural/case chains.
3. **Language & Adapter Registration**  
   Register `ml` in `data/languages.ts`, hook adapter in `data/adapterRegistry.ts`, and wire `dictionaryApi` fetch logic.
4. **Local Lexicon Fixtures**  
   Add base Malayalam entries for offline lookup and deterministic tests.
5. **Tests**  
   Add/extend unit tests (e.g., `tests/dictionaryApi.test.ts`) for:
   - exact Malayalam headword lookup
   - plural/case-stripped fallback lookup
   - related words/synonyms fallback behavior

## Exit Criteria for Planning Task
- Malayalam planning doc exists and is linked in roadmap context.
- `docs/product-progress.md` marks Malayalam planning as `[x] DONE`.
- `Next Work Queue` moves Malayalam implementation to `[~] IN PROGRESS` as the next active task.
