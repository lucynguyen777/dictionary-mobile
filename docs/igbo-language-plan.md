# Igbo Monolingual Baseline Plan

## Language Metadata
- **Code**: `ig`
- **Display name**: Igbo
- **Family**: Niger-Congo (Igboid / Volta-Niger)
- **Script**: Latin, Ọnwụ orthography
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Igbo dictionary lookup (IG->IG), focusing on tone-safe search, underdot-preserving normalization, vowel harmony implications, and source gates before any bilingual expansion.

## Current Code Audit
- Status refreshed: May 22, 2026.
- Implemented in code: `ig` is registered in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'ig'`; `data/adapterRegistry.ts` dispatches to `fetchIgboMeaning` and `fetchIgboRelatedWords`.
- Fixture/runtime path: local Igbo fixtures, tone-insensitive underdot-preserving lookup, conservative prefix fallback, and related-word lookup are wired through `data/localLexicon.ts`, `data/morphology.ts`, and `data/dictionaryApi.ts`.
- Remaining gate: broader Igbo production/bulk coverage, Nkọwa okwu / Igbo API integration, and audio/example expansion still need accepted API/license/product terms.

## Orthography & Normalization
- Igbo uses the Ọnwụ orthography in standard dictionary practice.
- Underdot vowels and nasal marks are lexical and must be preserved in primary lookup:
  - `ị`, `ọ`, `ụ`, and `ṅ`.
- Tone marks are important for pronunciation and meaning, but ordinary Igbo orthography often omits them. Wiktionary guidance marks low tone with grave accents, leaves high tone unmarked, and uses macron for downstep in headword lines.
- Search should use staged matching:
  1. Exact NFC match.
  2. Case-insensitive match.
  3. Tone-insensitive match that strips acute, grave, and macron tone marks while preserving underdots.
  4. Optional diacritic-insensitive suggestion only, because stripping underdots can merge distinct words.
- Reader tokenization can start with the existing Latin-script whitespace flow. No script-specific segmenter is needed for baseline lookup.

## Typology & Comparison
Igbo belongs in the same broad Niger-Congo roadmap group as Yoruba and Zulu, but its baseline should not reuse either strategy blindly:
- **Compared with Yoruba**: both require tone-aware search, but Igbo underdot vowels and `ṅ` are lexical in the orthography and should be preserved more aggressively than tone marks.
- **Compared with Zulu**: Igbo does not use Bantu noun class prefix pairs for plural/singular lookup, so Zulu prefix fallback rules do not apply.
- **Compared with Swahili**: Igbo does not need noun class plural mapping as the first morphology strategy.

## Morphology & Grammar
- Igbo nouns are comparatively simple and are not generally marked for gender, case, or number.
- Verb morphology uses prefixes and suffixes for tense, aspect, negation, and imperative patterns, but broad verb lemmatization should not be attempted in the first adapter.
- Vowel harmony is central: Igbo has two vowel harmony sets. Prefix vowels often harmonize with the root vowel, so any future affix fallback must be fixture-backed.
- Common baseline-safe candidates:
  - Tone-stripped forms, e.g. accented headword -> plain query and plain query -> accented fixture.
  - Infinitive/verbal noun prefix `i-` / `ị-` only when a fixture proves the lemma relation.
  - Nominal prefixes such as `o-` / `ọ-`, `u-` / `ụ-` only for tested fixtures.
- Do not implement broad suffix stripping or vowel-harmony generation until source data validates the root mapping.

## Pronunciation
- Igbo has high and low tones, plus downstep in many analyses.
- IPA should be stored when the source provides it.
- Audio can be attached later if a licensed source provides it; do not synthesize or fake audio metadata.

## Data Source Candidates & Status
| Source | Type | Status | Notes |
|--------|------|--------|-------|
| WiktAPI Igbo edition (`ig`) | Hosted REST candidate | Not usable in smoke | `mmadu`, `mmadụ`, `akwụkwọ`, and `ụlọ` returned 404 on 2026-05-20. |
| Igbo Wiktionary / Kaikki-derived dumps | Structured dump candidate | Candidate for tiny local fixtures | Must verify target-language definitions and CC BY-SA attribution before implementation. |
| Nkọwa okwu / Igbo API | Hosted API | Candidate but not first implementation source | Strong Igbo lexical resource with Igbo definitions, audio, and examples, but API/token/license terms need product decision before production integration. |
| English Wiktionary Igbo entries | Structured fallback | Bilingual only by default | Useful for orthography metadata, not enough for monolingual-first definitions by itself. |

### Source Gate
- The project can implement a tiny fixture-first Igbo adapter only if fixtures contain Igbo-language definitions or clearly marked local educational fixture text with attribution.
- Do not integrate Nkọwa okwu / Igbo API as a production source until API access, token handling, privacy, pricing, and license terms are accepted.
- Do not use machine translation to create Igbo definitions.

## Implementation Plan
1. **Metadata Configuration**:
   - Register `ig` in `data/languages.ts` with `family: 'niger-congo'`, `script: 'latin'`, `writingDirection: 'ltr'`, `adapterKey: 'ig'`, and `dictionaryStatus: 'monolingual'` once fixtures exist.
2. **Local Lexicon Fixtures (`data/localLexicon.ts`)**:
   - Add a tiny fixture set for common words such as `mmadụ` (person), `ụlọ` (house), and `akwụkwọ` (book).
   - Preserve underdots in stored headwords and include source attribution.
3. **Normalization & Morphology (`data/localLexicon.ts`, `data/morphology.ts`)**:
   - Add `normalizeIgboWord` that strips tone marks but preserves underdot vowels and `ṅ`.
   - Add conservative fixture-backed candidates for `i-/ị-` verbal noun prefixes only if test fixtures require them.
4. **Adapter Integration & Dispatch**:
   - Register an `ig` adapter in `data/adapterRegistry.ts` and dispatch `fetchIgboMeaning` / `fetchIgboRelatedWords` from `data/dictionaryApi.ts`.
5. **Unit Tests**:
   - Cover exact lookup, tone-insensitive lookup, underdot preservation, missing-source behavior, and related-word lookup under `tests/dictionaryApi.test.ts`.

## Test Plan
- `npm test -- --run tests/dictionaryApi.test.ts tests/adapterRegistry.test.ts tests/languageNormalization.test.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test -- --run`

## Research Sources
- Wiktionary Igbo entry guidelines: Ọnwụ orthography, underdot vowels, `ṅ`, and tone marking conventions.
- MustGo Igbo language profile: vowel harmony, tone, syllable structure, noun/verb morphology, and writing system.
- WiktAPI smoke on 2026-05-20: common Igbo headwords returned 404 for the hosted `ig` endpoint.
- Igbo API / Nkọwa okwu docs: candidate lexical API with Igbo definitions, examples, audio, and dialect data, pending product/license decision.
