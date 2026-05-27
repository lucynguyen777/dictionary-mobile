# Language Source Gates

## Goal

Keep blocked language and bilingual dictionary work honest: no adapter, fixture, offline pack, or production lookup should be implemented until a legally usable lexical source is accepted for that exact language or pair.

This document is a decision-prep gate, not an implementation plan.

## Current Status Summary

| Language / pair | Current status | Best current candidate | Decision |
| --- | --- | --- | --- |
| Cantonese `yue -> yue` | Blocked | Words.hk public-domain word/pronunciation lists plus possible future permission for full definitions | Keep `yue` unavailable; word/pronunciation helper data is not enough for definitions. |
| Uyghur `ug -> ug` | Blocked | `ug.wiktionary.org` MediaWiki API under CC BY-SA 4.0 | Keep adapter blocked until a balanced non-placeholder noun/adjective/verb candidate set is accepted. |
| Vietnamese -> French `vi -> fr` | Blocked | DBnary/Wiktionary-derived bilingual extraction, commercial dictionary license, or user-provided dictionary import | Do not use machine translation as dictionary data. |
| Basque `eu -> eu` | Research gate | Basque Wiktionary / Kaikki / national Basque lexical resources | Needs source smoke, license check, and morphology contract before TODO. |
| Ainu `ain -> ain` | Research gate | Ainu Wiktionary material, academic/public-domain lists, or licensed specialist resources | Needs source availability proof before metadata or fixtures. |
| Quechua `qu -> qu` | Research gate | Quechua Wiktionary / Kaikki / national or academic resources | Treat independently; do not group under a production "Amerind" taxonomy. |
| Nahuatl `nah -> nah` | Research gate | Nahuatl Wiktionary / Kaikki / academic or community resources | Treat independently; no adapter until source/license smoke passes. |
| Guarani `gn -> gn` | Research gate | Guarani Wiktionary / Kaikki / national or academic resources | Treat independently; no adapter until source/license smoke passes. |

## Candidate Source Classes

### Hosted APIs

Use only when:

- API terms explicitly allow app use;
- rate limits and attribution are documented;
- response contains full target-language definitions or bilingual dictionary entries;
- API key storage avoids committing secrets.

Blocked examples:

- WiktAPI Cantonese and Uyghur endpoints are not viable based on local smoke.
- National or academic APIs that require keys remain blocked until terms, keys, and privacy/rate limits are documented.

### Wiktionary, Kaikki, And Raw Dumps

Accept only when:

- the exact language edition or extraction contains target-language definitions, not only English glosses;
- source URL, revision id or dump date, license, attribution label, and transformation notes are preserved;
- fixtures are non-placeholder and balanced enough for the first adapter scope;
- CC BY-SA/ShareAlike packaging remains separable from proprietary app code for offline packs.

Useful-but-insufficient cases:

- Kaikki English-edition Uyghur and Cantonese material can support morphology/pronunciation research, but it is not a monolingual definition source.
- A single good Wiktionary page does not unblock an adapter unless the first adapter scope has enough noun/adjective/verb or domain-relevant coverage.

### Public-Domain Lists

Accept for helper features only when the list is not a full dictionary:

- search suggestions;
- pronunciation/Jyutping/romanization display;
- segmentation support;
- spelling/headword lists.

Do not present list data as dictionary definitions.

### Commercial Or Licensed Dictionaries

Can unblock production definitions only after:

- contract permits mobile/web app use;
- redistribution/offline use is explicitly covered;
- attribution and retention requirements are documented;
- cost/renewal risk is accepted.

### User-Provided Data

Can support import/export workflows, not built-in dictionary coverage:

- keep attribution as user-provided;
- do not ship as app fixtures;
- do not imply app-verified lexical quality.

## Per-Gate Requirements

Before any blocked language/pair moves from `[!] BLOCKED` to `[ ] TODO`, create or refresh a source gate doc with:

