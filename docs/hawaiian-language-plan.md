# Hawaiian Monolingual Baseline Plan

## Language Metadata
- **Code**: `haw`
- **Display name**: ʻŌlelo Hawaiʻi (Hawaiian)
- **Family**: Austronesian (Polynesian)
- **Script**: Latin with ʻokina and kahakō
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Hawaiian dictionary lookup (HAW->HAW), focusing on ʻokina/kahakō normalization, Polynesian morphology, and source gates before any bilingual expansion.

## Orthography & Normalization
- Hawaiian uses a small Latin alphabet plus two essential modern orthographic marks:
  - **ʻOkina** (`ʻ`, U+02BB): a consonant letter marking a glottal stop.
  - **Kahakō** (macron over vowels: `ā`, `ē`, `ī`, `ō`, `ū`): marks long vowels.
- The ʻokina is lexical and should be preserved in primary lookup. ASCII apostrophe (`'`), curly quotes (`‘`, `’`), and backtick-like input should normalize to U+02BB for search.
- Kahakō is also lexical and should be preserved in display. Search should use staged matching:
  1. Exact NFC match.
  2. Case-insensitive match.
  3. ʻOkina-normalized match (`'ohana`, `‘ohana`, `’ohana` -> `ʻohana`).
  4. Optional kahakō-insensitive fallback for user convenience, while preserving exact headword display.
- Do not collapse ʻokina away in primary lookup. Words can differ by glottal stop and vowel length.

## Typology & Comparison
Hawaiian belongs to the Austronesian roadmap group, but differs from the already implemented baselines:
- **Compared with Malay**: Hawaiian does not need Malay-style prefix/suffix stripping or reduplication-first lookup.
- **Compared with Tagalog**: Hawaiian lacks Tagalog’s complex trigger/focus affix system.
- **Compared with Javanese**: Hawaiian has no Javanese-style speech register mapping or nasal active/passive morphology.
- Hawaiian baseline should be orthography-first: ʻokina/kahakō fidelity matters more than broad stemming.

## Morphology & Grammar
- Hawaiian is analytic and uses particles, prepositions, possessive classes, and determiners rather than heavy inflection.
- Number is usually expressed through articles/determiners rather than plural suffixes on the noun.
- Baseline lookup should not stem broad grammatical particles. Reader tokenization can use existing whitespace behavior and punctuation cleanup.
- Safe baseline candidates:
  - Normalize apostrophe-like ʻokina variants to U+02BB.
  - Preserve kahakō in canonical headwords.
  - Add kahakō-insensitive fallback only for fixture-covered words such as `olelo` -> `ʻōlelo` or `ohana` -> `ʻohana`.
- Do not generate broad morphological roots from particles such as `ka`, `ke`, `nā`, `i`, `ma`, or `o` until phrase-aware lookup exists.

## Pronunciation
- Hawaiian pronunciation is highly tied to orthography.
- ʻOkina and kahakō should be visible in headwords and examples because they affect pronunciation and meaning.
- IPA can be stored if a source provides it. Audio is future work and must come from a licensed source.

## Data Source Candidates & Status
| Source | Type | Status | Notes |
|--------|------|--------|-------|
| WiktAPI Hawaiian edition (`haw`) | Hosted REST candidate | Not usable in smoke | `hale`, `ʻohana`, `ʻōlelo`, and `wai` returned 404 on 2026-05-20. |
| Hawaiian Wiktionary / Kaikki-derived data | Structured dump candidate | Candidate for tiny fixtures | Must verify Hawaiian-language definitions and CC BY-SA attribution before implementation. |
| Wehewehe Wikiwiki / Ulukau | Online dictionary collection | Candidate research source, not first implementation source | Strong Hawaiian lexical resource, but API, scraping, and license terms need product decision before production integration. |
| Historical public-domain dictionaries | Offline source candidate | Research-only until parsed | Useful for lexical validation, but orthography modernization and data modeling require care. |
| English Wiktionary Hawaiian entries | Structured fallback | Bilingual only by default | Useful for metadata and pronunciation, not enough for monolingual-first definitions by itself. |

### Source Gate
- The first implementation should be local-fixture-first unless a stable Hawaiian monolingual API or approved local bundle exists.
- Any fixtures must keep source attribution and must not imply production source coverage.
- Do not scrape Wehewehe Wikiwiki / Ulukau into runtime data without an accepted source/license decision.
- Do not use machine translation to create Hawaiian definitions.

## Implementation Plan
1. **Metadata Configuration**:
   - Register `haw` in `data/languages.ts` with `family: 'austronesian'`, `script: 'latin'`, `writingDirection: 'ltr'`, `adapterKey: 'haw'`, and `dictionaryStatus: 'monolingual'` once fixtures exist.
2. **Local Lexicon Fixtures (`data/localLexicon.ts`)**:
   - Add a tiny fixture set for common words such as `hale` (house), `wai` (water), `ʻohana` (family), and `ʻōlelo` (language/speech).
   - Preserve canonical ʻokina and kahakō in stored headwords.
3. **Normalization & Morphology (`data/localLexicon.ts`, `data/morphology.ts`)**:
   - Add `normalizeHawaiianWord` that normalizes apostrophe-like ʻokina variants to U+02BB and lowercases safely.
   - Add fixture-backed kahakō-insensitive candidates without stripping ʻokina.
4. **Adapter Integration & Dispatch**:
   - Register a `haw` adapter in `data/adapterRegistry.ts` and dispatch `fetchHawaiianMeaning` / `fetchHawaiianRelatedWords` from `data/dictionaryApi.ts`.
5. **Unit Tests**:
   - Cover exact lookup, apostrophe-to-ʻokina normalization, kahakō-insensitive fallback, no-ʻokina-collapse behavior, and related-word lookup under `tests/dictionaryApi.test.ts`.

## Test Plan
- `npm test -- --run tests/dictionaryApi.test.ts tests/adapterRegistry.test.ts tests/languageNormalization.test.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test -- --run`

## Research Sources
- University of Hawaiʻi Hawaiian language standards: ʻokina and kahakō are required for correct spelling/display.
- University of Hawaiʻi diacritics guide: Hawaiian words can differ by ʻokina/kahakō placement.
- Wehewehe Wikiwiki / Ulukau: candidate dictionary collection including Hawaiian resources and monolingual dictionary material.
- WiktAPI smoke on 2026-05-20: common Hawaiian headwords returned 404 for the hosted `haw` endpoint.
