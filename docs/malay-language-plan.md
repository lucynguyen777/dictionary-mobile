# Malay Monolingual Baseline Plan

## Language
- Code: `ms`
- Display name: Bahasa Melayu
- Family: Austronesian
- Script: Latin (Rumi)
- Writing direction: LTR

## Scope
Monolingual Malay dictionary lookup (MS→MS) using the Malay Wiktionary via WiktAPI.

## Script And Normalization
- Written in Latin script (Rumi). Jawi (Arabic script) is not supported in this baseline.
- No special diacritics generally used in modern Malay Rumi.
- Case-insensitive search via `.toLocaleLowerCase()` is safe.
- Standard whitespace tokenization works.

## Morphology
Malay morphology relies heavily on affixation and reduplication. The baseline handles these safe operations to identify root words:
- **Reduplication (*Kata Ganda*)**: Common for plurals or variety (e.g., *buku-buku* → *buku*). If exactly two identical parts are hyphenated, it's simplified to the root.
- **Suffixes (*Akhiran*)**: Stripping common suffixes like *-kan*, *-i*, *-an*.
- **Prefixes (*Awalan*)**: Stripping non-mutating prefixes like *ber-*, *ter-*, *di-*, *ke-*, *se-*.
- **Circumfixes (*Apitan*)**: Basic combinations like *di-...-kan*, *ke-...-an*.
- *Note:* The complex *meN-* and *peN-* allomorphs (which modify the root's initial consonant, e.g., *mengambil* → *ambil*, *menyapu* → *sapu*) are skipped in the baseline as they require advanced rule sets or a dedicated stemmer.

## Pronunciation
- IPA is provided by WiktAPI when available (e.g., `[makan]`).
- Audio files from Wikimedia Commons are available for many common words.

## Data Source Candidates
| Source | Type | Status | License |
|--------|------|--------|---------|
| WiktAPI (Malay Wiktionary) | REST API | **Selected** | CC-BY-SA 3.0 / GFDL |
| Free Dictionary API (dictionaryapi.dev) | REST API | Does not support Malay | N/A |
| MinhQnd Dictionary API | REST API | No Malay data | N/A |

## License Risks
- WiktAPI serves data from Malay Wiktionary, dual-licensed CC-BY-SA 3.0 and GFDL.
- Attribution to Wiktionary is required. The app already shows `source: 'Wiktionary'` / `source: 'wiktapi.dev'` for each definition.
- No offline bundle is included; all lookups are live API calls. Offline dictionary bundle is blocked pending the licensing decision.

## Implementation Plan
1. ✅ Add `ms` language metadata to `data/languages.ts`.
2. ✅ Register `ms` adapter in `data/adapterRegistry.ts` using WiktAPI.
3. ✅ Wire Malay into `dictionaryApi.ts` dispatch functions.
4. ✅ Add basic Malay morphology candidates to `data/morphology.ts` (reduplication, simple prefixes/suffixes).
5. 🔲 Future: integrate a full Malay stemmer (like Malaya) for *meN-* / *peN-* prefixes.
6. 🔲 Future: bilingual MS→EN or MS→VI.

## Tests
- Run `npm test` to verify `adapterRegistry` and `dictionaryApi` still function correctly.
- Ensure new morphology function parses simple inputs without breaking.

## Blocked Decisions
- **Bilingual dictionary**: no MS↔VI or MS↔EN source selected. Must not use machine translation.
- **Advanced Stemmer**: Requires complex logic, so we stick to safe rule-based prefixes/suffixes for now.
