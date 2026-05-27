# Uyghur Source Smoke Test

## Status
Run on May 22, 2026; extended MediaWiki page smoke completed the same day. Gate refreshed on May 27, 2026 in `docs/language-source-gates.md`.

Uyghur has useful morphology and pronunciation support data from English Wiktionary-derived Kaikki data, and a native Uyghur Wiktionary edition exists under CC BY-SA 4.0. The extended MediaWiki API smoke did **not** find enough non-placeholder noun/adjective/verb entries to unblock a first adapter.

Module refresh on May 22, 2026 kept the gate unchanged: no new approved native-definition source was identified during the Source gate unblock module.

## Smoke Tests

| Source | Query | Result | Decision |
|--------|-------|--------|----------|
| Kaikki Uyghur Wiktionary raw data | `https://kaikki.org/ugwiktionary/rawdata.html` | HTTP 404. | No direct `ugwiktionary` raw dump is available today. |
| Kaikki raw-data index | `https://kaikki.org/dictionary/rawdata.html` | English-edition raw data exists; supported non-English Wiktionary editions are limited and do not include Uyghur. | Do not plan Uyghur monolingual ingestion around Kaikki raw data yet. |
| Kaikki English-edition Uyghur page | `https://kaikki.org/dictionary/Uyghur/index.html` | HTTP 200. Current local smoke saw 4,152 JSONL rows; the public page reports thousands of word forms and English-Wiktionary extraction metadata. | Useful for Uyghur forms, IPA, romanization, and morphology smoke only; not a `ug -> ug` definition source. |
| Kaikki English-edition JSONL: `كىتاب` | exact `word = كىتاب`, `lang_code = ug` | Entry contains IPA, romanization `kitab`, plural `كىتابلار`, and case forms such as `كىتابنىڭ`, `كىتابغا`, `كىتابنى`, `كىتابدا`, `كىتابدىن`, with English gloss `book`. | Passes morphology/form smoke; fails monolingual-definition requirement. |
| Kaikki English-edition JSONL: `ئۆي` | exact `word = ئۆي`, `lang_code = ug` | Entry contains IPA, romanization `öy`, plural/case forms, and English glosses `house, room` / `home`. | Useful form and pronunciation support only. |
| Kaikki English-edition JSONL: verbs | `كەلمەك`, `يېمەك`, `ئوقۇماق` | Entries contain romanization, IPA for sampled verbs, and English glosses such as `to come`, `to eat`, `to read`. | Useful for verb-form planning; not a native-definition source. |
| Hosted WiktAPI search/direct Uyghur | `كىتاب`, `ئۆي` with `edition = ug`, `lang = ug` | Search returned empty arrays; direct word lookup returned HTTP 404-style JSON. | Do not use hosted WiktAPI for first Uyghur adapter. |
| Uyghur Wiktionary MediaWiki API rights | `meta=siteinfo`, `siprop=general|rightsinfo` | Site reports `wikiid = ugwiktionary`, `lang = ug`, `rtl`, and Creative Commons Attribution-Share Alike 4.0. | License path may be acceptable for future curated fixtures with attribution. |
| Uyghur Wiktionary page: `كىتاب` | `titles=كىتاب` | Page exists but definition field is a placeholder (`چۈشەندۈرۈشى يوق`). | Do not use as a first fixture. |
| Uyghur Wiktionary page: `ئۆي` | `titles=ئۆي` | Page has native Uyghur noun definitions and examples for building/room/institution/family senses. | Passes first native-definition smoke, but one good page is not enough to unblock adapter implementation. |
| Extended Uyghur Wiktionary batch | `ئۆي`, `ياخشى`, `يامان`, `كەلمەك`, `يېمەك`, `ئوقۇماق`, `بارماق`, `ئادەم`, `سۇ`, `بالا`, `تىل`, `قۇش`, `كۈن`, `ئاي`, `ئاتا`, `ئانا`, `ئوقۇش`, `كۆرۈش`, `چوڭ`, `كىچىك` | Many pages exist, but common adjectives/verbs often returned `#…`, no content, or placeholder-only records. `بارماق` has mixed noun/verb lines, including English-gloss style verb lines. | Does not unblock adapter fixtures. |
| Extended candidate batch from Kaikki word list | `ئىت`, `كۆك`, `قارا`, `كىچىك`, `ياخشى`, `چىرايلىق`, `بار`, `بولماق`, `بىلمەك`, `ئوقۇماق`, `يازماق`, `كەلمەك`, `كۆرمەك`, `قىلماق`, `دېمەك`, and other common nouns/verbs/adjectives | `ئىت` has a substantial native Uyghur noun definition; `كۆك` has minimal native sense labels (`ئاسمان`, `ئۆسۈملۈك`, `رەڭ`). Most sampled adjectives/verbs were missing, `#…`, or not useful as definitions. | Confirms there are native entries, but not enough balanced noun/adjective/verb evidence for first adapter. |

