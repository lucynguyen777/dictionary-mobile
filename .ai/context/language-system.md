# Language System

## Core Principle
Build deep language support, not shallow language quantity.

## Current Language Metadata
Source: `data/languages.ts`

Current languages:
- `en`: English, Indo-European, Latin, LTR, adapter `en`, monolingual.
- `vi`: Tiếng Việt, Austroasiatic, Latin, LTR, adapter `vi`, monolingual.
- `fr`: Français, Indo-European, Latin, LTR, adapter `fr`, monolingual.
- `es`: Español, Indo-European, Latin, LTR, adapter `es`, monolingual.
- `ms`: Bahasa Melayu, Austronesian, Latin, LTR, adapter `ms`, monolingual.
- `sw`: Kiswahili, Niger-Congo, Latin, LTR, adapter undefined, unavailable (blocked).
- `hi`: हिन्दी (Hindi), Indo-European, Devanagari, LTR, adapter undefined, unavailable (blocked).
- `zh`: 中文 (Mandarin), Sino-Tibetan, Han, LTR, adapter undefined, unavailable (blocked, requires segmenter).
- `ja`: 日本語, Japonic, kanji-kana, LTR in current metadata, adapter `ja`, coming soon.
- `ko`: 한국어, Koreanic, Hangul, LTR, adapter `ko`, coming soon.

## Current Adapters
Source: `data/adapterRegistry.ts`

Registered adapters:
- `en`
- `vi`
- `fr`
- `es`
- `ms`
- `minhqnd`
- `wiktapi`

Fallback behavior:
- Unknown language keys fall back to generic `dictionaryApi` functions.

## Build Rules
- Always build monolingual lookup first.
- Add bilingual lookup only after a trustworthy lexical source exists.
- Never use machine translation as dictionary data.
- For disputed macro-families, use them only as roadmap buckets, not production taxonomy.

## Required Language Metadata
Each language should define:
- language code
- display name
- family or technical grouping
- script
- writing direction
- adapter key
- dictionary status
- source strategy
- morphology strategy
- romanization/transliteration strategy if needed
- pronunciation strategy if needed

## Analysis Checklist
Before building a new language, analyze:
1. Family and typology.
2. Script and writing direction.
3. Segmentation needs.
4. Morphology.
5. Pronunciation, IPA, audio, or transliteration.
6. Gender, case, tone, classifiers, noun class, or particles.
7. Dictionary source candidates.
8. License risk.
9. UI/search/storage implications.
10. Tests required.

## Special Handling
- Chinese: segmentation, tones, pinyin, simplified/traditional handling.
- Japanese: kana/kanji, tokenizer, romaji, possible pitch accent.
- Arabic: RTL, abjad script handling, root-pattern morphology, diacritics.
- Hebrew: RTL, abjad script handling, root-pattern morphology, niqqud, final letters.
- Korean: Hangul, particles, verb/adjective endings, romanization.
