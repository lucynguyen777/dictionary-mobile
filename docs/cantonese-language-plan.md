# Cantonese Monolingual Baseline Plan

## Language
- Code: `yue`
- Display name: 粵語 / 廣東話 (Cantonese)
- Family: Sino-Tibetan (Sinitic)
- Script: Hanzi (predominantly Traditional)
- Writing direction: LTR (modern digital standard)

## Scope
Plan a monolingual Cantonese dictionary lookup (YUE→YUE).

## Current Code Audit
- Status refreshed: May 22, 2026.
- Current code status: `yue` is registered in `data/languages.ts` as `dictionaryStatus: 'unavailable'` with no adapter key; `data/adapterRegistry.ts` has no Cantonese adapter dispatch.
- Family context: Burmese (`my`) and Tibetan (`bo`) are implemented tiny Sino-Tibetan baselines; Cantonese remains the source-gated implementation blocker in this family.
- Remaining gate: an approved Cantonese-definition bundle/API path is required before adapter fixtures or runtime lookup. Words.hk public-domain word/pronunciation lists are useful, but not sufficient for definitions; see `docs/cantonese-source-smoke.md`.

## Script And Normalization
- Written in Han characters (Hanzi).
- Predominantly uses **Traditional Chinese** characters in Hong Kong, Macau, and overseas communities.
- **Written Cantonese Vernacular**: Unlike standard written Chinese (which is based on Mandarin), written Cantonese includes a large set of unique vernacular characters (e.g., `冇` - not have, `係` - to be, `哋` - plural marker, `嘅` - possessive particle, `乜` - what, `搵` - to find).
- **Word Segmentation**: Like Mandarin, Cantonese is written without spaces between words. Word tokenization in the Reader must use `Intl.Segmenter` with `locale: 'zh-HK'` or `locale: 'zh-Hant'` to identify boundaries before allowing taps.

## Morphology
Cantonese is an isolating language and lacks inflectional morphology:
- No verb conjugation or noun cases.
- **Morphology Strategy**: Stemming is not required. Exact string match maps directly to lemmas.
- **Classifiers/Measure Words**: Similar to Mandarin, nouns require classifier matching (e.g., `一隻貓` - one classifier-cat, `一本書` - one classifier-book).

## Pronunciation
- **Jyutping (粵拼)**: The standard Romanization system developed by the Linguistic Society of Hong Kong (LSHK). It uses Latin characters followed by a tone number (1 to 6, e.g., `mou5` for `冇`, `hai6` for `係`).
- **Yale Romanization**: Older system using tone marks instead of numbers. Jyutping is preferred for digital datasets.
- **Tones**: Cantonese has 6 distinct tones in modern analysis (historically analyzed as 9 tones when checked against entering tones). Tone markers/numbers are essential for pronunciation display and search suggestions.

## Data Source Candidates & Blocker
| Source | Type | Status | License |
|--------|------|--------|---------|
| WiktAPI (Cantonese Wiktionary `yue`) | REST API | **BLOCKED (404)** | N/A |
| Words.hk (粵典) word/pronunciation lists | Public data pages | Candidate for non-definition helpers | Public domain |
| Words.hk (粵典) full definitions | Dictionary content | **BLOCKED** pending explicit compatible permission | Not accepted for app definition fixtures |
| Kaikki English-edition Cantonese | Offline DB | Bilingual Only | CC-BY-SA 3.0 |

### The Monolingual Blocker
- Testing `https://api.wiktapi.dev/v1/yue/word/貓` returns a **404 error** as there is no separate Cantonese Wiktionary edition on WiktAPI.
- **Words.hk (粵典)** is still the strongest product-quality Cantonese dictionary candidate, but this module only confirmed public-domain word/pronunciation and index datasets, not an app-compatible full-definition dump.
- Until a compatible hosted API, full-definition dump, or explicit permission is documented, implementation remains blocked.

## Implementation Plan
1. Add `yue` language metadata to `data/languages.ts` but mark it as `dictionaryStatus: 'unavailable'` so the UI displays "Coming soon" (Sắp hỗ trợ).
2. Keep the Cantonese adapter registration blocked until a reliable and legally compatible Cantonese monolingual definition source is confirmed.
3. Ensure the word segmenter (`Intl.Segmenter`) is configured when implementing Sino-Tibetan languages in the Reader component.

## First Safe Task
Request/confirm a full-definition Words.hk license path or another Cantonese-definition source. Word/pronunciation list work must stay separate from dictionary definitions.
