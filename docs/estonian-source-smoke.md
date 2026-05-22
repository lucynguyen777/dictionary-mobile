# Estonian Source Smoke Test

## Status
Run on May 22, 2026.

Estonian now has an accepted tiny-baseline source path: curated `et.wiktionary.org` MediaWiki API fixtures under CC BY-SA 4.0. Sõnaveeb/Ekilex is also promising under CC BY 4.0, but runtime API integration still needs an API key and endpoint parser work.

## Smoke Tests

| Source | Query | Result | Decision |
|--------|-------|--------|----------|
| WiktAPI editions | `https://api.wiktapi.dev/v1/editions` | Edition list does not include `et`. | Do not use hosted WiktAPI for Estonian. |
| WiktAPI Estonian search | `/v1/et/search?q=maja&lang=et` | Returned an empty result array. | Not viable for first baseline. |
| Estonian Wiktionary siteinfo | `et.wiktionary.org/w/api.php?action=query&meta=siteinfo&siprop=general|rightsinfo` | Site reports `wikiid = etwiktionary`, `lang = et`, and Creative Commons Attribution-Share Alike 4.0. | License path is acceptable for curated fixtures with attribution. |
| Estonian Wiktionary page: `maja` | MediaWiki revisions API | Page contains native Estonian noun definition and synonym data for `maja`. | Accept as one candidate fixture. |
| Estonian Wiktionary page: `jää` | MediaWiki revisions API | Page contains native Estonian noun definition, forms, translations, and related derivations. | Accept as one candidate fixture. |
| Estonian Wiktionary page: `öö` | MediaWiki revisions API | Page contains native Estonian noun definitions and inflection data. | Accept as one candidate fixture. |
| Estonian Wiktionary page: `sööma` | MediaWiki revisions API | Page exists and contains Estonian verb material, but parser extraction needs a focused fixture pass because the page is long and mixed with phrase lists. | Candidate, but verify before committing a verb fixture. |
| Sõnaveeb public page | `https://sonaveeb.ee/search/unif/dlall/dsall/maja/1/est` | Public web surface returns dictionary content for `maja`. | Good UX/source reference, not the first parser target. |
| Sõnaveeb/Ekilex license | `https://sonaveeb.ee/about?uilang=en` | Page states Ekilex standard license is CC BY 4.0 and material can be shared/adapted for any purpose with attribution/change notes. | Source license is promising for future production expansion. |
| Ekilex API docs | GitHub wiki | API requires a security key from an Ekilex user profile; key must be sent as `ekilex-api-key` header. | Runtime/API integration is blocked until API key management is designed. |

## Outcome
- Estonian adapter implementation is now unblocked for a tiny curated fixture baseline using Estonian Wiktionary MediaWiki pages.
- Sõnaveeb/Ekilex should remain a later production candidate because it needs API key handling and endpoint-specific parser work.
- Hosted WiktAPI remains unsuitable for Estonian.
- Offline Estonian packs remain blocked until attribution/offline packaging is implemented.

## Next Safe Work
1. Add `et` metadata with `dictionaryStatus: 'monolingual'` only when the fixture adapter lands.
2. Build tiny fixtures from `maja`, `jää`, `öö`, and one verified verb page.
3. Add NFC/diacritic-preserving normalization for `ä`, `ö`, `ü`, and `õ`.
4. Reuse Finnish/Hungarian Uralic morphology patterns conservatively for fixture-backed case forms only.
5. Carry `etwiktionary`, source URL, revision id, and CC BY-SA 4.0 attribution in fixture metadata.

## Commands Used
```bash
curl -L https://api.wiktapi.dev/v1/editions
curl --get https://api.wiktapi.dev/v1/et/search --data-urlencode q=maja --data-urlencode lang=et
curl -H "User-Agent: dictionary-mobile-source-smoke/1.0 (local docs smoke)" --get https://et.wiktionary.org/w/api.php --data-urlencode action=query --data-urlencode format=json --data-urlencode meta=siteinfo --data-urlencode "siprop=general|rightsinfo"
curl -H "User-Agent: dictionary-mobile-source-smoke/1.0 (local docs smoke)" --get https://et.wiktionary.org/w/api.php --data-urlencode action=query --data-urlencode format=json --data-urlencode prop=revisions --data-urlencode "rvprop=ids|content" --data-urlencode rvslots=main --data-urlencode "titles=maja|sööma|öö|jää"
curl -L "https://sonaveeb.ee/search/unif/dlall/dsall/maja/1/est"
curl -L "https://sonaveeb.ee/about?uilang=en"
curl -L "https://github.com/keeleinstituut/ekilex/wiki/Ekilex-API"
```

## Sources Checked
- Sõnaveeb/Ekilex license: https://sonaveeb.ee/about?uilang=en
- Ekilex API docs: https://github.com/keeleinstituut/ekilex/wiki/Ekilex-API
- Estonian Wiktionary API: https://et.wiktionary.org/w/api.php
- WiktAPI editions/search: https://api.wiktapi.dev/v1/editions
