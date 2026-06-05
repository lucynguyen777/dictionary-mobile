# Language Source And Corpus Smoke

This is the v1.3.6 source/corpus smoke report for the first language-parity candidates after the v1.3.3 inventory. It does not change runtime lookup behavior and does not promote preview languages to production parity.

Live smoke was run on 2026-06-05 from the local development machine with a bounded probe set. Tests use the frozen report in `data/languageSourceCorpusSmoke.ts` so CI does not depend on network availability.

## Summary

| Candidate | Current state | Decision | Main blocker | Next action |
| --- | --- | --- | --- | --- |
| Spanish monolingual `es -> es` | Monolingual preview | Expand corpus first | Common WiktAPI entries work, but sampled diacritic/adjective behavior is unreliable and offline packaging is not proven. | Keep preview; audit larger WiktAPI/dump coverage, accent fallback, irregular verbs, attribution, and offline packaging. |
| Malay monolingual `ms -> ms` | Monolingual preview | Expand corpus first | Common headwords work, but complex `meN-`/`peN-` allomorphs and corpus size are unproven. | Keep preview; audit more affixed forms and choose a packaged corpus or stemmer strategy. |
| French monolingual `fr -> fr` | Monolingual preview | Expand corpus first | Common WiktAPI entries work, but corpus size/offline path and broader UI smoke are not complete. | Keep monolingual preview; measure dump/API coverage and package an attributed corpus candidate. |
| French to Vietnamese `fr -> vi` | Production pair | Keep production pair, grow | Supported in-app, but coverage size, source metadata, and offline packaging are not measured enough for 100% readiness. | Keep production-pair status; measure broader headwords and define legal offline packaging. |

## Probe Results

| Candidate | Probe | Source | Result | Evidence |
| --- | --- | --- | --- | --- |
| `es` | `casa` | WiktAPI Spanish word endpoint | Pass | Direct lookup returned entries for a common noun. |
| `es` | `correr` | WiktAPI Spanish word endpoint | Pass | Direct lookup returned entries for a common verb. |
| `es` | `pequena` / `pequeña` | WiktAPI Spanish word endpoint | Fail | Direct lookup returned 404 for sampled adjective forms, so accent/adjective fallback remains a parity blocker. |
| `ms` | `rumah` | WiktAPI Malay word endpoint | Pass | Direct lookup returned an entry for a common noun. |
| `ms` | `makan` | WiktAPI Malay word endpoint | Pass | Direct lookup returned entries for a common verb/food word. |
| `ms` | `baik` | WiktAPI Malay word endpoint | Pass | Direct lookup returned an entry for a common adjective. |
| `fr` | `maison` | WiktAPI French word endpoint | Pass | Direct lookup returned entries for a common noun. |
| `fr` | `livre` | WiktAPI French word endpoint | Pass | Direct lookup returned entries for a common noun. |
| `fr` | `chercher` | WiktAPI French word endpoint | Pass | Direct lookup returned an entry for a common verb. |
| `fr->vi` | `maison` | MinhQnd lookup with `def_lang=vi` | Pass | Lookup returned `exists=true` and a French result. |
| `fr->vi` | `livre` | MinhQnd lookup with `def_lang=vi` | Pass | Lookup returned `exists=true` and a French result. |
| `fr->vi` | `vi->fr` policy check | Language source gate policy | Partial | Reverse pair remains source-gated; machine translation must not be used as dictionary data. |

## Decisions

- Do not promote `es`, `ms`, or monolingual `fr` to production parity in v1.3.6.
- Keep `fr->vi` as a supported production pair, but not as 100% complete because source-size, attribution/offline packaging, and broader smoke are still open.
- Keep `vi->fr` source-gated. DeepL/OpenAI translation cannot be used as dictionary data.
- No new offline pack is produced in this module; offline pack expansion remains v1.3.10 after source/corpus gates pass.

## Next Modules

1. Spanish expansion candidate: measure more nouns, adjectives, verbs, plural/inflected forms, accents, examples, related words, and dump/offline packaging.
2. Malay expansion candidate: measure `meN-`/`peN-` forms, reduplication, examples, related words, and a stemmer/dump strategy.
3. French expansion candidate: measure French Wiktionary dump/API coverage and source metadata for monolingual offline packaging.
4. French-Vietnamese expansion candidate: measure broader headword coverage, source metadata, and legal offline packaging.
5. Offline pack expansion: only package sources that pass attribution/license/source-date/checksum requirements.

## Source Notes

- WiktAPI endpoints: `https://api.wiktapi.dev/v1/{edition}/word/{word}?lang={code}`.
- MinhQnd lookup endpoint: `https://dict.minhqnd.com/api/v1/lookup?word={word}&lang=fr&def_lang=vi`.
- Attribution and ShareAlike handling must follow `docs/source-attribution-packaging.md`.
- Cross-language source gates must follow `docs/language-source-gates.md`.
