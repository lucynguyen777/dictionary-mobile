# Amharic Monolingual Baseline Plan

## Current Implementation Status
- **State**: Implemented monolingual preview.
- **Evidence**: Amharic metadata, adapter routing, local attributed fixtures, Ge'ez-aware normalization/morphology fallbacks, and focused lookup tests are present.
- **Production gap**: The local corpus is too small for production parity and no approved packaged corpus has passed promotion gates.
- **Historical note**: The implementation plan below is retained as design history; its tasks are complete at preview-baseline level.

## Language Metadata
- **Code**: `am`
- **Display name**: Amharic (አማርኛ)
- **Family**: Afro-Asiatic (Semitic)
- **Script**: Ge'ez (Fidel) script (abugida)
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Amharic dictionary lookup (AM→AM) and morphology baseline before adding adapter code or metadata.

## Script & Orthography (Ge'ez/Fidel)
- **Abugida**: Each character (Fidel) represents a consonant + vowel syllable (e.g., በ /bä/, ቡ /bu/, บี /bi/, ባ /ba/, ቤ /be/, ብ /bə/ or /b/, ቦ /bo/).
- **Punctuation**: Ethiopic word space `፡` (historically separated words, modern texts use standard Latin space) and end of sentence `።`.
- **Normalization**: Unicode Normalization Form C (NFC). Different Fidels can sometimes be used interchangeably due to historical sound merges (e.g., different forms of /h/: ሀ, ሐ, ኀ, ኻ; and different forms of /s/: ሰ, ሠ).
- **Transliteration**: Standard phonetic transliteration systems (e.g., SERA - System for Ethiopic Representation in ASCII, or BGN/PCGN) are crucial for supporting search inputs written in Latin characters.

## Morphology
Amharic is a South Semitic language with highly complex, rich, and synthesis-heavy morphology:
- **Root-and-Pattern (Semitic)**: Words are formed by placing consonantal roots into vowel patterns (templatic morphology). For example, root *s-b-r* (to break) + pattern -> *säbbärä* (he broke), *səbura* (broken).
- **Agglutinative Clitics**:
  - Prefixes: Prepositions, conjunctions, and relative markers (e.g., *yä-* "of", *bä-* "in/by", *kä-* "from", *lä-* "to").
  - Suffixes: Pronoun possessives (e.g., *-e* "my", *-u* "his") and direct/indirect object markers on verbs.
  - E.g., *yäbetachen* (of our house) -> *yä-* (prefix "of") + *bet* (noun "house") + *-achen* (suffix "our").
- **Morphology Strategy**: 
  - Direct exact matching of native script is the primary lookup.
  - Definite article and possessive/prepositional stripping:
    - Noun prefixes: `የ-` (*yä-*), `በ-` (*bä-*), `ለ-` (*lä-*), `ከ-` (*kä-*), `እንደ-` (*əndä-*).
    - Noun suffixes (possessives): `-ዬ` (*-ye* / my), `-ህ` (*-h* / your m.), `-ሽ` (*-š* / your f.), `-ው` (*-w* / his), `-ዋ` (*-wa* / her), `-አችን` (*-aččən* / our).
    - Suffixes (definite article): `-ው` (*-u* or *-w* for masculine), `-ዋ` (*-wa* for feminine).

## Data Source Candidates & Status
1. **Amharic Wiktionary (`amwiktionary`)**:
   - Contains high-quality local definitions but is small in size.
   - Probing the hosted WiktAPI `https://api.wiktapi.dev/v1/am/word/ቤት` returns a **404 error** (not supported in the main hosted edition list).
2. **Offline Community Dumps & Fixtures**:
   - Local mock entries will be created using open-licensed (CC BY-SA) definitions from English/Amharic Wiktionary dumps.
   - Core test cases will cover baseline nouns (e.g., `ቤት` - house, `ውሻ` - dog) and verbs (e.g., `ሰበረ` - to break).

## Implementation Plan
1. **Metadata Configuration**:
   - Register `am` in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'am'`.
2. **Morphology Rules (`data/morphology.ts`)**:
   - Implement `getAmharicMorphologyCandidates(input: string)`:
     - Peels noun prefixes: `የ-`, `በ-`, `ለ-`, `ከ-`.
     - Peels definite/possessive suffixes: `-አችን`, `-ው`, `-ዋ`, `-ዬ`.
3. **Local Lexicon Fixtures (`data/localLexicon.ts`)**:
   - Add monolingual fixtures for:
     - `ቤት` (house - noun)
     - `ውሻ` (dog - noun)
     - `ሰበረ` (to break - verb)
4. **Adapter Integration & Dispatch**:
   - Hook up `fetchAmharicMeaning` and `fetchAmharicRelatedWords` in `data/dictionaryApi.ts` and register in `data/adapterRegistry.ts`.
5. **Unit Tests**:
   - Write unit tests under `tests/dictionaryApi.test.ts` to cover exact, prefix-stripped, and suffix-stripped lookups.
