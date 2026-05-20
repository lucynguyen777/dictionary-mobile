# Language System

## Core Principle
Build deep language support, not shallow language quantity.

## Language Build Rule
Always build monolingual dictionary lookup first.

Example:
- Spanish → Spanish first
- Then Spanish → English or Spanish → Vietnamese later

## Do Not
Do not use machine translation as fake dictionary data.

Bilingual dictionaries must use trustworthy lexical or dictionary sources.

## Required Language Metadata
Each language should define:
- language code
- display name
- family / technical grouping
- script
- writing direction
- adapter key
- dictionary status
- morphology strategy
- romanization strategy
- pronunciation strategy

## Language Analysis Checklist
Before building a new language, analyze:
1. Language family / typology
2. Script
3. Writing direction
4. Segmentation
5. Morphology
6. Pronunciation / IPA / audio
7. Romanization / transliteration
8. Gender / case / tone / classifier / noun class
9. Dictionary source
10. License risk
11. UI/search implications

## Existing Baselines & Implementations
Our codebase already supports 29 languages with custom adapters, specific orthographies, tokenizers, or morphology systems:

### 1. English (`en`)
- **Family:** Indo-European (Germanic)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual + English-Vietnamese Bilingual
- **Morphology:** English morphology fallback (nouns plural/singular, verbs inflections, adjectives comparative/superlative).

### 2. French (`fr`)
- **Family:** Indo-European (Romance)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual + French-Vietnamese Bilingual
- **Morphology:** Verbs conjugations & gender agreements.

### 3. Vietnamese (`vi`)
- **Family:** Austroasiatic (Vietic)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual + Vietnamese-English Bilingual
- **Morphology:** Analytic, spaces segment words (needs no complex segmenter for baseline but supports multi-word lookup).

### 4. Spanish (`es`)
- **Family:** Indo-European (Romance)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** WiktAPI custom adapter with Spanish-specific morphology stripping and grammatical gender labels.

### 5. Malay (`ms`)
- **Family:** Austronesian (Malayo-Polynesian)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Affix stripping (prefixes like *me-*, *di-*, *pe-*; suffixes like *-kan*, *-an*) and reduplication normalization (e.g. *buku-buku* -> *buku*).

### 6. Tagalog (`tl`)
- **Family:** Austronesian (Malayo-Polynesian)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Complex focus trigger affixation stripping (infixes like *-um-*, *-in-*; prefixes like *mag-*, *nag-*, *pag-*) and reduplication handling.

### 7. Swahili (`sw`)
- **Family:** Niger-Congo (Bantu)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Bantu noun class plural-to-singular matching (e.g., *m-* to *wa-*, *ki-* to *vi-*) and verb subject/tense prefix stripping rules.

### 8. Yoruba (`yo`)
- **Family:** Niger-Congo (Defoid)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Tone-insensitive lookup fallbacks (handling heavy diacritics like acute/grave/macron) and vowel-coalescence morphology matching.

### 9. Zulu (`zu`)
- **Family:** Niger-Congo (Bantu)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Bantu noun class prefix stripping (e.g., *umu-*, *isi-*, *aba-*) and locative suffix/prefix fallbacks (e.g., *e...ini* to base).

### 10. Igbo (`ig`)
- **Family:** Niger-Congo (Igboid)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Local educational fixtures, tone-insensitive search preserving underdots (e.g., *ị*, *ọ*, *ụ*).

### 11. Hawaiian (`haw`)
- **Family:** Austronesian (Polynesian)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Normalized lookup handling both strict and relaxed representation of ʻOkina (glottal stop) and Kahakō (macron).

### 12. Mandarin Chinese (`zh`)
- **Family:** Sino-Tibetan
- **Script/Direction:** Hanzi (Simplified/Traditional) / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Custom tokenizer using Javascript's `Intl.Segmenter` to split input sentences. Supports Pinyin transliteration and simplified-traditional conversions.

### 13. Burmese (`my`)
- **Family:** Sino-Tibetan
- **Script/Direction:** Burmese / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Syllable segmentation and script tokenization fallback without spaces.

### 14. Tibetan (`bo`)
- **Family:** Sino-Tibetan
- **Script/Direction:** Tibetan / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Delimiter-based tokenization (using tsheg `་`), local educational fixtures, and wylie transliteration.

### 15. Japanese (`ja`)
- **Family:** Japonic
- **Script/Direction:** Kanji & Kana / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Kanji/Kana mixed parsing, furigana processing, romaji transliteration support, and verb ending dictionary-form reconstruction (e.g., *tabeta* -> *taberu*).

