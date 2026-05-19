# Tagalog Monolingual Baseline Plan

## Language
- Code: `tl` (often matching `fil` for Filipino, the national standard)
- Display name: Tagalog
- Family: Austronesian (Malayo-Polynesian)
- Script: Latin (historically Baybayin)
- Writing direction: LTR

## Scope
Plan a monolingual Tagalog dictionary lookup (TL→TL).

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

### The Monolingual Blocker
- Probing `https://api.wiktapi.dev/v1/tl/word/aso` returns a **404 error**, showing that there is no active Tagalog edition on WiktAPI.
- Probing the English edition `https://api.wiktapi.dev/v1/en/word/aso` returns Tagalog entries but with definitions written in English.
- No free, open-source monolingual Tagalog dictionary API exists. Commercial dictionaries (like the University of the Philippines' UP Diksiyonaryong Filipino) are protected under strict copyrights.
- Until a monolingual TL→TL source is found, implementation remains blocked.

## Implementation Plan
1. Add `tl` language metadata to `data/languages.ts` but mark it as `dictionaryStatus: 'unavailable'` so the UI shows "Coming soon".
2. Keep the Tagalog adapter registration blocked until a reliable Tagalog monolingual API endpoint is confirmed.
3. Design a prototype lemmatizer or stemmer capable of handling infixes (`-um-`, `-in-`) and reduplication patterns before implementing the live lookup.

## First Safe Task
Add the language metadata config as "unavailable" and document the morphological complexities and blockers.
