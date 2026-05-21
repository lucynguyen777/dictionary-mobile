# Uzbek Source Smoke Test

## Status
Uzbek planning found useful morphology/script support data, but no accepted production `uz -> uz` definition source yet. Keep Uzbek adapter implementation blocked until a true Uzbek-definition source is approved.

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

## Outcome
- A source-backed Uzbek adapter should not be added yet.
- Kaikki English-edition Uzbek data is valuable for forms, Cyrillic/Latin variants, IPA on some words, and morphology fixtures, but it does not satisfy the monolingual-first rule because definitions are English.
- Hosted WiktAPI currently does not provide reliable Uzbek lookups for sampled common words.
- Izoh.uz is the most promising true Uzbek-definition candidate, but production use needs terms/API approval.

## Next Safe Work
1. Confirm whether Izoh.uz allows API access or licensed app usage.
2. If Izoh.uz is not usable, investigate Uzbek Wiktionary through MediaWiki API and verify that entries contain Uzbek definitions, not only translations.
3. Add Uzbek normalization tests only after deciding whether the app will support Latin-only first or Latin plus Cyrillic fallback from day one.
4. Keep bilingual Uzbek and committed fixtures blocked until source/license decisions are documented.

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
```

## Sources Checked
- Izoh.uz: https://izoh.uz/
- Kaikki Uzbek English-edition page: https://kaikki.org/dictionary/Uzbek/index.html
- Kaikki raw data page: https://kaikki.org/dictionary/rawdata.html
- WiktAPI: https://wiktapi.dev/
- UniMorph: https://unimorph.github.io/
- UzMorphAnalyser: https://arxiv.org/abs/2405.14179
- MorphUz / Uzbek morphology analyser: https://www.sciencedirect.com/science/article/pii/S2949719125000718
