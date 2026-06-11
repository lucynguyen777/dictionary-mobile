# Language Production Readiness Roadmap

## Goal And Rule

Move every registered preview language toward production readiness from easiest to hardest. Shared tooling may be built by batch, but **promotion remains one language at a time**. A language is not production-ready merely because it has metadata, an adapter, morphology helpers, or tiny fixtures.

Every promotion must pass the shared gates in `data/languageProductionRoadmap.ts`: approved source/license/revision, 100-headword measurement, at least 5,000 attributed entries, exact lookup >=95%, morphology >=85% where applicable, examples >=40%, related words >=30%, offline-pack smoke, and Word/Reader/Library UI smoke.

## What Can Be Built Together

| Batch | Shared work | Targets | Why grouped |
| --- | --- | --- | --- |
| 0 | Production regression and pack growth | `en`, `vi`, `en->vi`, `vi->en`, `fr->vi` | Already production; share maintenance and offline-pack QA. |
| 1 | Hosted-API measurement and Wiktextract ingestion | `fr`, `ms`, `es` | Existing preview APIs, Latin/LTR UI, lowest integration risk. |
| 2 | Latin-script fixture-to-corpus pipeline | `haw`, `so`, `jv`, `tl`, `sw`, `yo`, `ig`, `zu` | UI/tokenization are reusable; morphology remains language-specific. |
| 3 | Agglutinative Latin corpus/morphology QA | `fi`, `et`, `hu`, `tr`, `uz` | Share suffix-chain measurement and morphology corpus harness. |
| 4 | Non-Latin inflected LTR QA | `ru`, `kk`, `hi` | Share Unicode/script measurement and rich-inflection QA. |
| 5 | RTL Semitic UI/corpus QA | `ar`, `he` | Share RTL Reader/Word/Library smoke and diacritic policy. |
| 6 | East Asian segmentation/readings QA | `zh`, `ja`, `ko` | Share segmentation, readings, and no-space text smoke. |
| 7 | Complex-script corpus ingestion | `ta`, `te`, `kn`, `ml`, `my`, `bo`, `am` | Share native-script ingestion/tokenization harness; each needs separate linguistic validation. |
| 8 | Source/license unblock | `vi->fr`, `yue`, `ug`, `eu`, `ain`, `qu`, `nah`, `gn` | No implementation/promotion until each source gate passes. |

Shared batch work includes: source manifest schema, Wiktionary/Wiktextract conversion, measurement reports, attribution preservation, pack checksums, SQLite import/delete/lookup tests, and reusable UI smoke. Do not share morphology rules across languages without language-specific fixtures and tests.

## Easy-To-Hard Execution Order

1. French: finish the active measured candidate; current 100-word report fails exact lookup, related words, corpus size, and offline-pack gates.
2. Malay, then Spanish: reuse the API-preview measurement pipeline; validate Malay allomorphs and Spanish accents/irregular verbs.
3. Hawaiian, Somali, Javanese, Tagalog, Swahili, Yoruba, Igbo, Zulu: Latin-script UI is already safe; primary work is approved corpus selection and morphology QA.
4. Finnish, Estonian, Hungarian, Turkish, Uzbek: richer suffix/case systems require stronger morphology measurement.
5. Russian, Kazakh, Hindi: non-Latin scripts plus rich inflection increase QA cost.
6. Arabic, Hebrew: require RTL and diacritic/clitic QA.
7. Mandarin, Japanese, Korean: require segmentation/readings and script-specific UX.
8. Tamil, Telugu, Kannada, Malayalam, Burmese, Tibetan, Amharic: complex-script corpus/tokenization and sparse-source risk.
9. Source-gated targets only after legal/source gates pass.

## Per-Language Production Plans

### Batch 0: Maintain Production Languages And Pairs

- **English `en`**: grow approved API/offline corpus; keep morphology, examples, relations, audio, attribution, missing-result, and all UI regression smoke green.
- **Vietnamese `vi`**: grow approved lexical/offline corpus; preserve tone-sensitive display/search; expand examples/relations and pack smoke.
- **English-Vietnamese `en->vi` / `vi->en`**: measure broader bilingual coverage, preserve dictionary-style rows, and add offline packaging without machine-generated definitions.
- **French-Vietnamese `fr->vi`**: measure source coverage and metadata, then define legal offline packaging while keeping the existing production pair stable.

### Batch 1: API Preview Promotion

- **French `fr`**: select a revisioned >=5,000-entry French Wiktionary/Wiktextract corpus; resolve current 92% exact and 0% related-word measurements; build candidate pack; run UI/offline smoke; promote only when every gate passes.
- **Malay `ms`**: run a balanced 100-word measurement including `meN-`/`peN-`, reduplication, and affixed forms; select approved corpus; package and smoke; promote after morphology and coverage gates pass.
- **Spanish `es`**: measure accented/unaccented forms, adjective agreement, and irregular verbs; select revisioned corpus; package and smoke; promote after exact/morphology gates pass.

### Batch 2: Latin Fixture Preview Promotion