1. Candidate list and why each candidate is accepted, insufficient, or rejected.
2. License/terms, attribution, source URL, revision or retrieval date, and user-visible label.
3. Minimum fixture set for the first adapter:
   - monolingual: at least several non-placeholder entries covering expected part-of-speech or script/morphology cases;
   - bilingual: dictionary-style source and target entries, not machine translation output.
4. Script/normalization and morphology contract.
5. Missing-result and blocked UI behavior.
6. Offline/bulk packaging decision if data is bundled or downloaded.

## Specific Gate Notes

### Cantonese

- Current docs: `docs/cantonese-language-plan.md`, `docs/cantonese-source-smoke.md`.
- Safe helper path: Words.hk public-domain word/pronunciation data after endpoint stability is verified.
- Still blocked: full monolingual definitions from Words.hk or another source without explicit compatible permission.
- Adapter readiness: Traditional Hanzi, Cantonese vernacular characters, Jyutping, tones, exact lookup, no morphology stemming, segmentation support.

### Uyghur

- Current docs: `docs/uyghur-language-plan.md`, `docs/uyghur-source-smoke.md`.
- Best candidate: curated `ug.wiktionary.org` entries under CC BY-SA 4.0.
- Still blocked: current smoke did not find enough balanced non-placeholder noun/adjective/verb entries.
- Adapter readiness: RTL Uyghur Arabic script, NFC normalization, invisible/bidi character policy, optional ULY fallback after mapping table, Turkic suffix handling only after source evidence.

### Vietnamese -> French

- Existing app supports FR->VI, VI-VI, and FR-FR paths, but not a trusted VI->FR bilingual dictionary.
- DeepL/OpenAI translation decisions do not unblock VI->FR dictionary data because machine translation output is not dictionary source data.
- Candidate paths:
  - Wiktionary/DBnary bilingual extraction if Vietnamese-to-French translations are structured enough and license/attribution are preserved;
  - commercial bilingual dictionary license;
  - user-provided import as personal data only.
- First safe task: create a dedicated `docs/vi-fr-source-gate.md` after probing structured bilingual extraction candidates.

### Basque

- Basque is a strong research candidate because script support is Latin and the app already handles Indo-European Latin-script adapters.
- Source and morphology still need proof: Basque is morphologically rich and cannot reuse simple Spanish/French assumptions.
- Candidate paths:
  - Basque Wiktionary / Kaikki extraction;
  - national Basque resources if license/API allows app use;
  - commercial/open lexicon with full definitions.
- First safe task: create `docs/basque-source-gate.md` with license/API smoke.

### Ainu

- Ainu source availability is the primary blocker.
- Candidate paths:
  - Wiktionary-derived entries if target-language definitions exist;
  - public-domain or academic lexicons with explicit app-compatible terms;
  - licensed specialist dictionary.
- First safe task: create `docs/ainu-source-gate.md` before adding metadata.

### Quechua, Nahuatl, Guarani

- Do not implement an "Amerind" family as a production taxonomy. Treat each language independently.
- Each language needs its own source smoke, orthography/dialect policy, and morphology/readiness contract.
- Machine translation, English gloss lists, and generic wordlists are not enough for dictionary definitions.
- First safe task: create one source gate at a time, starting with the language that has the clearest source/license path.

## Acceptance Gate

A language or pair can move to `[ ] TODO` only when:

- a source gate doc names an accepted source;
- source/license metadata is complete;
- first fixture/API sample is non-placeholder and representative;
- adapter readiness contract is defined;
- no machine translation is used as dictionary data;
- offline/bulk packaging obligations are explicit when applicable.

Until then, runtime metadata should remain unavailable or blocked, and UI should show honest "coming soon/source unavailable" states.

## Sources To Recheck

- Words.hk data pages: https://words.hk/faiman/analysis/
- Kaikki raw data index: https://kaikki.org/dictionary/rawdata.html
- Wikimedia API/siteinfo and User-Agent policy for each Wiktionary edition
- WiktAPI availability by edition
- DBnary bilingual extraction options
- National dictionaries or academic resources for Basque, Ainu, Quechua, Nahuatl, and Guarani
