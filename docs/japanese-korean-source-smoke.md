# Japanese And Korean Source Smoke Test

## Status
A monolingual source candidate path is identified for both languages through Kaikki/Wiktextract raw dumps from the Japanese and Korean Wiktionary editions. Small attributed fixtures and preview adapters now exist; production promotion still requires measured corpus/parser, segmentation, and offline-pack evidence.

## Smoke Tests
Run on May 17, 2026.

| Source | Query | Result | Decision |
|--------|-------|--------|----------|
| WiktAPI Japanese endpoint | `https://api.wiktapi.dev/v1/ja/word/%E7%8C%AB?source_lang=ja` | HTTP 404, no entries for `猫` | Block WiktAPI `ja` adapter. |
| WiktAPI Korean endpoint | `https://api.wiktapi.dev/v1/ko/word/%EC%82%AC%EB%9E%91?source_lang=ko` | HTTP 404, no entries for `사랑` | Block WiktAPI `ko` adapter. |
| Kaikki Japanese dictionary page | `https://kaikki.org/dictionary/Japanese/index.html` | Dataset exists, 170783 distinct words, based on `enwiktionary` dump | Candidate for research, not verified as monolingual Japanese definitions. |
| Kaikki Korean dictionary page | `https://kaikki.org/dictionary/Korean/index.html` | Dataset exists, 54698 distinct words, based on `enwiktionary` dump | Candidate for research, not verified as monolingual Korean definitions. |

Follow-up research on May 18, 2026.

| Source | Query | Result | Decision |
|--------|-------|--------|----------|
| Kaikki Japanese Wiktionary raw data | `https://kaikki.org/jawiktionary/rawdata.html` | Raw Wiktextract JSONL from `jawiktionary`; page states glosses and metadata are in Japanese. Current open result showed extraction from the 2026-05-01 jawiktionary dump, extracted 2026-05-16. | Candidate JA->JA source path found. Requires small fixture smoke before adapter code. |
| Kaikki Korean Wiktionary raw data | `https://kaikki.org/kowiktionary/rawdata.html` | Raw Wiktextract JSONL from `kowiktionary`; page states glosses and metadata are in Korean. Current open result showed extraction from the 2026-05-01 kowiktionary dump, extracted 2026-05-17. | Candidate KO->KO source path found. Requires small fixture smoke before adapter code. |
| Kaikki English-edition raw index | `https://kaikki.org/dictionary/rawdata.html` | Lists Japanese and Korean extracts from English Wiktionary, useful for bilingual/metadata research but gloss language is English. | Do not use as monolingual-first JA->JA or KO->KO baseline. |
| WiktAPI project docs | `https://wiktapi.dev/quickstart` | Documents edition/language axes and `GET /v1/{edition}/word/{word}` with optional `?lang={code}`. It uses Kaikki preprocessed data. | Possible access layer after source edition is selected, but prior direct endpoint smoke failed for `ja`/`ko`; self-host/import path may be safer for first adapter. |

Endpoint/data smoke on May 18, 2026.

| Source | Query | Result | Decision |
|--------|-------|--------|----------|
| WiktAPI editions | `curl "https://api.wiktapi.dev/v1/editions"` | Editions include `ja` and `ko`. | Edition metadata exists. |
| WiktAPI Japanese word | `curl "https://api.wiktapi.dev/v1/ja/word/猫?lang=ja"` | HTTP 404. Prefix search for `猫` returns Japanese results, but direct word lookup still fails. | Do not use hosted WiktAPI direct word lookup for adapter yet. |
| WiktAPI Korean word | `curl "https://api.wiktapi.dev/v1/ko/word/사랑?lang=ko"` | HTTP 404. Prefix search for `사랑` returns Korean results, but direct word lookup still fails. | Do not use hosted WiktAPI direct word lookup for adapter yet. |
| `jawiktionary` raw JSONL stream | streamed `raw-wiktextract-data.jsonl.gz` and matched `word = 猫`, `lang_code = ja` | Record contains Japanese glosses, POS, categories, readings/forms, and related proverb fields. | Raw dump path passes first JA->JA schema smoke. |
| `kowiktionary` raw JSONL stream | streamed `raw-wiktextract-data.jsonl.gz` and matched `word = 사랑`, `lang_code = ko` | Record contains Korean glosses, POS, examples, audio URLs, IPA, romanization, synonyms, antonyms, and translations. | Raw dump path passes first KO->KO schema smoke. |
| `jawiktionary` verb stream | streamed `raw-wiktextract-data.jsonl.gz` and matched `word = 食べる`, then `word = たべる`, `lang_code = ja` | `食べる` is a kanji `form-of` record pointing to `たべる`; `たべる` is the lemma verb record with Japanese glosses, ichidan/shimoichidan tags, forms, etymology, IPA, and translations. | Japanese adapter must follow `form_of` to canonical lemma before presenting definitions. |
| `kowiktionary` verb stream | streamed `raw-wiktextract-data.jsonl.gz` and matched `word = 먹다`, `lang_code = ko` | Record contains Korean gloss, example, IPA/audio, Hangul phonetic form, romanization, related terms, synonyms, and translations. It does not expose a broad conjugation table in this sampled record. | Korean adapter can use source-backed pronunciation/romanization but needs a separate morphology strategy for inflected lookup. |

## Outcome
- WiktAPI did not provide a usable Japanese or Korean endpoint for the tested common words in the earlier smoke.
- Kaikki confirms machine-readable Japanese and Korean datasets exist from English Wiktionary extraction, but those do not satisfy the monolingual-first rule by themselves.
- Kaikki also exposes raw Wiktextract output for the Japanese Wiktionary and Korean Wiktionary editions. Those are the first acceptable source candidates for JA->JA and KO->KO because their gloss metadata is in the target language edition.
- Streaming smoke confirmed one Japanese headword (`猫`) and one Korean headword (`사랑`) with target-language gloss fields. Hosted WiktAPI search can find those headwords, but direct word endpoints still return 404, so the adapter path should prefer raw-dump ingestion or a self-hosted/indexed WiktAPI import until direct lookup is proven stable.
- Verb smoke confirmed Japanese has useful lemma/form-of and conjugation-form fields, while Korean has useful pronunciation/romanization metadata but still needs a morphology strategy for inflected lookup.
- Japanese and Korean now have bounded monolingual preview adapters; neither has production corpus parity.

## Next Safe Work
1. Build bounded Japanese/Korean-edition Wiktextract importers without committing full dumps.
2. Measure balanced target-language headword sets, parser accuracy, forms/readings, and missing rows.
3. Confirm source attribution UI/data fields before offline packaging.
4. Run segmentation and inflected lookup UI smoke before production promotion.

## Sources Checked
- WiktAPI overview: https://wiktapi.dev/
- WiktAPI quickstart: https://wiktapi.dev/quickstart
- Kaikki Japanese machine-readable dictionary: https://kaikki.org/dictionary/Japanese/index.html
- Kaikki Korean machine-readable dictionary: https://kaikki.org/dictionary/Korean/index.html
- Kaikki Japanese Wiktionary raw data: https://kaikki.org/jawiktionary/rawdata.html
- Kaikki Korean Wiktionary raw data: https://kaikki.org/kowiktionary/rawdata.html
- Kaikki English-edition raw data index: https://kaikki.org/dictionary/rawdata.html