## License And Terms Decision

- **Potentially acceptable later**: curated Uyghur Wiktionary fixtures and live MediaWiki API-backed parsing under CC BY-SA 4.0, with source URL, page revision/oldid when available, license, and attribution carried in metadata.
- **Not accepted yet for app fixtures**: the extended smoke found too few non-placeholder entries across noun/adjective/verb categories.
- **Required API behavior**: automated Wikimedia calls must send a descriptive `User-Agent` or `Api-User-Agent`.
- **Still blocked**: bulk/offline Uyghur dictionary bundle from Kaikki `ugwiktionary` raw data, because that path is HTTP 404 today.
- **Still not sufficient**: Kaikki English-edition Uyghur JSONL, because its glosses are English even though its forms, IPA, and romanization are useful.
- **Still not approved**: any third-party Uyghur dictionary portals until API/terms/license approval is documented.

## Outcome

- Uyghur source smoke is complete for the current candidate set.
- Uyghur adapter implementation remains blocked because the sampled `ug.wiktionary.org` entries do not provide enough non-placeholder noun/adjective/verb definitions.
- The app should not add `ug` metadata yet because the first user-visible baseline needs more native-definition evidence and RTL UI smoke with Uyghur-specific text.
- May 27, 2026 refresh: no new accepted source or larger balanced non-placeholder candidate list is recorded; Uyghur remains source-gated.

## Next Safe Work

1. Look for another approved Uyghur-definition source or a larger curated Uyghur Wiktionary candidate list before revisiting adapter work.
2. Accept curated fixtures only if at least noun/adjective/verb entries have non-placeholder Uyghur definitions and stable source metadata.
3. Add script normalization tests for Uyghur Arabic code points, zero-width joiner/non-joiner handling, and ULY romanization only after the source decision.
4. Keep Kaikki English-edition forms as morphology research evidence, not as display definitions.

## Commands Used

```bash
curl -L https://kaikki.org/ugwiktionary/rawdata.html
curl -L https://kaikki.org/dictionary/rawdata.html
curl -L https://kaikki.org/dictionary/Uyghur/index.html
curl -L https://kaikki.org/dictionary/Uyghur/kaikki.org-dictionary-Uyghur.jsonl -o /tmp/kaikki-uyghur.jsonl
node -e "/* inspected exact Uyghur JSONL entries for كىتاب, ئۆي, ياخشى, يامان, بارماق, كەلمەك, يېمەك, ئوقۇماق */"
curl --get https://api.wiktapi.dev/v1/ug/search --data-urlencode q=كىتاب --data-urlencode lang=ug
curl --get https://api.wiktapi.dev/v1/ug/word/كىتاب --data-urlencode lang=ug
curl -H "User-Agent: dictionary-mobile-source-smoke/1.0 (local docs smoke)" --get https://ug.wiktionary.org/w/api.php --data-urlencode action=query --data-urlencode format=json --data-urlencode meta=siteinfo --data-urlencode "siprop=general|rightsinfo"
curl -H "User-Agent: dictionary-mobile-source-smoke/1.0 (local docs smoke)" --get https://ug.wiktionary.org/w/api.php --data-urlencode action=query --data-urlencode format=json --data-urlencode prop=revisions --data-urlencode rvprop=content --data-urlencode rvslots=main --data-urlencode titles=ئۆي
curl -H "User-Agent: dictionary-mobile-source-smoke/1.0 (local docs smoke)" --get https://ug.wiktionary.org/w/api.php --data-urlencode action=query --data-urlencode format=json --data-urlencode prop=revisions --data-urlencode "rvprop=ids|content" --data-urlencode rvslots=main --data-urlencode "titles=ئۆي|ياخشى|يامان|كەلمەك|يېمەك|ئوقۇماق|بارماق|ئادەم|سۇ|بالا|تىل|قۇش|كۈن|ئاي|ئاتا|ئانا|ئوقۇش|كۆرۈش|چوڭ|كىچىك"
curl -H "User-Agent: dictionary-mobile-source-smoke/1.0 (local docs smoke)" --get https://ug.wiktionary.org/w/api.php --data-urlencode action=query --data-urlencode format=json --data-urlencode generator=allpages --data-urlencode gapnamespace=0 --data-urlencode gaplimit=80 --data-urlencode prop=revisions --data-urlencode "rvprop=ids|content" --data-urlencode rvslots=main
```

## Sources Checked

- Kaikki Uyghur English-edition page: https://kaikki.org/dictionary/Uyghur/index.html
- Kaikki raw data page: https://kaikki.org/dictionary/rawdata.html
- Uyghur Wiktionary API: https://ug.wiktionary.org/w/api.php
- Wikimedia User-Agent policy: https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy/en
- WiktAPI: https://wiktapi.dev/
- Uyghur Latin alphabet reference: https://www.uyghur-language.net/sites/www.uyghur-language.net/files/PDF/Uyghur%20Latin%20Yeziqi.pdf
