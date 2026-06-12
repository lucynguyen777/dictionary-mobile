# Somali Production Source Audit

## Decision

Somali remains an **implemented local-fixture monolingual preview with production promotion source-blocked**.

- Hosted WiktAPI returned `404` for `buug`, `guri`, and `bisad` on 2026-06-12.
- `https://kaikki.org/dictionary/Somali/kaikki.org-dictionary-Somali.jsonl` is revisioned (`2026-06-07`) and useful for Somali headword/helper research, but it is English-Wiktionary-derived with English definitions. The definition-language guard rejects it for Somali monolingual packaging.
- No approved Somali-definition corpus with at least 5,000 attributed entries is currently selected.

## Safe Work Completed

- Preserved existing exact lookup, article stripping, consonant dedoubling, and `-o/-yo` plural behavior.
- Added conservative coverage for fixture-backed `buugaag -> buug`.
- Added extended article/demonstrative handling for forms such as `buuggaas`, `buuggii`, and `bisaddii`.
- Kept English-definition data out of Somali production fixtures and packs.

## Unblock Requirements

1. Identify an approved Somali-definition source with explicit license, attribution, and revision/retrieval date.
2. Confirm the source contains Somali-language definitions rather than English glosses.
3. Build a balanced 100-headword sample covering long vowels, consonant doubling, definite articles, demonstratives, possessives, and plurals.
4. Meet the shared corpus/coverage gates before building a production pack.
5. Run Word/Reader/Library and offline import/delete/lookup smoke before promotion.
