# Language Coverage Inventory

This file is the v1.3.3 baseline for moving preview languages toward Anh-Viet parity. It is generated from the existing language registry, local lexicon, morphology metadata, bilingual pair policy, and future source gates. It does not enable new production languages by itself.

Summary: 34 registered languages, 5 production parity rows including bilingual pairs, 31 monolingual previews, 8 source-gated rows, and 99 local fixture entries.

## Registered Languages

| Code | Label | Status | Source | Entries | Definitions | Examples | Related | Morphology | Adapter | Tests | Top gap | Next action |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| en | English | production-parity | production-api | 5 | 6 | 12 | 54 | yes | yes | registry | Needs ongoing corpus growth, offline packaging, and parity smoke as coverage expands. | Grow corpus/offline packs and keep Word/Reader/Library smoke tests green. |
| vi | Tieng Viet | production-parity | production-api | 3 | 4 | 5 | 20 | no | yes | registry | Needs ongoing corpus growth, offline packaging, and parity smoke as coverage expands. | Grow corpus/offline packs and keep Word/Reader/Library smoke tests green. |
| fr | Francais | monolingual-preview | preview-api | 2 | 2 | 2 | 7 | no | yes | registry | Hosted API preview still needs coverage audit, offline packaging path, and UI smoke before production parity. | Run coverage inventory against the upstream API or dump, then define a packaged corpus path. |
| es | Espanol | monolingual-preview | preview-api | 0 | 0 | 0 | 0 | yes | yes | registry | Hosted API preview still needs coverage audit, offline packaging path, and UI smoke before production parity. | Run coverage inventory against the upstream API or dump, then define a packaged corpus path. |
| ms | Bahasa Melayu | monolingual-preview | preview-api | 0 | 0 | 0 | 0 | yes | yes | registry | Hosted API preview still needs coverage audit, offline packaging path, and UI smoke before production parity. | Run coverage inventory against the upstream API or dump, then define a packaged corpus path. |
| tl | Tagalog | monolingual-preview | local-fixture | 3 | 3 | 3 | 9 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| sw | Kiswahili | monolingual-preview | local-fixture | 4 | 4 | 4 | 11 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| yo | Yoruba | monolingual-preview | local-fixture | 3 | 3 | 3 | 4 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| zu | Zulu | monolingual-preview | local-fixture | 3 | 3 | 3 | 10 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| ig | Igbo | monolingual-preview | local-fixture | 3 | 3 | 3 | 10 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| haw | Hawaiian | monolingual-preview | local-fixture | 4 | 4 | 4 | 12 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| hi | Hindi | monolingual-preview | local-fixture | 4 | 4 | 8 | 20 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| yue | Cantonese | source-gated | source-gated | 0 | 0 | 0 | 0 | no | no | missing-source-gate | Needs approved legal dictionary source and representative samples. | Resolve source/license gate before adding or enabling production dictionary data. |
| my | Burmese | monolingual-preview | local-fixture | 3 | 3 | 3 | 5 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| bo | Tibetan | monolingual-preview | local-fixture | 3 | 3 | 3 | 5 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| ja | Japanese | monolingual-preview | local-fixture | 3 | 3 | 3 | 8 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| ko | Korean | monolingual-preview | local-fixture | 2 | 2 | 2 | 9 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| ar | Arabic | monolingual-preview | local-fixture | 1 | 1 | 2 | 4 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| he | Hebrew | monolingual-preview | local-fixture | 1 | 1 | 2 | 4 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| am | Amharic | monolingual-preview | local-fixture | 3 | 3 | 3 | 7 | yes | yes | registry | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| so | Somali | monolingual-preview | local-fixture | 3 | 3 | 3 | 8 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| ru | Russian | monolingual-preview | local-fixture | 3 | 3 | 3 | 10 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| zh | Chinese | monolingual-preview | local-fixture | 3 | 3 | 3 | 13 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| jv | Javanese | monolingual-preview | local-fixture | 4 | 4 | 4 | 12 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| fi | Finnish | monolingual-preview | local-fixture | 4 | 4 | 6 | 16 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| et | Estonian | monolingual-preview | local-fixture | 4 | 4 | 4 | 13 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| tr | Turkish | monolingual-preview | local-fixture | 4 | 5 | 6 | 14 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| uz | Uzbek | monolingual-preview | local-fixture | 4 | 4 | 8 | 19 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| kk | Kazakh | monolingual-preview | local-fixture | 4 | 6 | 6 | 23 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| hu | Hungarian | monolingual-preview | local-fixture | 4 | 4 | 4 | 8 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| ta | Tamil | monolingual-preview | local-fixture | 3 | 3 | 3 | 4 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| te | Telugu | monolingual-preview | local-fixture | 3 | 3 | 3 | 4 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| kn | Kannada | monolingual-preview | local-fixture | 3 | 3 | 3 | 4 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |
| ml | Malayalam | monolingual-preview | local-fixture | 3 | 3 | 3 | 4 | yes | yes | focused | Tiny local fixture corpus; not enough headword coverage for production parity. | Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests. |

