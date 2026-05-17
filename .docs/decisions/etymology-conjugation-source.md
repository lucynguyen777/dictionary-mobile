# Decision: Etymology And Conjugation Source

## Status
Proposed

## Context
Production etymology and conjugation features need structured, legally usable lexical data. The app currently must not mock etymology or conjugation as if it were production data.

This decision covers:
- etymology text and source attribution;
- inflection/conjugation tables or morphology paradigms;
- live API vs packaged dataset usage;
- attribution, share-alike, and offline redistribution obligations.

Related existing decisions:
- `.docs/decisions/dictionary-source-licensing.md`
- `.docs/decisions/offline-dictionary-bundle.md`

## Requirements
- Use source material with terms compatible with app usage.
- Keep attribution visible at entry or source level.
- Do not use machine translation as etymology or dictionary data.
- Do not bundle offline data until offline dictionary licensing is accepted.
- Prefer structured fields over scraping rendered HTML.
- Keep language-specific coverage explicit; one source may not cover every target language.

## Options
1. Wiktionary-derived live data through WiktAPI or Wiktextract/Kaikki
   - Pros: broad language coverage, etymology and inflection fields can exist, current project already uses WiktAPI-style adapters.
   - Cons: Wiktionary text is CC-BY-SA/GFDL, entries can include externally sourced material, data completeness varies by language, and offline packaging needs share-alike compliance review.
   - Source notes:
     - Wiktionary text is dual-licensed under CC-BY-SA 4.0 and GFDL.
     - Kaikki publishes raw data extracted from Wiktionary and includes non-English Wiktionary editions, but some datasets are large and work in progress.

2. UniMorph for conjugation/inflection paradigms only
   - Pros: structured morphology schema, broad multilingual coverage, useful for conjugation/paradigm display and tests.
   - Cons: not a dictionary or etymology source, language coverage varies, licenses can differ by language/source row, and UX still needs definitions from another source.
   - Source notes:
     - UniMorph lists 169 annotated languages and exposes per-language source/license metadata.

3. Commercial licensed lexical provider
   - Pros: clearer production support, SLAs, consistent coverage, possibly cleaner license for app distribution.
   - Cons: cost, contract work, backend/API key handling, and vendor lock-in.

4. Local placeholder UI only
   - Pros: safe while source decisions remain open.
   - Cons: does not unblock production etymology or conjugation.

## Recommendation
Use option 1 as the first research path for etymology and option 2 as the first research path for conjugation/inflection prototypes, but keep both production features blocked until the product owner accepts this decision and confirms attribution/offline policy.

For live online-only prototypes:
- WiktAPI/Wiktextract-derived etymology may be explored only with visible source attribution.
- UniMorph may be explored only for morphology/conjugation UI contracts, not as a definition or etymology source.

For offline or bundled features:
- No Wiktionary/Kaikki/UniMorph data should be packaged until `.docs/decisions/offline-dictionary-bundle.md` and `.docs/decisions/dictionary-source-licensing.md` are accepted.

## Decision
Chosen option: pending.

## Consequences
- Production etymology and conjugation remain blocked while this decision is `Proposed`.
- UI may show explicit coming-soon or source-needed states.
- Engineering may add typed contracts or fixture-free UI shells, but not production data integration.
- Any future source integration must include attribution behavior and tests for missing/partial source data.

## Tasks Unblocked If Accepted
- Production etymology source integration.
- Production conjugation/paradigm data integration.
- Language-specific conjugation tabs.
- Source attribution UI for lexical metadata.
- Offline packaging review for etymology/conjugation datasets, if offline decisions are also accepted.

## Sources Checked
- Wiktionary copyright/license page: https://en.wiktionary.org/wiki/Wiktionary:Copyrights
- Kaikki machine-readable Wiktionary extracts: https://kaikki.org/
- Kaikki raw Wiktextract downloads: https://kaikki.org/dictionary/rawdata.html
- UniMorph project and language/license table: https://unimorph.github.io/
