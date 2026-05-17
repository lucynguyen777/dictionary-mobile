# Spanish Monolingual Baseline Plan

## Language
- Code: `es`
- Display name: Español
- Family: Indo-European (Romance)
- Script: Latin
- Writing direction: LTR

## Scope
Monolingual Spanish dictionary lookup (ES→ES) using the Spanish Wiktionary via WiktAPI.

## Script And Normalization
- Latin script, same as English and French baselines.
- Diacritics: acute accent (á, é, í, ó, ú), tilde (ñ), dieresis (ü). Must be preserved in display and search.
- Case-insensitive search via `.toLocaleLowerCase()` is safe.
- No segmentation issues (whitespace-delimited words).

## Search Implications
- Standard whitespace tokenization works.
- Accent-insensitive search fallback could improve UX but is not required for baseline.
- No special keyboard layout required beyond standard Spanish keyboard support.

## Morphology
- **Gender**: masculine/feminine. Regular patterns: -o (masculine), -a (feminine). Exceptions exist (e.g., _el día_, _la mano_).
- **Number**: singular/plural. Regular: -s after vowel, -es after consonant, -ces for -z endings (e.g., _lápiz_ → _lápices_).
- **Verb conjugation**: three classes (-ar, -er, -ir). Spanish is heavily inflected with ~50+ forms per verb. Baseline morphology covers regular gerund (-ando, -iendo), participle (-ado, -ido), and common present endings.
- **Diminutives**: -ito/-ita are common. Baseline strips them to find the base word.
- Irregular verbs are not yet covered in morphology candidates (future work).

## Pronunciation
- Spanish orthography is highly regular — pronunciation is largely predictable from spelling.
- IPA is provided by WiktAPI when available (e.g., `[ˈkasa]` for _casa_).
- Audio files from Wikimedia Commons are available for common words.
- Regional pronunciation variants (Latin America vs. Spain) may appear in the data.

## Data Source Candidates
| Source | Type | Status | License |
|--------|------|--------|---------|
| WiktAPI (Spanish Wiktionary / Wikcionario) | REST API | **Selected** | CC-BY-SA 3.0 / GFDL |
| Free Dictionary API (dictionaryapi.dev) | REST API | Does not support Spanish | N/A |
| MinhQnd Dictionary API | REST API | No Spanish data | N/A |

## License Risks
- WiktAPI serves data from Spanish Wiktionary, dual-licensed CC-BY-SA 3.0 and GFDL.
- Attribution to Wiktionary is required. The app already shows `source: 'Wiktionary'` / `source: 'wiktapi.dev'` for each definition.
- No offline bundle is included; all lookups are live API calls. Offline dictionary bundle is blocked pending the licensing decision.
- No commercial data or restricted content is used.

## Implementation Plan
1. ✅ Add `es` language metadata to `data/languages.ts`.
2. ✅ Register `es` adapter in `data/adapterRegistry.ts` using WiktAPI (same pattern as French).
3. ✅ Wire Spanish into `dictionaryApi.ts` dispatch functions.
4. ✅ Add basic Spanish morphology candidates to `data/morphology.ts`.
5. ✅ Make WiktAPI gender labels language-aware (Spanish: masculino/femenino).
6. 🔲 Future: add bilingual ES→VI or ES→EN when a trustworthy lexical source is selected.
7. 🔲 Future: irregular verb morphology table for common Spanish verbs.
8. 🔲 Future: accent-insensitive search fallback.

## Tests
- Existing `adapterRegistry.test.ts` and `dictionaryApi.test.ts` pass (9/9).
- Morphology changes are local and rule-based; tested via the existing candidate uniqueness/filtering logic.
- Manual smoke test: select Español from the language picker, search "casa", "correr", "pequeña".

## Blocked Decisions
- **Bilingual dictionary**: no ES↔VI or ES↔EN source selected. Must not use machine translation.
- **Offline dictionary bundle**: blocked pending `.docs/decisions/dictionary-source-licensing.md` (status: Proposed).
- **Conjugation data**: no structured conjugation source selected yet.

## First Safe Task
Add `es` to language config, register WiktAPI adapter for `es`, wire monolingual dispatch, add basic morphology rules — all implemented in this baseline.
