# Tagalog Monolingual Baseline Plan

## Language
- Code: `tl` (often matching `fil` for Filipino, the national standard)
- Display name: Tagalog
- Family: Austronesian (Malayo-Polynesian)
- Script: Latin (historically Baybayin)
- Writing direction: LTR

## Scope
Track the implemented monolingual Tagalog dictionary baseline (TL->TL) and the remaining production source gates.

## Current Code Audit
- Status refreshed: June 12, 2026.
- Implemented in code: `tl` is registered in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'tl'`; `data/adapterRegistry.ts` dispatches to `fetchTagalogMeaning` and `fetchTagalogRelatedWords`.
- Fixture/runtime path: `data/localLexicon.ts` contains a tiny `tlwiktionary`-attributed Tagalog fixture set; `data/morphology.ts` includes prefix, infix, suffix, reduplication, accent-insensitive, and fixture-backed Baybayin fallback candidates used by `data/dictionaryApi.ts`.
- Test coverage: `tests/dictionaryApi.test.ts` covers exact lookup, `magbasa/nagbabasa -> basa`, `kumain/kumakain -> kain`, `basahin -> basa`, and related words.
- Production source audit: `docs/tagalog-production-source-audit.md` accepts native `tl.wiktionary.org` as the extraction/measurement candidate and rejects English-definition Kaikki data for monolingual packaging.
- Remaining gate: production-scale Tagalog coverage still needs a native-source extractor, balanced measurement, attributed corpus/offline pack, and UI smoke.

## Script And Normalization
- Uses the Latin alphabet, consisting of 28 letters (including `ñ` and the digraph `ng`).
- **Diacritics**: Accent marks (e.g., `á`, `à`, `â`) are used in dictionaries and educational texts to indicate stress, length, and glottal stops (e.g., `puno` - tree vs `punô` - full). However, they are rarely written in everyday texts.
- **Normalization**: Preserved as NFC, but search must fall back to diacritic-insensitive matching so users can search without accents.

## Morphology
Tagalog has an extremely complex, affix-heavy, and agglutinative morphological system:
- **Affixation**: Uses prefixes (e.g., `mag-`, `nag-`), suffixes (e.g., `-an`, `-in`), infixes (placed inside the root word, e.g., `-um-` as in `k-um-ain` "to eat" from `kain`, and `-in-` as in `k-in-ain` "ate"), and circumfixes (combinations of prefix and suffix).
- **Focus/Trigger System**: Verb affixes change depending on the semantic role of the noun marked by the specifier `ang` (actor, patient, location, theme, instrument).
- **Reduplication**: Very common. Full or partial reduplication of the root indicates aspect, plurality, or intensity (e.g., `kain` -> `kakain` "will eat", `kumakain` "eating").
- **Morphology Strategy**: **CRITICAL TECHNICAL CHALLENGE.** Simple suffix-stripping is insufficient due to infixes (`-um-`, `-in-`) and prefixation. Reader lookup needs a parser that can strip prefixes and identify infixed root words to locate the correct headword in the dictionary.

## Data Source Candidates & Blocker
| Source | Type | Status | License |
|--------|------|--------|---------|
| WiktAPI (Tagalog Wiktionary `tl`) | REST API | **BLOCKED (404)** | N/A |
| WiktAPI (English Wiktionary `en`) | REST API | **Violates Rules** | CC-BY-SA 3.0 |
| UP Diksiyonaryong Filipino | Proprietary | **Blocked (Copyright)** | N/A |
| Kaikki Tagalog index | Offline DB | Bilingual Only | CC-BY-SA 3.0 |

### Production Source Gate
- Probing `https://api.wiktapi.dev/v1/tl/word/aso` returns a **404 error**, showing that there is no active Tagalog edition on WiktAPI.
- Probing the English edition `https://api.wiktapi.dev/v1/en/word/aso` returns Tagalog entries but with definitions written in English.
- No free, open-source monolingual Tagalog dictionary API exists. Commercial dictionaries (like the University of the Philippines' UP Diksiyonaryong Filipino) are protected under strict copyrights.
- Until a larger approved monolingual TL->TL source is found, expansion beyond the tiny local baseline remains blocked.

## Implementation Plan
Status: first small baseline is implemented; production/bulk source expansion remains gated.

1. Metadata, adapter dispatch, tiny fixtures, and local morphology fallback: DONE.
2. Build and measure a bounded native `tl.wiktionary.org` extraction path before production expansion.
3. Extend the lemmatizer only with fixture-backed prefix, infix, suffix, and reduplication patterns.

## First Safe Task
Next safe task: build the bounded native Tagalog Wiktionary extractor and balanced 100-headword measurement. Adapter expansion should stay source-gated until then.
