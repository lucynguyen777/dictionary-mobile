# v1.3.10 Offline Pack Expansion Status

Status: blocked by source/corpus packaging candidate.

## Current Pack Inventory

| Pack | Status | Evidence | Production note |
| --- | --- | --- | --- |
| `enwiktionary-lite` | Development smoke pack | `public/offline-packs/enwiktionary-lite/manifest.json`, `entries.json`, and `englishOfflinePackDevSource` checksums | Validates download/import/checksum/SQLite lookup plumbing only; not production English coverage. |

No additional hosted offline pack is currently safe to create in v1.3.10.

## Why Expansion Is Blocked

The v1.3.6 source/corpus smoke intentionally kept `es`, `ms`, and monolingual `fr` as preview. `fr->vi` remains a supported production pair, but still lacks measured source-size, source-date, attribution, and offline packaging proof. Creating offline packs now would risk making preview data look production-ready.

Required before a new pack ships:

- Approved source and license for that exact language or pair.
- Source date or dump date.
- Entry count and coverage target.
- Per-entry attribution and user-visible source label.
- Manifest checksum and entries checksum.
- Native/dev-client import/delete smoke.
- Offline lookup smoke showing exact, morphology, missing-result, and fallback behavior.

## Candidate Decisions

| Candidate | Decision | Blocker |
| --- | --- | --- |
| Spanish `es` | Do not package yet | WiktAPI/common-word smoke is useful, but corpus size, accent/inflection behavior, examples/relations, and dump packaging are not proven. |
| Malay `ms` | Do not package yet | Affix/allomorph coverage and corpus size remain preview-only. |
| French `fr` | Do not package yet | Monolingual French needs measured corpus/offline pack path and broader smoke. |
| French to Vietnamese `fr->vi` | Do not package yet | Supported in-app, but offline source metadata and legal packaging path are not measured enough. |

## Next Safe Module

Run **Language Corpus Expansion Follow-up** before Offline Pack Expansion continues:

1. Select one language/pair.
2. Measure a representative headword set.
3. Record source URL, dump/source date, license, attribution copy, and change notes.
4. Build a tiny generated pack in `tmp/offline-packs/` first.
5. Promote to `public/offline-packs/` only after checksum, import/delete, offline lookup, and UI smoke pass.

## Security And Release Notes

- No provider secrets or service-role keys are required for this blocker record.
- Do not commit generated bulk data from `tmp/offline-packs/`.
- Do not promote preview languages to production parity until `docs/language-coverage-inventory.md` and `docs/product-progress.md` agree with measured evidence.
