# Uzbek Source Smoke Test

## Status
Run on May 21, 2026; refreshed on May 22, 2026 with Uzbek Wiktionary MediaWiki API smoke.

Uzbek now has an accepted tiny-baseline source path: curated `uz.wiktionary.org` MediaWiki API fixtures under CC BY-SA 4.0. Izoh.uz remains blocked pending API/terms approval, and Kaikki English-edition Uzbek remains morphology/script support only.

## Smoke Tests
Run on May 21, 2026.

| Source | Query | Result | Decision |
|--------|-------|--------|----------|
| Kaikki Uzbek Wiktionary raw data | `https://kaikki.org/uzwiktionary/rawdata.html` | HTTP 404. | No direct `uzwiktionary` raw path found through Kaikki. |
| Kaikki English-edition Uzbek index | `https://kaikki.org/dictionary/Uzbek/index.html` | HTTP 200. Page says the postprocessed JSONL is derived from English Wiktionary dump data extracted on 2026-05-17 from the 2026-05-01 dump. | Useful machine-readable support data, but not monolingual Uzbek definitions. |
| Kaikki English-edition Uzbek JSONL | `kaikki.org-dictionary-Uzbek.jsonl.gz` | Downloaded 1.6MB gzip with 4,230 JSONL entries. | Viable for form/transliteration/pronunciation smoke only. |
| Kaikki JSONL: `uy` | exact `word = uy`, `lang_code = uz` | Entry contains noun forms such as `uyning`, `uyga`, `uyni`, `uyda`, `uydan`, possessive forms, and English gloss `home; house`. | Passes morphology/form smoke; fails monolingual-definition requirement. |
| Kaikki JSONL: `qilmoq` | exact `word = qilmoq`, `lang_code = uz` | Entry contains verb conjugation forms such as `qila`, `qilib`, `qilish`, and negative forms. | Passes verb-form smoke; not a monolingual definition source. |
| Kaikki JSONL: `китоб` | exact `word = китоб`, `lang_code = uz` | Entry marks a Cyrillic spelling of `kitob` and includes romanization. | Confirms Cyrillic variants appear in source data. |
| Hosted WiktAPI direct Uzbek | `uy`, `kitob`, `qilmoq`, `o'zbek`, `Ўзбек`, `китоб` | Direct word endpoint returned 404 for sampled entries. | Not viable for first Uzbek baseline. |
| Hosted WiktAPI search Uzbek | same sample words | Search endpoint returned empty result arrays or rejected unencoded Cyrillic before URL-encoding. | Not viable for first Uzbek baseline. |
| Izoh.uz | public web surface | True Uzbek explanatory dictionary candidate; visible database count is large enough for a baseline. | Candidate production source only after API/terms/license approval. |
| National Encyclopedia of Uzbekistan | OʻzME | Open-license encyclopedia signal, not a dictionary. | Potential proper-noun/encyclopedic support source, not baseline dictionary. |
| Uzbek morphology research | UzMorphAnalyser / MorphUz | Research/tooling candidates for Uzbek morphology and spell checking. | Useful for lemmatization research only; not definition sources. |
| Uzbek Wiktionary siteinfo | `meta=siteinfo`, `siprop=general|rightsinfo` | Site reports `wikiid = uzwiktionary`, script variants `uz-latn` and `uz-cyrl`, and Creative Commons Attribution-Share Alike 4.0. | License path is acceptable for curated fixtures with attribution. |
| Uzbek Wiktionary page: `uy` | MediaWiki revisions API | Page contains native Uzbek definitions and examples for building/room/institution/family senses. | Accept as one candidate noun fixture. |
| Uzbek Wiktionary page: `kitob` | MediaWiki revisions API | Page contains native Uzbek definitions and examples for book/work senses. | Accept as one candidate noun fixture. |
| Uzbek Wiktionary page: `qilmoq` | MediaWiki revisions API | Page contains native Uzbek verb definitions, etymology, examples, and synonym data. | Accept as one candidate verb fixture. |
| Uzbek Wiktionary page: `oʻzbek` | MediaWiki revisions API | Page contains native Uzbek noun/adjective senses for the people/language relation. | Accept as one candidate adjective/noun fixture. |

## Outcome
- A tiny source-backed Uzbek adapter can now be planned from curated Uzbek Wiktionary fixtures.
- Kaikki English-edition Uzbek data is valuable for forms, Cyrillic/Latin variants, IPA on some words, and morphology fixtures, but it does not satisfy the monolingual-first rule because definitions are English.
- Hosted WiktAPI currently does not provide reliable Uzbek lookups for sampled common words.
- Izoh.uz is the most promising true Uzbek-definition candidate, but production use needs terms/API approval.

## Next Safe Work
1. Implement a tiny `uzwiktionary` fixture baseline with source URL, revision id, and CC BY-SA 4.0 attribution metadata.
2. Add Uzbek normalization tests for Latin apostrophe variants and Cyrillic mapping before broad morphology.
3. Keep Izoh.uz integration blocked until API/license terms are documented.
4. Keep bilingual Uzbek and offline/bulk Uzbek packs blocked until source/license decisions are documented.

## Commands Used
```bash
curl -L https://kaikki.org/uzwiktionary/rawdata.html
curl -L https://kaikki.org/dictionary/Uzbek/index.html
curl -L https://kaikki.org/dictionary/Uzbek/kaikki.org-dictionary-Uzbek.jsonl.gz -o /tmp/kaikki-uzbek.jsonl.gz
gzip -cd /tmp/kaikki-uzbek.jsonl.gz | wc -l
gzip -cd /tmp/kaikki-uzbek.jsonl.gz | grep -m 1 '"word": "uy"'
gzip -cd /tmp/kaikki-uzbek.jsonl.gz | grep -m 1 '"word": "qilmoq"'
gzip -cd /tmp/kaikki-uzbek.jsonl.gz | grep -m 1 '"word": "китоб"'
curl --get https://api.wiktapi.dev/v1/uz/search --data-urlencode q=uy --data-urlencode lang=uz
curl --get https://api.wiktapi.dev/v1/uz/word/uy --data-urlencode lang=uz
curl -H "User-Agent: dictionary-mobile-source-smoke/1.0 (local docs smoke)" --get https://uz.wiktionary.org/w/api.php --data-urlencode action=query --data-urlencode format=json --data-urlencode meta=siteinfo --data-urlencode "siprop=general|rightsinfo"
curl -H "User-Agent: dictionary-mobile-source-smoke/1.0 (local docs smoke)" --get https://uz.wiktionary.org/w/api.php --data-urlencode action=query --data-urlencode format=json --data-urlencode prop=revisions --data-urlencode "rvprop=ids|content" --data-urlencode rvslots=main --data-urlencode "titles=uy|kitob|qilmoq|oʻzbek|китоб"
```

## Sources Checked
- Izoh.uz: https://izoh.uz/
- Kaikki Uzbek English-edition page: https://kaikki.org/dictionary/Uzbek/index.html
- Kaikki raw data page: https://kaikki.org/dictionary/rawdata.html
- WiktAPI: https://wiktapi.dev/
- Uzbek Wiktionary API: https://uz.wiktionary.org/w/api.php
- UniMorph: https://unimorph.github.io/
- UzMorphAnalyser: https://arxiv.org/abs/2405.14179
- MorphUz / Uzbek morphology analyser: https://www.sciencedirect.com/science/article/pii/S2949719125000718