### 16. Korean (`ko`)
- **Family:** Koreanic
- **Script/Direction:** Hangul / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Hangul jamo decomposition, verb/adjective conjugation undoing (e.g. *haetda* -> *hada*), and particle stripping (*-eul*, *-reul*, *-i*, *-ga*, *-eun*, *-neun*).

### 17. Arabic (`ar`)
- **Family:** Afroasiatic (Semitic)
- **Script/Direction:** Arabic / RTL
- **Status:** Monolingual
- **Adapter/Morphology:** Diacritic (tashkeel) stripping, RTL layout, root-pattern matching (triliteral roots), and common prefix (e.g., *al-*, *wa-*) stripping.

### 18. Hebrew (`he`)
- **Family:** Afroasiatic (Semitic)
- **Script/Direction:** Hebrew / RTL
- **Status:** Monolingual
- **Adapter/Morphology:** Niqud (pointing) stripping, RTL layout, root morphology fallbacks, and prefix stripping (*ha-*, *ve-*).

### 19. Amharic (`am`)
- **Family:** Afroasiatic (Semitic)
- **Script/Direction:** Ge'ez / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Abugida consonant-vowel syllable order shift mapping and prefix/suffix conjugation pruning.

### 20. Somali (`so`)
- **Family:** Afroasiatic (Cushitic)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Definite article suffix stripping (e.g., *-ka*, *-ta*, *-kii*, *-dii*) and gender polarity plurals.

### 21. Russian (`ru`)
- **Family:** Indo-European (Slavic)
- **Script/Direction:** Cyrillic / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Complex case declension stripping (nominative reconstruction for 6 cases) and verbal aspect pair linking (perfective/imperfective).

### 22. Javanese (`jv`)
- **Family:** Austronesian (Malayo-Polynesian)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Active (*ng-*, *n-*, *m-*) and passive (*di-*, *tak-*, *kok-*) verb prefix strip rules.

### 23. Finnish (`fi`)
- **Family:** Uralic (Finno-Ugric)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Case endings stripping (15 nominal cases including partitive, genitive, illative) and consonant gradation (e.g. *k/kk*, *p/pp*, *t/tt* reversals).

### 24. Turkish (`tr`)
- **Family:** Turkic
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Proper handling of dotless/dotted I (`ı`/`I`, `i`/`İ`), agglutinative suffix-chain stripping (plural, possessive, case suffixes like *-lar*, *-in*, *-de*), and consonant mutation (e.g. *c* -> *ç*, *d* -> *t*).

### 25. Hungarian (`hu`)
- **Family:** Uralic (Finno-Ugric)
- **Script/Direction:** Latin / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Plural and case suffix stripping complying with vowel harmony (front vs back vowels, e.g. *-ban*/*-ben*, *-nak*/*-nek*) and verbal suffix pruning.

### 26. Tamil (`ta`)
- **Family:** Dravidian
- **Script/Direction:** Tamil / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Highly agglutinative, nominal case & postposition stripping, verbal tense/person/number oblique markers stripping.

### 27. Telugu (`te`)
- **Family:** Dravidian
- **Script/Direction:** Telugu / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Agglutinative nominal case marker and pronominal verbal suffix stripping.

### 28. Kannada (`kn`)
- **Family:** Dravidian
- **Script/Direction:** Kannada / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Agglutinative case marker and verbal suffix chains pruning.

### 29. Malayalam (`ml`)
- **Family:** Dravidian
- **Script/Direction:** Malayalam / LTR
- **Status:** Monolingual
- **Adapter/Morphology:** Deep agglutinative suffix stripping, noun oblique stem reconstruction, and postposition isolation.

---

## Unsupported / Sắp hỗ trợ Baseline
These are declared in `languages.ts` but currently lack adapters/support:

### Hindi (`hi`)
- **Family:** Indo-European (Indo-Aryan)
- **Script/Direction:** Devanagari / LTR
- **Status:** Sắp hỗ trợ / Unavailable
- **Issue:** WiktAPI 'hi' returns 404. Blocked until a valid offline/online source is integrated.

### Cantonese (`yue`)
- **Family:** Sino-Tibetan
- **Script/Direction:** Han (Traditional) / LTR
- **Status:** Sắp hỗ trợ / Unavailable
- **Issue:** Needs a custom parser or integration with an approved API/local bundle like words.hk.

---

## Next Candidate Groups (Roadmap)
For future expansions beyond the active 29:
- **Easier/Medium:** Spanish (done), Hindi (blocked), Russian (done), Indonesian (shares Malay adapter), Swahili (done).
- **Hard:** Mandarin (done), Cantonese (blocked), Arabic (done), Japanese (done), Korean (done), Tamil (done), Telugu (done), Turkish (done).
- **Upcoming Target:** Estonian (`et`) - Finno-Ugric, 14 cases, vowel gradation.