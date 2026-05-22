# Kazakh Source Smoke Test

## Status
Run on May 22, 2026.

Kazakh now has an accepted small-fixture and adapter candidate through Kazakh Wiktionary (`kk.wiktionary.org`) via the MediaWiki API, not through a Kaikki `kkwiktionary` raw dump. Keep the Kaikki raw-dump path blocked until Kaikki publishes `kkwiktionary`, but allow a narrow Kazakh adapter slice against Kazakh Wiktionary pages under the existing CC BY-SA attribution rules.

## Smoke Tests

| Source | Query | Result | Decision |
|--------|-------|--------|----------|
| Kaikki Kazakh Wiktionary raw data | `https://kaikki.org/kkwiktionary/rawdata.html` | HTTP 404. | No direct `kkwiktionary` raw dump is available today. |
| Kaikki raw-data index | `https://kaikki.org/dictionary/rawdata.html` | English-edition raw data exists; other Wiktionary editions are limited/work in progress, and Kazakh is not exposed as a dedicated edition path. | Do not plan Kazakh monolingual ingestion around Kaikki raw data yet. |
| Kaikki English-edition Kazakh page | `https://kaikki.org/dictionary/Kazakh/index.html` | HTTP 200, 11,693 word forms, 32.6MB postprocessed JSONL derived from English Wiktionary. | Useful for Kazakh forms, IPA, romanization, and morphology smoke only; not a `kk -> kk` definition source. |
| Kaikki English-edition JSONL: `кітап` | exact `word = кітап`, `lang_code = kk` | Entry contains IPA, romanization, noun case/plural forms such as `кітаптар`, `кітаптың`, `кітапқа`, and English gloss `book`. | Passes morphology/form smoke; fails monolingual-definition requirement. |
| Kaikki English-edition JSONL: `жақсы` | exact `word = жақсы`, `lang_code = kk` | Entry contains IPA/romanization and English gloss `good`. | Useful pronunciation/form support only. |
| Hosted WiktAPI search/direct Kazakh | `кітап`, `үй` with `edition = kk`, `lang = kk` | Search returned empty arrays; direct word lookup returned HTTP 404-style JSON. | Do not use hosted WiktAPI for first Kazakh adapter. |
| Kazakh Wiktionary MediaWiki API rights | `meta=siteinfo`, `siprop=general|rightsinfo` | Site reports `wikiid = kkwiktionary`, `lang = kk`, and Creative Commons Attribution-Share Alike 4.0. | License path accepted for small fixtures and source-backed adapter work with attribution. |
| Kazakh Wiktionary page: `кітап` | `titles=кітап`, rendered page and API wikitext | Page has Kazakh noun section and two Kazakh definitions for the book/notebook sense. | Passes `kk -> kk` definition smoke. |
| Kazakh Wiktionary page: `үй` | `titles=үй` | Page has Kazakh noun definitions for dwelling/household/family senses. | Passes `kk -> kk` definition smoke. |
| Kazakh Wiktionary page: `жақсы` | `titles=жақсы` | Page has Kazakh adjective definition plus antonym/translation data. | Passes adjective fixture smoke. |
| Kazakh Wiktionary verb pages | `келу`, `айту`, `оқу`, `бару`, `жазу`, `көру` | `келу` and `айту` contain usable definitions; several common verbs still use `Анықтамасы қажет` placeholders. `оқу` has useful conjugation tables but no accepted definition fixture. | Use `келу` or `айту` for first verb fixture; keep `оқу` only as form/morphology research unless a definition source is added. |

## License And Terms Decision

- **Accepted for next Kazakh adapter slice**: curated Kazakh Wiktionary fixtures and live MediaWiki API-backed parsing under CC BY-SA 4.0, with source URL, page revision/oldid when available, license, and attribution carried in fixture/source metadata.
- **Required API behavior**: automated calls must send a descriptive `User-Agent` or `Api-User-Agent`; a local Node smoke without a User-Agent was rejected by Wikimedia, so adapter code/tests must not rely on generic default agents.
- **Still blocked**: bulk/offline Kazakh dictionary bundle from Kaikki `kkwiktionary` raw data, because that path is HTTP 404 today.
- **Still not sufficient**: Kaikki English-edition Kazakh JSONL, because its glosses are English even though its forms and IPA are useful.
- **Still not approved**: Sozdik.kz and official/state dictionary content until API/terms/license approval is documented.

## Outcome

- Kazakh source smoke is complete.
- The previous "true Kazakh-definition source" blocker is resolved for a small `kk -> kk` baseline using Kazakh Wiktionary MediaWiki API and curated CC BY-SA fixtures.
- First implementation is complete with a tiny parser/fixture path for `кітап`, `үй`, `жақсы`, and `айту`.
- Do not add Kaikki raw-dump ingestion for Kazakh until `kkwiktionary` appears on Kaikki.

## Next Safe Work

1. Expand Latin romanization as a secondary lookup hint, not as canonical storage.
2. Add more verb fixtures only after non-placeholder Kazakh Wiktionary definitions are sampled.
3. Keep morphology fallback tests aligned with Kaikki English-edition forms as research evidence.
4. Revisit bulk/offline import only after `kkwiktionary` raw data or another approved bulk source exists.

## Commands Used

```bash
curl -L https://kaikki.org/kkwiktionary/rawdata.html
curl -L https://kaikki.org/dictionary/rawdata.html
curl -L https://kaikki.org/dictionary/Kazakh/index.html
curl -L https://kaikki.org/dictionary/Kazakh/kaikki.org-dictionary-Kazakh.jsonl -o /tmp/kaikki-kazakh.jsonl
node -e "/* inspected exact Kazakh JSONL entries for кітап, үй, оқу, жақсы */"
curl --get https://api.wiktapi.dev/v1/kk/search --data-urlencode q=кітап --data-urlencode lang=kk
curl --get https://api.wiktapi.dev/v1/kk/word/кітап --data-urlencode lang=kk
curl -A "dictionary-mobile-source-smoke/1.0 (local docs smoke)" --get https://kk.wiktionary.org/w/api.php --data-urlencode action=query --data-urlencode format=json --data-urlencode meta=siteinfo --data-urlencode "siprop=general|rightsinfo"
curl -A "dictionary-mobile-source-smoke/1.0 (local docs smoke)" --get https://kk.wiktionary.org/w/api.php --data-urlencode action=query --data-urlencode format=json --data-urlencode prop=revisions --data-urlencode rvprop=content --data-urlencode rvslots=main --data-urlencode titles=кітап
```

## Sources Checked

- Kaikki Kazakh English-edition page: https://kaikki.org/dictionary/Kazakh/index.html
- Kaikki raw data page: https://kaikki.org/dictionary/rawdata.html
- Kazakh Wiktionary `кітап`: https://kk.wiktionary.org/wiki/кітап
- Kazakh Wiktionary API: https://kk.wiktionary.org/w/api.php
- Wikimedia User-Agent policy: https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy/en
- WiktAPI: https://wiktapi.dev/
- Sozdik.kz: https://sozdik.kz/
