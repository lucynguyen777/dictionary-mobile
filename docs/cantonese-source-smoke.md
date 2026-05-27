# Cantonese Source Smoke Test

## Status
Run on May 22, 2026. Gate refreshed on May 27, 2026 in `docs/language-source-gates.md`.

Cantonese remains blocked for monolingual dictionary definitions. Words.hk exposes useful public-domain word/pronunciation datasets, but the currently confirmed public-domain pages are not full `yue -> yue` dictionary definitions. Do not build a Cantonese definition adapter until a definition source license is accepted.

## Smoke Tests

| Source | Query | Result | Decision |
|--------|-------|--------|----------|
| Existing app metadata | `data/languages.ts` | `yue` exists as `dictionaryStatus: 'unavailable'` with no adapter key. | Keep as unavailable. |
| Words.hk data overview | `https://words.hk/faiman/analysis/` | Data pages list multiple datasets and mark them public domain with credits appreciated. | Useful for future word/pronunciation lists and search aids. |
| Words.hk word list | `https://words.hk/faiman/analysis/wordslist/` | Page says the dataset contains dictionary headwords and pronunciations, licensed public domain. | Accept only for wordlist/Jyutping support, not definitions. |
| Words.hk JSON probe | `https://words.hk/faiman/analysis/wordlist/?format=json` | Returned server error in local smoke. | Do not rely on this endpoint shape without a follow-up probe. |
| Words.hk dictionary content | Public site and third-party packaging notes | Confirmed open public-domain pages are lists/indexes, while dictionary contents are treated separately by downstream package metadata. | Definition reuse still needs explicit permission or a confirmed open dump. |
| Cantonese WiktAPI | Existing plan smoke | Direct hosted `yue` WiktAPI path returned 404. | Not viable for first adapter. |
| Kaikki English-edition Cantonese | Existing plan smoke | Contains English-edition Cantonese material, not a Cantonese-definition source. | Useful only for support metadata. |

## Outcome
- Cantonese monolingual adapter implementation remains blocked.
- Words.hk public-domain word/pronunciation lists can support future segmentation, Jyutping display, or suggestions after endpoint stability is verified.
- Full dictionary definitions from Words.hk must not be bundled, scraped, or committed unless explicit compatible permission is documented.
- The prior decision note that Cantonese was unblocked by Words.hk open CC BY-SA data is stale and has been corrected in `.docs/decisions/dictionary-source-licensing.md`.
- May 27, 2026 refresh: no new accepted full-definition source is recorded; `yue` remains unavailable until a compatible Cantonese definition source is accepted.

## Next Safe Work
1. Contact/request Words.hk permission or locate a confirmed open full-definition dump.
2. Keep `yue` unavailable in runtime metadata until definition fixtures are legally accepted.
3. If word/pronunciation list work is needed, build it as a separate non-definition helper with Words.hk credit and no dictionary definitions.
4. Re-run endpoint probes before depending on any Words.hk JSON URL.

## Commands Used
```bash
curl -L "https://words.hk/faiman/analysis/"
curl -L "https://words.hk/faiman/analysis/wordslist/"
curl -L "https://words.hk/faiman/analysis/wordlist/?format=json"
```

## Sources Checked
- Words.hk data overview: https://words.hk/faiman/analysis/
- Words.hk word list: https://words.hk/faiman/analysis/wordslist/
- WiktAPI: https://wiktapi.dev/
