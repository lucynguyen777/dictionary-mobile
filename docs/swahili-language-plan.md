# Swahili Monolingual Baseline Plan

## Current Implementation Status
- **State**: Implemented monolingual preview.
- **Evidence**: `sw` metadata, adapter routing, local attributed fixtures, noun-class/verb-prefix morphology fallbacks, and focused lookup tests are present.
- **Production gap**: The fixture corpus is intentionally tiny. Swahili remains preview until a measured, approved monolingual corpus and offline-pack path pass the shared promotion gate.
- **Historical note**: The blocker and implementation plan below record the original pre-implementation investigation; they no longer describe current runtime availability.

## Language
- Code: `sw`
- Display name: Kiswahili
- Family: Niger-Congo (Bantu)
- Script: Latin
- Writing direction: LTR

## Scope
Plan a monolingual Swahili dictionary lookup (SW→SW).

## Script And Normalization
- Written in Latin script without special diacritics.
- Case-insensitive search via `.toLocaleLowerCase()` is safe.
- Standard whitespace tokenization works.

## Morphology (Noun Classes and Agglutination)
Swahili is heavily agglutinative and relies on a robust noun class system rather than simple prefixes/suffixes. 
- **Noun Classes**: Nouns are grouped into classes (often paired singular/plural), such as:
  - M/Wa (e.g., *mtu* / *watu* - person/people)
  - Ki/Vi (e.g., *kitu* / *vitu* - thing/things)
  - M/Mi (e.g., *mti* / *miti* - tree/trees)
  - Ji/Ma, N/N, U/N.
- To lemmatize a plural noun, the system must replace the plural prefix with the singular prefix (e.g., replacing `wa-` with `m-` for class 2->1).
- **Verbs**: Highly agglutinative, stacking subject prefix + tense marker + object prefix + root + suffixes (e.g., *ninakupenda* = ni-na-ku-pend-a).
- A rule-based morphology candidate generator would need a dictionary of prefix mappings and must attempt multiple substitutions to find the root.

## Pronunciation
- Highly phonetic orthography.
- IPA can usually be derived algorithmically if not provided by a source.

## Data Source Candidates & Blocker
| Source | Type | Status | License |
|--------|------|--------|---------|
| WiktAPI (Swahili Wiktionary `sw`) | REST API | **BLOCKED (404)** | N/A |
| WiktAPI (English Wiktionary `en`) | REST API | **Violates Rules** | CC-BY-SA 3.0 |
| Free Dictionary API | REST API | No Swahili | N/A |
| MinhQnd Dictionary API | REST API | No Swahili | N/A |

### The Monolingual Blocker
- Testing `https://api.wiktapi.dev/v1/sw/word/mtu` returns a **404 error**, indicating that the `sw` edition of Wiktionary is not supported or extracted by WiktAPI.
- While the `en` edition of WiktAPI contains Swahili words (`lang_code: sw`), it provides **English definitions**. Using this would create a bilingual (SW→EN) dictionary.
- The project rules strictly mandate a **monolingual-first** build (`SW→SW`). Since no reliable, structured monolingual API is available, the implementation is blocked.

## Implementation Plan
1. ✅ Add `sw` language metadata to `data/languages.ts` but mark it as `dictionaryStatus: 'unavailable'` so the UI shows "Coming soon" (Sắp hỗ trợ).
2. 🔲 Blocked: Do not register a Swahili adapter until a monolingual source is found or the monolingual-first rule is amended.
3. 🔲 Blocked: Morphology generator is postponed until a source can validate the roots.

## First Safe Task
Add the language metadata config as "unavailable" and document the source blocker.
