# Russian Monolingual Baseline Plan

## Current Implementation Status
- **State**: Implemented monolingual preview.
- **Evidence**: Russian metadata, Cyrillic normalization, adapter routing, local attributed fixtures, case/aspect morphology fallbacks, and focused lookup tests are present.
- **Status refreshed**: June 12, 2026.
- **Production source audit**: `docs/russian-production-source-audit.md` accepts native `ru.wiktionary.org` or Russian-edition Wiktextract as a strong extraction/measurement candidate.
- **Production gap**: A measured Russian corpus, richer paradigms, and an approved offline-pack path are still missing.
- **Historical note**: The implementation plan below is retained as design history; its tasks are complete at preview-baseline level.

## Language Metadata
- **Code**: `ru`
- **Display name**: Russian (Русский)
- **Family**: Indo-European (Slavic)
- **Script**: Cyrillic
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Russian dictionary lookup (RU→RU) and morphology baseline before adding adapter code or metadata.

## Script & Orthography (Cyrillic)
- **Alphabet**: 33 letters of the Cyrillic alphabet.
- **Normalization**: Unicode Normalization Form C (NFC).
- **Stress Marks**: Russian texts for learners often contain stress marks (e.g., `кни́га` instead of `книга` or `соба́ка` instead of `собака`). Search input lookup must strip combining acute accent marks (U+0301) to ensure robust exact match queries.

## Morphology & Declension Fallbacks
Russian is a highly inflected fusional Slavic language:
- **Noun/Adjective Case System**: 6 cases (Nominative, Genitive, Dative, Accusative, Instrumental, Prepositional) across 3 genders (Masculine, Feminine, Neuter) and 2 numbers.
  - E.g., `книга` (book, Nom. Sg.) -> `книгу` (Acc. Sg.), `книги` (Gen. Sg. / Nom. Pl.), `книгам` (Dat. Pl.).
  - E.g., `собака` (dog, Nom. Sg.) -> `собаку` (Acc. Sg.), `собаке` (Pre. Sg.).
- **Verb Aspect & Conjugation**: 
  - Verbs exist in aspect pairs: Imperfective (e.g., `читать` - to read) vs. Perfective (e.g., `прочитать` - to read to completion).
  - Conjugations change endings based on person (1st, 2nd, 3rd) and number in present/future tenses, and based on gender and number in past tense.
    - E.g., `читать` -> `читаю` (I read), `читает` (he reads), `читал` (he read, masc.), `читала` (she read, fem.).
- **Morphology Candidates Strategy**:
  - **Direct Lookup**: Primary query in exact lowercase.
  - **Noun Declension Stripping**:
    - Remove common case endings (`-у`, `-ю`, `-а`, `-я`, `-ы`, `-и`, `-е`, `-ом`, `-ем`, `-ой`, `-ей`, `-ам`, `-ям`, `-ами`, `-ями`, `-ах`, `-ях`) and restore standard feminine ending (`-а` / `-я`) or masculine base (zero ending).
  - **Verb Conjugation Stripping**:
    - Remove present/future endings (`-ю`, `-у`, `-ешь`, `-ишь`, `-ет`, `-ит`, `-ем`, `-им`, `-ете`, `-ите`, `-ут`, `-ют`, `-ат`, `-ят`) and append infinitive suffix `-ть`.
    - Remove past endings (`-л`, `-ла`, `-ло`, `-ли`) and append infinitive suffix `-ть`.

## Data Source Candidates & Status
1. **Russian Wiktionary (`ruwiktionary`)**:
   - One of the largest and most complete Wiktionaries.
   - Hosted WiktAPI query `https://api.wiktapi.dev/v1/ru/word/книга` returns a **404 error** (not supported in the main hosted edition list).
2. **Offline Community Dumps & Fixtures**:
   - Local mock entries will be created using open-licensed (CC BY-SA) definitions from English/Russian Wiktionary dumps.
   - Core test cases will cover basic nouns (`книга` - book, `собака` - dog) and verbs (`читать` - to read).

## Implementation Plan
1. **Metadata Configuration**:
   - Register `ru` in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'ru'`.
2. **Morphology Rules (`data/morphology.ts`)**:
   - Implement `getRussianMorphologyCandidates(input: string)`:
     - Strips learner stress marks (U+0301).
     - Peels noun/adjective declensions and restores nominative singular endings.
     - Peels verb inflections (present, past, future) and restores infinitive `-ть` ending.
3. **Local Lexicon Fixtures (`data/localLexicon.ts`)**:
   - Add monolingual fixtures for:
     - `книга` (book - noun)
     - `собака` (dog - noun)
     - `читать` (to read - verb)
4. **Adapter Integration & Dispatch**:
   - Hook up `fetchRussianMeaning` and `fetchRussianRelatedWords` in `data/dictionaryApi.ts` and register in `data/adapterRegistry.ts`.
5. **Unit Tests**:
   - Write unit tests under `tests/dictionaryApi.test.ts` to cover exact, declension-stripped, and verb-conjugation-stripped lookups.

## Next Safe Task
Build a bounded native Russian Wiktionary/Wiktextract extractor and run the balanced 100-headword measurement across stress, case, aspect, conjugation, and related-word coverage.
