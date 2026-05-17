# Russian Monolingual Baseline Plan

## Language
- Code: `ru`
- Display name: Русский
- Family: Indo-European (Slavic)
- Script: Cyrillic
- Writing direction: LTR

## Scope
Plan a monolingual Russian dictionary lookup (RU->RU) before any bilingual Russian dictionary work.

The first attempted implementation target was live monolingual lookup through Russian Wiktionary data exposed by WiktAPI, plus conservative metadata and morphology helpers. The endpoint smoke test failed on May 17, 2026 with 404 responses for common Russian words (`дом`, `мир`, `книга`), while the existing French endpoint returned 200. Russian implementation is therefore blocked until a working RU->RU source is selected.

Bilingual RU<->VI, RU<->EN, etymology, conjugation tables, and offline bundles remain out of scope until source and licensing decisions are accepted.

## Baseline Comparison
| Area | English baseline | French/Spanish baseline | Russian implication |
|------|------------------|-------------------------|---------------------|
| Family | Indo-European, Germanic | Indo-European, Romance | Indo-European, Slavic; can reuse adapter shape but not morphology assumptions. |
| Script | Latin | Latin with diacritics | Cyrillic; normalize Unicode and preserve `ё` distinct from `е` in display. |
| Segmentation | Whitespace words | Whitespace words | Whitespace tokenization is acceptable for baseline, but punctuation and stress marks need cleanup. |
| Morphology | Plural, tense, irregular fallback | Gender/number/regular verb fallback | Case, number, gender, aspect, participles, and verb conjugation are much richer. |
| Pronunciation | IPA/audio from source | IPA/audio from WiktAPI | Source may expose IPA/audio; stress is important and should be displayed when available. |
| Dictionary source | dictionaryapi.dev | WiktAPI | WiktAPI/Russian Wiktionary candidate failed endpoint smoke test; choose another RU->RU source before implementation. |

## Script And Normalization
- Russian uses Cyrillic and is case-sensitive only in casing, not in lexical identity; search can use `.toLocaleLowerCase('ru')` or current `.toLocaleLowerCase()` as a baseline.
- Preserve `ё` and `е` in display. A future search fallback can try `ё` <-> `е`, but the UI should not silently rewrite the displayed headword.
- Normalize user input and source headwords to NFC before lookup and comparison.
- Strip optional combining stress marks for fallback lookup while preserving stressed forms from the source for display.
- Standard whitespace tokenization works for single-word lookup. Multi-word idioms can remain future work.

## Search Implications
- Baseline lookup should first query the exact normalized Cyrillic input.
- Optional fallback candidates:
  - lowercased input;
  - stress-mark-stripped input;
  - `ё` replaced with `е` as a fallback only after exact lookup fails.
- Latin transliteration input (for example `privet`) should not be enabled in the first slice unless a deterministic transliteration strategy is added. Otherwise search behavior will be noisy and hard to explain.

## Morphology
Russian needs more caution than English/French/Spanish:
- **Nouns**: six cases, singular/plural, and grammatical gender (masculine, feminine, neuter).
- **Adjectives**: case, number, gender, short forms, and comparative/superlative forms.
- **Verbs**: aspect pairs, tense, person, number, mood, participles, and verbal adverbs.
- **Stress**: stress can move across forms and affects pronunciation.

Safe baseline morphology candidates can include only very conservative suffix stripping:
- plural/case endings such as `-ы`, `-и`, `-а`, `-я`, `-ов`, `-ев`, `-ам`, `-ами`, `-ах`;
- adjective endings such as `-ый`, `-ий`, `-ая`, `-ое`, `-ые`;
- verb infinitive hints from common endings such as `-ет`, `-ют`, `-ит`, `-ат` should be treated as low-confidence and limited.

Do not claim complete lemmatization without a proper Russian morphology engine or source-provided inflection data.

## Pronunciation
- IPA and audio should be consumed from the source when available.
- Stress marks are core Russian pronunciation metadata. If WiktAPI returns stress-marked forms or IPA, display them rather than deriving stress locally.
- Algorithmic pronunciation should not be built in the baseline.

