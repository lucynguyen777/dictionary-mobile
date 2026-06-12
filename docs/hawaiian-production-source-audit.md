# Hawaiian Production Source Audit

## Decision

Hawaiian remains a **local-fixture monolingual preview with production promotion source-blocked**.

The Kaikki URL `https://kaikki.org/dictionary/Hawaiian/kaikki.org-dictionary-Hawaiian.jsonl` contains 4,085 usable Hawaiian headword rows and has a reproducible revision date (`2026-06-07`), but sampled definitions for `aloha`, `hale`, `wai`, `ʻohana`, and `ʻōlelo` are English glosses. It is useful for headwords, pronunciation, forms, and bilingual helper research, but it cannot satisfy the app's Hawaiian-to-Hawaiian monolingual production rule.

The hosted WiktAPI Hawaiian endpoint still returns `404` for common probes. No separate Hawaiian-Wiktionary raw edition was available from the checked Kaikki raw-data index. Wehewehe Wikiwiki/Ulukau remains the strongest lexical candidate, but production use requires explicit API/scraping/license permission.

## Safe Work Completed

- Verified the existing ʻokina normalization and kahakō-aware fixture fallback remain appropriate.
- Added a corpus extraction guard requiring every candidate to declare its definition language.
- Rejected English-definition Kaikki data for Hawaiian monolingual packaging.
- Kept English-gloss data out of runtime fixtures and production packs.

## Unblock Requirements

1. Obtain compatible permission/API terms for a Hawaiian-definition source such as Wehewehe Wikiwiki/Ulukau, or identify another source with Hawaiian-language definitions.
2. Record source URL, license, revision/retrieval date, attribution, and transformation policy.
3. Prove at least 5,000 attributed Hawaiian-definition entries, or explicitly revise the shared threshold through a product decision supported by source-size evidence.
4. Run a 100-headword Hawaiian sample covering ʻokina/kahakō contrasts and missing-result behavior.
5. Build and smoke-test an offline candidate only after the definition-language gate passes.
