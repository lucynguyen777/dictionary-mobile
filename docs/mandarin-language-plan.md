# Mandarin Monolingual Baseline Plan

## Language
- Code: `zh` (often `zh-CN` for Simplified, `zh-TW` for Traditional)
- Display name: 中文 (Mandarin Chinese)
- Family: Sino-Tibetan (Sinitic)
- Script: Hanzi (Simplified / Traditional)
- Writing direction: LTR (modern digital standard)

## Scope
Plan a monolingual Mandarin dictionary lookup (ZH→ZH).

## Script And Normalization
- Written in Han characters (Hanzi).
- **Casing**: None.
- **Normalization**: Chinese exists in two main character sets: Simplified (used in mainland China, Singapore) and Traditional (used in Taiwan, Hong Kong, Macau). A robust dictionary must handle lookups in either character set and ideally display both in the results.
- **Word Segmentation**: **CRITICAL TECHNICAL BLOCKER.** Chinese text is written without spaces between words. Our current Reader relies on whitespace and punctuation tokenization to extract words when a user taps. For Chinese, we must implement a word segmenter (e.g., the browser's `Intl.Segmenter` with `granularity: 'word'` or a dedicated library like `jieba`) to correctly identify word boundaries before the user can tap to look up a multi-character word.

## Morphology
Mandarin is an isolating language and lacks inflectional morphology:
- No verb conjugation, noun cases, or plural suffixes (with rare exceptions like 们 for pronouns).
- **Morphology Strategy**: Not required for stemming/lemmatization. The exact matched string is usually the lemma.
- **Classifiers**: Nouns require specific measure words ( classifiers ) when counted. A good dictionary should list the classifier for each noun.

## Pronunciation
- **Pinyin**: The standard Romanization system used in mainland China, heavily reliant on tone marks (ā, á, ǎ, à) or tone numbers.
- **Zhuyin (Bopomofo)**: Used in Taiwan.
- Providing Pinyin is essential for learners.

## Data Source Candidates & Blocker
| Source | Type | Status | License |
|--------|------|--------|---------|
| WiktAPI (Chinese Wiktionary `zh`) | REST API | **BLOCKED (404)** | N/A |
| WiktAPI (English Wiktionary `en`) | REST API | **Violates Rules** | CC-BY-SA 3.0 |
| Free Dictionary API | REST API | No Mandarin | N/A |
| CC-CEDICT | Offline DB | Bilingual Only | CC-BY-SA 4.0 |

### The Monolingual Blocker
- Testing `https://api.wiktapi.dev/v1/zh/word/你好` returns a **404 error**, indicating that the `zh` edition of Wiktionary is not supported or extracted by WiktAPI.
- The `en` edition of WiktAPI provides English definitions. CC-CEDICT is also English-Chinese. Both violate the **monolingual-first** (`ZH→ZH`) requirement.
- Until a monolingual Mandarin API is found, or the project architecture is modified to support bilingual dictionary bundling, the implementation is blocked.

## Implementation Plan
1. ✅ Add `zh` language metadata to `data/languages.ts` but mark it as `dictionaryStatus: 'unavailable'` so the UI shows "Coming soon" (Sắp hỗ trợ).
2. 🔲 Blocked: Do not register a Mandarin adapter until a monolingual source is found.
3. 🔲 Blocked: Implement `Intl.Segmenter` in the Reader to support spaceless text tokenization.

## First Safe Task
Add the language metadata config as "unavailable" and document the source and segmentation blockers.
