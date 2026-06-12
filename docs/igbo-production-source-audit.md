# Igbo Production Source Audit

## Decision

Igbo remains an **implemented local-educational-fixture monolingual preview with production promotion source-blocked**.

- Hosted WiktAPI returned `404` for `ụlọ`, `mmadụ`, and `akwụkwọ` on 2026-06-12.
- The expected Kaikki Igbo dataset URL returned `404`, so there is no current revisioned Kaikki candidate to measure.
- Native `ig.wiktionary.org` reports about 640 articles, far below the shared 5,000-entry production corpus threshold.
- Nkọwa okwu / Igbo API remains a promising candidate, but API access, license, token handling, privacy, and product terms are not accepted for production integration.

## Safe Work Completed

- Kept acute, grave, and macron marks tone-insensitive across canonical Unicode forms.
- Made lowercasing explicitly Igbo/Nigeria locale-aware.
- Preserved lexical Ọnwụ letters `ị`, `ọ`, `ụ`, and `ṅ`; plain `i`, `o`, `u`, and `n` are not treated as equivalent.
- Kept current local educational fixtures explicitly non-production.

## Unblock Requirements

1. Accept production terms for Nkọwa okwu / Igbo API or identify another approved Igbo-definition corpus.
2. Confirm at least 5,000 attributed entries and record source revision/retrieval metadata.
3. Measure exact, tone-insensitive, and underdot/`ṅ`-preserving lookup separately.
4. Expand morphology only from source-backed roots and forms.
5. Build an attributed offline candidate and pass Word/Reader/Library/offline smoke before promotion.