## Data Source Candidates
| Source | Type | Status | License / risk |
|--------|------|--------|----------------|
| WiktAPI (Russian Wiktionary edition) | REST API | **Blocked after smoke test** | WiktAPI exposes structured Wiktionary JSON for many editions, but `ru` returned 404 for `дом`, `мир`, and `книга` on May 17, 2026. Do not implement against this path unless it starts returning usable RU->RU entries. |
| Kaikki / Wiktextract data | JSONL dumps | Candidate for future self-host/offline exploration | Same Wiktionary-derived license obligations; offline packaging remains blocked by licensing/product decision. |
| English Wiktionary Russian sections | REST/data extract | Not selected for monolingual baseline | Often gives English definitions, which would be RU->EN and violates monolingual-first scope. |
| Machine translation APIs | Translation API | Rejected for dictionary data | Project rule forbids machine translation as dictionary definitions. |

Sources checked:
- WiktAPI: https://wiktapi.dev/
- Wiktionary copyright/license page: https://en.wiktionary.org/wiki/Wiktionary:Copyrights
- Wiktionary Russian entry guidelines: https://en.wiktionary.org/wiki/Wiktionary:About_Russian

## License Risks
- Wiktionary-derived text requires attribution and share-alike compliance.
- Some entries can include media or examples with separate terms; the app should keep source attribution visible and avoid bundling media offline without review.
- `.docs/decisions/dictionary-source-licensing.md` is still `Proposed`, so no offline Russian bundle or redistributed lexical dataset should be added.
- Live API lookup can be planned, but implementation should keep source labels explicit and avoid caching beyond ordinary local app state unless a caching decision is accepted.

## Implementation Plan
1. Block adapter implementation until a working monolingual RU->RU source is selected.
2. If a source is selected, add `ru` language metadata to `data/languages.ts` with `family: 'indo-european'`, `script: 'cyrillic'`, `writingDirection: 'ltr'`, `adapterKey: 'ru'`, and `dictionaryStatus: 'monolingual'`.
3. Register a `ru` adapter in `data/adapterRegistry.ts` using the selected source.
4. Wire `ru` into `canUseMonolingualDictionaryApi`, `fetchMonolingualMeaning`, and `fetchRelatedWords` in `data/dictionaryApi.ts`.
5. Add conservative Russian morphology candidates in `data/morphology.ts`; keep them limited and label them as fallback candidates.
6. Make any gender/aspect/case tags display safely as optional chips rather than required fields.
7. Add tests for adapter registration, monolingual dispatch, unsupported bilingual behavior, and morphology candidate generation.
8. Keep RU bilingual pairs unsupported until a trustworthy bilingual lexical source is selected.

## Tests
- `tests/adapterRegistry.test.ts`: verify `ru` adapter registration and source routing.
- `tests/dictionaryApi.test.ts`: verify monolingual dispatch uses WiktAPI for `ru` and bilingual RU pairs stay unsupported.
- Add morphology tests for conservative Cyrillic suffix candidates if the implementation adds rules.
- Manual smoke after implementation: lookup common Russian words such as `дом`, `книга`, `говорить`, and a `ё` word such as `ёлка`.

## Blocked Decisions
- **Russian monolingual source**: WiktAPI `ru` endpoint smoke test failed with 404 for common words. A different RU->RU source or self-hosted Wiktionary extraction path must be selected before code implementation.
- **Bilingual dictionary**: no RU<->VI or RU<->EN lexical source selected. Do not use machine translation.
- **Offline Russian dictionary bundle**: blocked by `.docs/decisions/dictionary-source-licensing.md` until accepted.
- **Full lemmatization/conjugation**: blocked until a morphology engine or structured inflection source is selected.
- **Etymology/conjugation production tabs**: remain blocked by the etymology/conjugation source decisions.

## First Safe Task
Create or update a source decision brief for Russian monolingual lookup candidates. Do not add `ru` metadata or adapter dispatch until a live RU->RU source returns usable entries.
