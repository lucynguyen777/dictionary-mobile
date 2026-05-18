# Turkish Source Smoke Test

## Status
Turkish has a viable monolingual source candidate through Kaikki/Wiktextract raw data from the Turkish Wiktionary edition. Do not add a Turkish adapter until licensing/attribution policy is accepted and a small parser fixture path is approved.

## Smoke Tests
Run on May 18, 2026.

| Source | Query | Result | Decision |
|--------|-------|--------|----------|
| Kaikki Turkish Wiktionary raw data | `https://kaikki.org/trwiktionary/rawdata.html` | Raw Wiktextract JSONL from `trwiktionary`; page states glosses and metadata are in Turkish. Current open result showed extraction from the 2026-03-02 trwiktionary dump, extracted 2026-03-07. | Candidate TR->TR source path found. |
| Hosted WiktAPI Turkish search | `curl "https://api.wiktapi.dev/v1/tr/search?q=ev&lang=tr"` | Search returns Turkish entries, but prefix ranking starts with capitalized/proper-name forms before exact lowercase `ev`. | Search can support suggestions but needs exact-match filtering. |
| Hosted WiktAPI Turkish word: `ev` | `curl "https://api.wiktapi.dev/v1/tr/word/ev?lang=tr"` | Direct word lookup returns Turkish glosses, IPA, translations, and noun forms. | Usable for simple ASCII Turkish headwords. |
| Hosted WiktAPI Turkish word: `yemek` | `curl "https://api.wiktapi.dev/v1/tr/word/yemek?lang=tr"` | Direct word lookup returns Turkish glosses, IPA, translations, and noun forms for the food/meal sense. | Usable, but sampled result is noun-oriented; verb/infinitive handling needs more source work. |
| Hosted WiktAPI Turkish word: `ışık` | `curl "https://api.wiktapi.dev/v1/tr/word/ışık?lang=tr"` | HTTP 404, even though raw data has the entry. | Do not rely on hosted WiktAPI direct lookup for Turkish dotted/dotless casing coverage. |
| Hosted WiktAPI Turkish word: `İstanbul` | `curl "https://api.wiktapi.dev/v1/tr/word/İstanbul?lang=tr"` | HTTP 404, even though raw data has the entry. | Do not rely on hosted WiktAPI direct lookup for Turkish capital dotted I coverage. |
| `trwiktionary` raw JSONL: `ev` | streamed `raw-wiktextract-data.jsonl.gz` and matched `word = ev`, `lang_code = tr` | Record contains Turkish glosses, POS, examples, categories, topics, and extensive noun case/number/possessive forms. | Raw dump path passes noun schema smoke. |
| `trwiktionary` raw JSONL: `yemek` | streamed `raw-wiktextract-data.jsonl.gz` and matched `word = yemek`, `lang_code = tr` | Record contains Turkish glosses, examples, categories, and noun forms for the food/meal sense. | Needs additional verb-form smoke before claiming robust verb lookup. |
| `trwiktionary` raw JSONL: `ışık` | streamed `raw-wiktextract-data.jsonl.gz` and matched `word = ışık`, `lang_code = tr` | Record contains Turkish glosses, examples, dotted/dotless casing, and noun forms. | Raw dump handles Turkish-specific casing correctly. |
| `trwiktionary` raw JSONL: `İstanbul` | streamed `raw-wiktextract-data.jsonl.gz` and matched `word = İstanbul`, `lang_code = tr` | Record contains Turkish glosses, examples, proper noun POS, and apostrophe/case forms such as `İstanbul'u`, `İstanbul'a`, `İstanbul'da`. | Raw dump handles capital dotted I and proper noun suffix forms. |

## Outcome
- `trwiktionary` raw data is the safest first source path for Turkish monolingual lookup because it preserves Turkish glosses, casing, POS, examples, and forms.
- Hosted WiktAPI can return direct entries for simple ASCII headwords like `ev` and `yemek`, but sampled direct lookup failed for Turkish-specific casing words `ışık` and `İstanbul`.
- Turkish adapter planning should prefer raw-dump ingestion or self-hosted/indexed data until hosted direct lookup is proven stable for Turkish Unicode casing.
- Turkish remains unregistered in app metadata until source licensing/attribution and fixture policy are accepted.

## Next Safe Work
1. Decide whether Wiktionary-derived fixture and production attribution policy is acceptable.
2. If accepted, create tiny curated fixtures for `ev`, `ışık`, `İstanbul`, plus one clearly verbal lemma.
3. Add Turkish casing normalization tests before adapter code.
4. Add only `tr -> tr` monolingual adapter work first; keep bilingual Turkish blocked.

## Sources Checked
- Kaikki Turkish Wiktionary raw data: https://kaikki.org/trwiktionary/rawdata.html
- WiktAPI overview: https://wiktapi.dev/
- WiktAPI quickstart: https://wiktapi.dev/quickstart
- UniMorph project: https://unimorph.github.io/
