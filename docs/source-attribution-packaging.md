# Source Attribution And Packaging Gate

## Status
Created on May 22, 2026 as the cross-family source gate for implemented local baselines and future offline packs.

## Current Decisions
- `.docs/decisions/dictionary-source-licensing.md` accepts public/national open APIs and open Wiktionary-derived datasets as primary dictionary source strategies.
- `.docs/decisions/offline-dictionary-bundle.md` accepts optional Wiktionary/Kaikki offline bundles, but requires attribution UI, per-entry source metadata, and ShareAlike-compatible packaging before distribution.

## Required Metadata For Curated Fixtures
Each committed dictionary fixture entry must preserve:
1. Source family, e.g. `etwiktionary`, `uzwiktionary`, `kaikki`, `ekilex`.
2. Source page URL.
3. Revision id, oldid, dump date, or API retrieval date when available.
4. License id, e.g. `CC-BY-SA-4.0`, `CC-BY-4.0`, or `public-domain`.
5. Attribution label shown to users.
6. Change note when definitions are paraphrased, trimmed, normalized, or locally translated.
7. Whether the entry is a tiny educational/test fixture or production pack data.

## Runtime Attribution Requirements
- Profile or Settings must expose a Credits/Acknowledgements surface before any bulk/offline pack ships.
- Word-detail results must keep per-entry source labels so users can distinguish local fixtures, live APIs, and offline packs.
- Any CC BY-SA derived offline pack must be separable from proprietary app code and distributable under the same compatible license terms.

## Source-Specific Decisions From This Module
- Estonian: tiny baseline can use curated Estonian Wiktionary pages under CC BY-SA 4.0; Sõnaveeb/Ekilex is a future CC BY 4.0 production candidate but needs API key handling.
- Cantonese: Words.hk public-domain word/pronunciation lists are acceptable for non-definition helpers; full definitions remain blocked until compatible permission is confirmed.
- Uzbek: tiny baseline can use curated Uzbek Wiktionary pages under CC BY-SA 4.0; Izoh.uz remains blocked until terms/API permission are documented.
- Uyghur: remains blocked because the current candidate set does not provide enough balanced non-placeholder native-definition fixtures.
- Language Source Gates refresh: `docs/language-source-gates.md` is the current cross-language gate for Cantonese, Uyghur, VI->FR, Basque, Ainu, Quechua, Nahuatl, and Guarani.

## Acceptance Criteria Before Bulk Expansion
1. Credits screen or Profile attribution surface is implemented and browser-smoked.
2. Fixture metadata carries license/source/revision fields.
3. Offline pack manifest carries source license, dump date, checksum, and attribution copy.
4. ShareAlike packs are stored/downloaded as separate open data artifacts.
5. Any API requiring keys avoids committing secrets and documents request limits/privacy implications.

## Sources Checked
- Dictionary source licensing decision: `.docs/decisions/dictionary-source-licensing.md`
- Offline bundle decision: `.docs/decisions/offline-dictionary-bundle.md`
- Creative Commons BY 4.0: https://creativecommons.org/licenses/by/4.0/
- Creative Commons BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/
