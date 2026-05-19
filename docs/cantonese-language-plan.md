# Cantonese Monolingual Baseline Plan

## Language
- Code: `yue`
- Display name: 粵語 / 廣東話 (Cantonese)
- Family: Sino-Tibetan (Sinitic)
- Script: Hanzi (predominantly Traditional)
- Writing direction: LTR (modern digital standard)

## Scope
Plan a monolingual Cantonese dictionary lookup (YUE→YUE).

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
33: | WiktAPI (Cantonese Wiktionary `yue`) | REST API | **BLOCKED (404)** | N/A |
34: | Words.hk (粵典) | API / Dump | **Candidate** | CC-BY-SA 4.0 |
35: | Kaikki English-edition Cantonese | Offline DB | Bilingual Only | CC-BY-SA 3.0 |

### The Monolingual Blocker
- Testing `https://api.wiktapi.dev/v1/yue/word/貓` returns a **404 error** as there is no separate Cantonese Wiktionary edition on WiktAPI.
- **Words.hk (粵典)** is the primary active open Cantonese-monolingual dictionary project. It provides Cantonese explanations (`yue -> yue`) and English translations, making it the most viable candidate for monolingual definitions.
- However, since there is no standard hosted public JSON API for Words.hk, we would need to request access or parse their public data dumps.
- Until a stable hosted API is integrated or local database bundles are allowed, implementation remains blocked.

## Implementation Plan
1. Add `yue` language metadata to `data/languages.ts` but mark it as `dictionaryStatus: 'unavailable'` so the UI displays "Coming soon" (Sắp hỗ trợ).
2. Keep the Cantonese adapter registration blocked until a reliable Cantonese monolingual API endpoint is confirmed.
3. Ensure the word segmenter (`Intl.Segmenter`) is configured when implementing Sino-Tibetan languages in the Reader component.

## First Safe Task
Add the language metadata to `data/languages.ts` and document the Cantonese details in the plan.
