# Offline Dictionary MVP Phase 1

This document defines the first offline dictionary slice for Dictionary Mobile. It follows the accepted `.docs/decisions/offline-dictionary-bundle.md` decision and keeps production data optional, attributed, and outside the base app bundle.

## Scope

Phase 1 is a single-language pack prototype:

- Source: Kaikki/Wiktextract JSONL for one Wiktionary edition.
- Output: normalized pack metadata plus compressed entry JSON for local testing and later SQLite import.
- Runtime: online lookup remains the default until pack download/storage UI and native SQLite support are implemented.
- Attribution: UI must clearly state Wiktionary/Kaikki and CC BY-SA/GFDL obligations before any offline pack ships.

## SQLite Schema Design

Use one SQLite database per language pack. The app should be able to delete or replace a pack without touching user data.

```sql
CREATE TABLE offline_pack_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE dictionary_entry (
  id TEXT PRIMARY KEY,
  lang_code TEXT NOT NULL,
  word TEXT NOT NULL,
  normalized_word TEXT NOT NULL,
  part_of_speech TEXT,
  definitions_json TEXT NOT NULL,
  ipa TEXT,
  audio_json TEXT NOT NULL DEFAULT '[]',
  examples_json TEXT NOT NULL DEFAULT '[]',
  relations_json TEXT NOT NULL DEFAULT '{}',
  etymology TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  license TEXT NOT NULL,
  attribution TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE dictionary_entry_fts USING fts5(
  word,
  normalized_word,
  definitions,
  content='dictionary_entry',
  content_rowid='rowid'
);

CREATE INDEX dictionary_entry_lang_word_idx
  ON dictionary_entry(lang_code, normalized_word);
```

Minimum `offline_pack_meta` keys:

| Key | Value |
| --- | --- |
| `pack_id` | Stable id, for example `enwiktionary-lite` |
| `lang_code` | App language code |
| `source_name` | Wiktionary edition or Kaikki dump name |
| `source_url` | Raw dump or source page URL |
| `license` | `CC-BY-SA-4.0/GFDL` unless a language pack proves otherwise |
| `generated_at` | ISO timestamp |
| `entry_count` | Normalized entry count |
| `schema_version` | Start at `1` |

## Pack Generation

Use `scripts/build-offline-pack.mjs` for small local prototypes:

```bash
node scripts/build-offline-pack.mjs \
  --input data/wiktionary-cache/en-sample.jsonl \
  --lang en \
  --source enwiktionary \
  --source-url https://kaikki.org/dictionary/rawdata.html \
  --out tmp/offline-packs/en-sample
```

The script writes:

- `manifest.json`: pack metadata and counts.
- `entries.json.gz`: compressed normalized entries.

Generated pack output belongs in `tmp/offline-packs/` and must not be committed. Durable parser fixtures, if needed, belong under `tests/fixtures/`.

## Attribution UI

Before enabling offline packs, the app must expose:

- Settings/Profile acknowledgement: Wiktionary/Kaikki, CC BY-SA/GFDL, optional pack status.
- Per-entry source attribution when an offline entry is shown.
- A path to full license/source details before any pack download.

The Phase 1 UI only adds source acknowledgement copy. Pack download and storage management remain future work.

## Pack Status Shell

`data/offlineDictionaryPacks.ts` tracks planned pack metadata for UI and tests without claiming that offline lookup is enabled. Profile shows:

- planned pack count;
- builder-ready count;
- runtime-enabled count, currently `0`;
- language, source, size estimate, license, and status.

Runtime SQLite import, download progress, deletion, version checks, and per-entry offline lookup remain future work.

## Verification

For Phase 1 changes:

```bash
node scripts/build-offline-pack.mjs --input <jsonl> --lang <lang> --source <source> --out tmp/offline-packs/<name>
npm test -- --run tests/offlinePackBuilder.test.ts
npm test -- --run tests/offlineDictionaryPacks.test.ts
npx tsc --noEmit
npm run lint
npm test -- --run
```

Use tiny JSONL samples only. Do not run large Kaikki dumps inside routine verification.
