# Japanese And Korean Source Smoke Test

## Status
No monolingual source path is verified yet. Do not add Japanese or Korean adapters.

## Smoke Tests
Run on May 17, 2026.

| Source | Query | Result | Decision |
|--------|-------|--------|----------|
| WiktAPI Japanese endpoint | `https://api.wiktapi.dev/v1/ja/word/%E7%8C%AB?source_lang=ja` | HTTP 404, no entries for `猫` | Block WiktAPI `ja` adapter. |
| WiktAPI Korean endpoint | `https://api.wiktapi.dev/v1/ko/word/%EC%82%AC%EB%9E%91?source_lang=ko` | HTTP 404, no entries for `사랑` | Block WiktAPI `ko` adapter. |
| Kaikki Japanese dictionary page | `https://kaikki.org/dictionary/Japanese/index.html` | Dataset exists, 170783 distinct words, based on `enwiktionary` dump | Candidate for research, not verified as monolingual Japanese definitions. |
| Kaikki Korean dictionary page | `https://kaikki.org/dictionary/Korean/index.html` | Dataset exists, 54698 distinct words, based on `enwiktionary` dump | Candidate for research, not verified as monolingual Korean definitions. |

## Outcome
- WiktAPI does not currently provide a usable Japanese or Korean endpoint for the tested common words.
- Kaikki confirms machine-readable Japanese and Korean datasets exist, but the indexed pages are based on English Wiktionary extraction. That means they are useful for source research and possible bilingual/metadata exploration, but they do not satisfy the monolingual-first rule by themselves.
- Japanese and Korean remain `coming-soon` metadata only.

## Next Safe Work
1. Identify Japanese Wiktionary edition data or another legal JA->JA structured source.
2. Identify Korean Wiktionary edition data or another legal KO->KO structured source.
3. Re-run endpoint/data smoke tests with common headwords.
4. Only then add one adapter slice at a time.

## Sources Checked
- WiktAPI overview: https://wiktapi.dev/
- Kaikki Japanese machine-readable dictionary: https://kaikki.org/dictionary/Japanese/index.html
- Kaikki Korean machine-readable dictionary: https://kaikki.org/dictionary/Korean/index.html