## Bilingual Pairs

| Pair | Label | Status | Source | Top gap | Next action |
| --- | --- | --- | --- | --- | --- |
| en->vi | English to Vietnamese | production-parity | production-api | Needs ongoing corpus/offline-pack growth. | Keep dictionary-source smoke and expand offline packaging. |
| vi->en | Vietnamese to English | production-parity | production-api | Needs ongoing corpus/offline-pack growth. | Keep dictionary-source smoke and expand offline packaging. |
| fr->vi | French to Vietnamese | production-parity | production-api | Supported by lexical dictionary data but still needs larger coverage. | Grow coverage and define an offline packaging path. |
| vi->fr | Vietnamese to French | source-gated | source-gated | No approved VI-to-FR lexical dictionary source; machine translation is not dictionary data. | Select DBnary/Wiktionary-derived lexical source before enabling the pair. |

## Future Source Gates

| Code | Label | Status | Top gap | Next action |
| --- | --- | --- | --- | --- |
| ug | Uyghur | source-gated | Current approved samples are not representative enough for noun/adjective/verb fixtures. | Find a larger approved Uyghur-definition source or a non-placeholder Wiktionary candidate set. |
| eu | Basque | source-gated | No production source gate has been completed for Basque yet. | Run source/license research before adding registry metadata or fixtures. |
| ain | Ainu | source-gated | Source availability and licensing are not proven. | Research legal dictionary sources and script/romanization expectations first. |
| qu | Quechua | source-gated | Amerind/proposed-family candidates require per-language source validation. | Choose a specific Quechua variety and verify a legal lexical source. |
| nah | Nahuatl | source-gated | No approved source, variety scope, or attribution path has been selected. | Research variety scope and compatible dictionary data before registry work. |
| gn | Guarani | source-gated | No approved production lexical source is selected. | Run source/license smoke and define morphology/orthography expectations. |

## Recommended Next Execution Order

1. Spanish and Malay API-preview audit: measure upstream WiktAPI coverage, examples, related words, and failure states before deciding whether to package dumps or keep live preview.
2. French monolingual and French-to-Vietnamese expansion: keep the supported `fr->vi` dictionary pair, but separate monolingual French preview from bilingual production-pair status.
3. High-usage local-fixture scripts: Arabic, Hebrew, Japanese, Korean, Mandarin, Hindi, and Russian need larger approved corpora before production labeling.
4. Family batches with existing morphology: Uralic, Turkic, Dravidian, Austronesian, Niger-Congo, Afro-Asiatic, and Sino-Tibetan preview rows can move only after corpus size, attribution, examples, related words, offline packaging, and UI smoke pass.
5. Source-gated languages and pairs: Cantonese, Uyghur, VI-to-FR, Basque, Ainu, Quechua, Nahuatl, and Guarani must stay unavailable until legal source gates pass.