- **Hawaiian `haw`**: approve a larger corpus; preserve ʻokina variants and kahakō; measure exact/normalized lookup separately; package and smoke.
- **Somali `so`**: approve corpus; measure definite articles, plural patterns, and length-sensitive forms; package and smoke.
- **Javanese `jv`**: approve corpus and register policy; validate affixes and any Javanese-script data; package Latin baseline first only if source scope is explicit.
- **Tagalog `tl`**: approve corpus; measure focus/voice affixes, infixation, and reduplication; package and smoke.
- **Swahili `sw`**: approve corpus; measure noun-class singular/plural mapping and common verb-prefix chains; package and smoke.
- **Yoruba `yo`**: approve corpus; measure tone-insensitive search while preserving display tones; package and smoke.
- **Igbo `ig`**: approve corpus; measure tone handling and underdot preservation; package and smoke.
- **Zulu `zu`**: approve corpus; measure noun classes, prefixes, and locatives; package and smoke.

### Batch 3: Agglutinative Latin Promotion

- **Finnish `fi`**: approve corpus; measure cases, consonant gradation, vowel harmony, and verb forms; package and smoke.
- **Estonian `et`**: choose Wiktionary or separately approved Ekilex/Sõnaveeb path; measure cases and diacritics; package and smoke.
- **Hungarian `hu`**: approve corpus; measure case chains, vowel harmony, and vowel length; package and smoke.
- **Turkish `tr`**: approve corpus; measure dotted/dotless I, suffix chains, vowel harmony, and verbs; package and smoke.
- **Uzbek `uz`**: expand approved Uzbek Wiktionary corpus; measure apostrophe variants, Latin/Cyrillic fallback, and suffix chains; package and smoke.

### Batch 4: Inflected Non-Latin LTR Promotion

- **Russian `ru`**: approve revisioned corpus; measure stress stripping, noun/adjective cases, verb aspect, and conjugation; package and smoke.
- **Kazakh `kk`**: expand approved Kazakh Wiktionary corpus; define Cyrillic/Latin scope; measure seven cases and vowel harmony; package and smoke.
- **Hindi `hi`**: expand approved Hindi Wiktionary corpus; measure Devanagari variants, oblique/plural forms, postpositions, and verbs; package and smoke.

### Batch 5: RTL Semitic Promotion

- **Arabic `ar`**: approve corpus; measure vocalized/unvocalized forms and clitics; explicitly bound root-pattern fallback; run RTL Word/Reader/Library smoke; package and smoke.
- **Hebrew `he`**: approve corpus; measure niqqud/no-niqqud forms and clitics; explicitly bound root-pattern fallback; run RTL smoke; package and smoke.

### Batch 6: East Asian Promotion

- **Mandarin `zh`**: approve corpus; measure segmentation, simplified/traditional mapping, readings/pronunciation metadata, and multi-character words; package and smoke.
- **Japanese `ja`**: approve corpus; measure tokenizer behavior, kana/kanji variants, inflections, and readings; pitch accent is optional unless source supports it; package and smoke.
- **Korean `ko`**: approve corpus; measure segmentation, particles, verb/adjective endings, and readings; validate any NIKL terms before use; package and smoke.

### Batch 7: Complex-Script Promotion

- **Tamil `ta`**, **Telugu `te`**, **Kannada `kn`**: select approved corpus per language; measure native-script tokenization, suffix chains, noun/verb lemma fallback; package and smoke separately.
- **Malayalam `ml`**: additionally preserve chillu/virama forms and avoid destructive normalization.
- **Burmese `my`**: validate segmentation and conservative morphology against corpus evidence before expansion.
- **Tibetan `bo`**: validate tsek-aware segmentation and conservative morphology before expansion.
- **Amharic `am`**: validate Fidel normalization, clitics, and bounded root-pattern behavior before expansion.

### Batch 8: Source-Gated Plans

- **Vietnamese-French `vi->fr`**: prove DBnary/Wiktionary bilingual rows or license a dictionary; machine translation is never accepted as dictionary data.
- **Cantonese `yue`**: obtain compatible Words.hk full-definition permission; then build Hanzi/Jyutping/tone/segmentation adapter and corpus plan.
- **Uyghur `ug`**: find a balanced approved native-definition source; then implement RTL/bidi, ULY mapping, and evidence-backed suffix handling.
- **Basque `eu`**: pass Wiktionary/Kaikki source gate, then define case/agglutinative morphology and corpus plan.
- **Ainu `ain`**: prove source availability/license and choose variety/script/romanization before metadata or adapter work.
- **Quechua `qu`**, **Nahuatl `nah`**, **Guarani `gn`**: choose language variety and approved source independently; never treat them as one production taxonomy or share unvalidated morphology.

## Module Template For Each Promotion

Each language promotion becomes one module with exactly five tasks:

1. Source/license/revision selection and 100-headword balanced measurement.
2. Corpus normalization with attribution and language-specific morphology/segmentation fixes.
3. Candidate offline pack build, checksum, import/delete/lookup smoke.
4. Word/Reader/Library UI smoke plus focused adapter/missing-result tests.
5. Promotion decision, inventory/docs update, verification, commit, and push.

If a gate fails, record the measured blocker and keep the language preview/source-gated. Do not lower thresholds merely to complete a module.
