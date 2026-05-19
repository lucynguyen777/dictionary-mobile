# Somali Monolingual Baseline Plan

## Language Metadata
- **Code**: `so`
- **Display name**: Af-Soomaali (Somali)
- **Family**: Afroasiatic (Cushitic)
- **Script**: Latin (official script since 1972)
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Somali dictionary lookup (SO→SO) and morphology baseline, focusing on article/definite suffix stripping, plural markings, and local mockups.

## Orthography & Normalization
- Somali uses the Latin alphabet, excluding the letters *p*, *v*, and *z*.
- Consonant length is represented by doubling (e.g., *aaba* vs. *abbad*). Vowel length is also represented by doubling (e.g., *geel* - camel, *buug* - book).
- Standard space-based word tokenization in the Reader works out of the box because the script uses spaces as word boundaries.

## Morphology & Suffixation Fallbacks
Somali has complex suffix-based morphology:
1. **Definite Articles (Suffixes)**:
   - Jussive/definite articles depend on the gender of the noun and end-consonant harmony:
     - **Masculine**: `-ka`, `-ki`, `-ku` (or variants `-ga`, `-gi`, `-gu` / `-xa`, `-xi`, `-xu` after certain consonants).
     - **Feminine**: `-ta`, `-ti`, `-tu` (or variants `-da`, `-di`, `-du` / `-sha`, `-shi`, `-shu` after certain consonants).
   - *Example*: `buug` (book) -> `buugga` (the book); `guri` (house) -> `guriga` (the house); `bisad` (cat) -> `bisadda` (the cat).
2. **Plural Suffixes**:
   - Nouns can be pluralized using suffixes like `-o`, `-yaal`, `-oyin`, or through reduplication of the final syllable.
   - *Example*: `buug` -> `buugaag` (books); `guri` -> `guryo` (houses); `bisad` -> `bisado` (cats).

### Morphology Candidates Strategy:
- **Direct Lookup**: Primary query.
- **Definite Suffix Stripping**:
  - Strip masculine endings: `-ga`, `-gi`, `-gu`, `-ka`, `-ki`, `-ku`, `-xa`, `-xi`, `-xu`.
  - Strip feminine endings: `-da`, `-di`, `-du`, `-ta`, `-ti`, `-tu`, `-sha`, `-shi`, `-shu`.
- **Plural Suffix Stripping**:
  - Strip endings: `-yaal`, `-oyin`, `-o` (if word length > 4).

## Data Source Candidates & Status
1. **Somali Wiktionary (`sowiktionary`)**:
   - WiktAPI query `https://api.wiktapi.dev/v1/so/word/buug` is checked.
2. **Offline Dictionaries & Local Fixtures**:
   - Local mock entries will be created using standard Somali vocabulary.
   - Core test cases will cover basic vocabulary and definite article stripping:
     - `buug` (book) -> matches `buugga` / `buuggii` / `buuggaas`.
     - `guri` (house) -> matches `guriga` / `guryo`.
     - `bisad` (cat) -> matches `bisadda` / `bisado`.

## Implementation Plan
1. **Metadata Configuration**:
   - Register `so` in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'so'`.
2. **Morphology Rules (`data/morphology.ts`)**:
   - Implement `getSomaliMorphologyCandidates(input: string)` using article and plural suffix stripping rules.
3. **Local Lexicon Fixtures (`data/localLexicon.ts`)**:
   - Add monolingual fixtures for `buug`, `guri`, and `bisad`.
4. **Adapter Integration & Dispatch**:
   - Register the Somali adapter in `data/adapterRegistry.ts` and dispatch to `fetchSomaliMeaning` / `fetchSomaliRelatedWords`.
5. **Unit Tests**:
   - Write tests under `tests/dictionaryApi.test.ts` to cover exact lookups, definite article stripping, and plural form fallbacks.
