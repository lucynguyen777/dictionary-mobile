# Zulu Production Source Audit

## Decision

Zulu remains an **implemented local-fixture monolingual preview with production promotion corpus-blocked**.

- Hosted WiktAPI returned `404` for `umuntu`, `inja`, and `isiZulu` on 2026-06-12.
- The Kaikki Zulu dataset is English-Wiktionary-derived and uses English definitions. It remains ineligible for Zulu monolingual production packaging.
- Native `zu.wiktionary.org` reports about 1,242 articles, below the shared 5,000-entry production threshold. Sample pages confirm useful noun/plural metadata, but sampled definition completeness is inconsistent.
- No approved, measured Zulu-definition corpus meeting the shared production gates is currently selected.

## Safe Work Completed

- Preserved the existing fixture-backed noun-class plural-to-singular and locative fallbacks.
- Added dictionary/educational tone-mark-insensitive lookup for acute, grave, and macron forms.
- Preserved Zulu digraphs, trigraphs, click letters, and ordinary display spelling.
- Kept English-definition data out of Zulu production fixtures and packs.

## Unblock Requirements

1. Identify an approved Zulu-definition corpus with at least 5,000 usable attributed entries.
2. Measure native-definition completeness separately from noun/plural metadata.
3. Build a balanced 100-headword report covering noun classes, locatives, and bounded verb forms.
4. Expand morphology only when source-backed examples prove the mappings.
5. Build an attributed offline candidate and pass Word/Reader/Library/offline smoke before promotion.
