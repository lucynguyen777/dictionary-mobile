# Offline Dictionary MVP

This document defines the staged offline dictionary slices for Dictionary Mobile. It follows the accepted `.docs/decisions/offline-dictionary-bundle.md` decision and keeps production data optional, attributed, and outside the base app bundle.

## Phase 1 Scope

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
- downloadable count, currently `0`;
- language, source, size estimate, license, and status.
- runtime-gate copy explaining why download/import is blocked.

Runtime SQLite import, download progress, deletion, version checks, and per-entry offline lookup remain future work.

## Offline Entry Resolver

`data/offlineDictionaryLookup.ts` defines the in-memory resolver contract for normalized pack entries before SQLite is wired:

- exact normalized lookup by language pack;
- morphology fallback through existing `data/morphology.ts` candidates;
- missing-result behavior without falling through to the wrong language pack;
- mapping from normalized pack entries into the current `ApiMeaningResult` and related-word contracts.

This resolver is covered by offline fixture tests and is intended to sit behind SQLite storage once pack import/download management is implemented.

## Pack Install State

`data/offlineDictionaryPackStore.ts` stores local pack lifecycle metadata in AsyncStorage before real downloader/SQLite wiring lands:

- `not_downloaded`, `downloading`, `downloaded`, `importing`, `ready`, and `failed` statuses;
- clamped download progress from `0` to `1`;
- local URI, imported entry count, installed timestamp, and error copy;
- deletion of pack metadata without touching user library/profile data.

The store intentionally tracks metadata only. Actual pack files, SQLite database creation, checksum verification, and network download retries remain future work.

## Phase 2 Import Contract

`data/offlineDictionaryImport.ts` starts the runtime import layer before download UI is enabled:

- `OFFLINE_DICTIONARY_SCHEMA_SQL` mirrors the documented `offline_pack_meta`, `dictionary_entry`, FTS, and lookup-index schema.
- `serializeOfflineEntryForSqlite` maps normalized builder entries into SQLite row fields with JSON payload columns for definitions, audio, examples, and relations.
- `parseOfflineEntryFromSqliteRow` maps persisted rows back into the shared `OfflineDictionaryEntry` lookup contract.
- `validateOfflinePackManifest` blocks imports when pack id, language, license, schema version, or entry count do not match the selected planned pack.
- `importOfflineDictionaryPack` orchestrates install-state transitions through `importing`, `ready`, or `failed` while delegating persistence to an `OfflineDictionaryStorage` port.
- `createMemoryOfflineDictionaryStorage` is a deterministic test/runtime stand-in for contract tests.
- `data/offlineDictionarySqliteStorage.ts` provides the Expo SQLite-backed storage driver: lazy runtime import of `expo-sqlite`, deterministic per-pack database names, schema setup, transaction-backed metadata/entry replacement, database deletion, and SQL-backed exact/morphology lookup routing.

This slice intentionally keeps Profile download/import buttons gated. It proves the manifest/entry contract, install-state transitions, and persistent SQLite lookup path without claiming pack download/checksum handling is ready. FTS table creation is present for the eventual search surface; current lookup uses the indexed normalized-word path plus morphology candidates.

## Verification

For offline pack changes:

```bash
node scripts/build-offline-pack.mjs --input <jsonl> --lang <lang> --source <source> --out tmp/offline-packs/<name>
npm test -- --run tests/offlinePackBuilder.test.ts
npm test -- --run tests/offlineDictionaryPacks.test.ts
npm test -- --run tests/offlineDictionaryLookup.test.ts
npm test -- --run tests/offlineDictionaryPackStore.test.ts
npm test -- --run tests/offlineDictionaryImport.test.ts
npm test -- --run tests/offlineDictionarySqliteStorage.test.ts
npx tsc --noEmit
npm run lint
npm test -- --run
```

Use tiny JSONL samples only. Do not run large Kaikki dumps inside routine verification.
