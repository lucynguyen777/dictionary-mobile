# Database Architecture Plan

## Goal

Dictionary Mobile uses a hybrid local-first database strategy:

- local app data stays usable without accounts or network access;
- offline dictionary packs use dedicated SQLite databases per language pack;
- Supabase Auth/backend/cloud sync decisions are accepted, with sync implementation staged behind `docs/supabase-auth-foundation.md` and `docs/supabase-cloud-sync-mvp.md`;
- encrypted backup remains a follow-up module after the minimal sync MVP.

This plan documents the current storage map, target ownership model, lifecycle rules, and next implementation modules. It does not migrate existing user data or change runtime schemas.

## Current Storage Map

### User Data Stores

Current user-owned data is persisted through `data/storageAdapter.ts`, backed by AsyncStorage:

| Domain | Key / Surface | Current shape | Owner |
| --- | --- | --- | --- |
| Profile | `dictionary-mobile.profile.v1` via `data/profileStore.ts` | one JSON profile object with local login method, language goals, app lock, and notification preferences | User |
| Library | `dictionary-mobile.library.v1` via `data/libraryStore.ts` | one JSON state containing folders, saved words, search history, flashcards, deleted folder ids, and flashcard sync metadata | User |
| Reader | `dictionary-mobile.reader.v1` via `data/readerStore.ts` | one JSON state containing imported documents, selected document id, and reader settings | User |
| Export backup | `data/exportAllData.ts` | JSON export file containing raw profile, library, and reader payloads | User |

These stores are simple and portable, but they are not query-optimized and do not have per-table migrations. They should stay stable until a dedicated local user database migration module is selected.

### Offline Dictionary Pack Stores

Offline dictionary packs are already separated from user data:

| Surface | Current shape | Owner |
| --- | --- | --- |
| Pack lifecycle metadata | `data/offlineDictionaryPackStore.ts` in AsyncStorage | App-managed install state for planned/downloaded/imported packs |
| Pack download artifacts | `data/offlineDictionaryPackDownload.ts` in Expo FileSystem document storage | App-managed temporary/downloaded artifacts |
| Pack SQLite storage | `data/offlineDictionarySqliteStorage.ts` using `expo-sqlite` | App-managed per-pack SQLite database |
| Runtime lookup | `data/offlineDictionaryRuntimeLookup.ts` | Offline-first dictionary lookup before online adapter fallback |

Each offline pack database is replaceable and deletable without touching user data. The schema is defined by `OFFLINE_DICTIONARY_SCHEMA_SQL` and documented in `docs/offline-dictionary-mvp.md`.

### Static And Fixture Data

Local language fixtures, dictionary samples, source metadata, and hosted development packs are app data, not user data. They should remain committed only when licensing and attribution are clear.

## Target Architecture

### Local-First Layers

1. **User database layer**
   - Future target: a local SQLite user database for profile, folders, saved words, flashcards/reviews, search history, reader documents, and app settings.
   - Current bridge: keep AsyncStorage JSON stores until the migration readiness module defines schemas, migrations, and rollback behavior.

2. **Offline dictionary pack layer**
   - Keep one SQLite database per language pack.
   - Keep pack lifecycle metadata separate from pack entry data.
   - Keep dictionary pack deletion isolated from user library/profile/reader data.

3. **Export and reset layer**
   - Export all user-owned local data in a stable JSON backup.
   - Reset local user data through profile/library/reader clearing flows.
   - Offline pack deletion should be explicit and separate from user data reset unless the UI says "all local data".

4. **Future sync/backend layer**
   - Accepted direction: Supabase Auth, Supabase backend, and Supabase sync tables.
   - Contract: `docs/supabase-auth-foundation.md` and `docs/supabase-cloud-sync-mvp.md`.
   - Must be additive to local-first behavior. The app should remain useful without account login.

## Database Domains

### User-Owned Domains

- Profile and settings: display name, email/phone placeholders, language preferences, learning goals, app lock, notification preferences.
- Library: folders, saved words, notes, tags, favorites, folder metadata, search history.
- Flashcards: card type, front/back, SM-2 review fields, sync metadata, deleted ids.
- Reader: imported text documents, source format, selected document, reading settings.
- Export/import: local backup payloads and future restore validation.

### App-Owned Domains

- Offline pack catalog: planned packs, hosted source URLs, checksums, license metadata, runtime gates.
- Offline pack lifecycle: not downloaded, downloading, downloaded, importing, ready, failed, progress, installed metadata.
- Offline dictionary entries: per-pack SQLite entries, FTS table, source attribution, license, update metadata.
- Static language fixtures: local educational baseline entries and source-gated test fixtures.

## Lifecycle And Governance Rules

### Ownership

- User data must be exportable, resettable, and eventually syncable.
- Offline dictionary pack data is cache-like app data and can be deleted/replaced by pack id.
- Source attribution and license metadata must travel with dictionary entries and pack manifests.

### Schema Versioning

- User data keeps `*.v1` AsyncStorage keys until a migration module introduces a versioned SQLite schema.
- Offline dictionary packs keep `schema_version` in the manifest and `offline_pack_meta`.
- New schemas must include deterministic migration tests before becoming the default runtime path.

### Migrations

- User data migration must be two-step: read old AsyncStorage payloads, write normalized SQLite rows, then keep rollback/export safety until verified.
- Offline pack migration should prefer pack replacement over in-place mutation unless a delta-update module proves a safer path.
- Failed migrations must preserve the previous readable data whenever possible.

### Backup And Restore

- Current export remains JSON-based and includes profile, library, and reader stores.
- Future backup should include a manifest with export version, app version, exported domains, and created timestamp.
- Offline dictionary packs should not be included in user backup by default; they can be re-downloaded from pack sources.

### Reset And Deletion

- Profile/library/reader reset must not silently delete offline dictionary packs unless the UI clearly labels a full-device data reset.
- Offline pack deletion must remove lifecycle metadata, downloaded artifacts, and the pack SQLite database.
- Account deletion remains blocked until real accounts/backend exist.

### Storage Limits

- Offline packs should keep explicit size estimates, installed size metadata, and delete actions.
- Future user database storage should expose approximate local-data size in Profile before large import/restore operations.
- Large reader imports and offline packs should keep existing file-size and checksum gates.

## Cloud Boundary

The following are accepted directions:

- auth provider: Supabase Auth;
- backend architecture: Supabase backend;
- cloud sync database: Supabase sync tables;
- sync ownership: `user_id` scoped to Supabase Auth users, protected by Row Level Security;
- sync identity: preserve local SQLite entity ids, timestamps, versions, and soft-delete metadata.

The following remain staged or blocked:

- encrypted backup destination and restore UX are staged after minimal sync MVP;
- server-side account deletion implementation depends on auth/backend code;
- feedback/support submission destination remains blocked until support channel is selected; current options are prepared in `docs/current-decision-options.md`.

## Next Implementation Modules

1. **Local user-data SQLite migration readiness**
   - Define local user database schema, entity ownership, migration plan from AsyncStorage, and focused tests.
2. **Supabase Cloud Sync MVP**
   - Follow `docs/supabase-cloud-sync-mvp.md` to create RLS-protected Supabase sync tables, local sync metadata, conflict resolution, and offline replay behavior.
3. **Offline pack storage management expansion**
   - Add storage limits, installed-size reporting, update checks, and deletion UX around existing pack SQLite databases.

Recommended next module: **Local user-data SQLite migration readiness**, because it improves local-first foundations without requiring backend/auth decisions.

## Local User SQLite Migration Readiness

This readiness module defines the target local user database contract only. Runtime still reads and writes the existing AsyncStorage stores until an implementation module replaces the adapters.

### Entity Audit

| Entity | Current source | Proposed ownership | Migration notes |
| --- | --- | --- | --- |
| `user_profile` | `UserProfile` in `data/profileStore.ts` | user-owned singleton | keep a stable row id such as `local-profile`; store login method as local metadata, not auth identity |
| `notification_preferences` | nested profile object | user-owned settings | can be either a JSON column on profile or a one-row settings table; first SQLite implementation should keep it normalized as columns for validation |
| `folders` | `Folder[]` in `LibraryState` | user-owned | preserve `favorites` virtual folder behavior outside the table; keep deleted folder ids for future sync |
| `saved_words` | `SavedWord[]` in `LibraryState` | user-owned | words can belong to multiple folders, so folder membership must be split into a join table |
| `saved_word_folders` | `SavedWord.folderIds[]` | user-owned relation | composite key: `(word_id, folder_id)` |
| `search_history` | `SearchHistoryItem[]` | user-owned activity | key by normalized word plus `looked_up_at`, keeping most recent rows first in queries |
| `flashcards` | `Flashcard[]` | user-owned learning data | preserve SM-2 fields, `syncStatus`, `lastSyncedAt`, and `version`; soft-delete is required for future sync |
| `deleted_folder_ids` | `LibraryState.deletedFolderIds[]` | user-owned tombstones | migrate into a tombstone table so future sync can see deletes |
| `reader_documents` | `ReaderDocument[]` | user-owned content | text can be large; keep current file-size import gates and avoid mixing with dictionary pack data |
| `reader_settings` | `ReaderSettings` and `selectedDocumentId` | user-owned settings | singleton settings row, with selected document nullable |

### Proposed Local SQLite Schema

Use one app-owned user database, separate from offline dictionary pack databases:

- Database name: `dictionary-mobile-user.sqlite`.
- Schema version: start at `1` in `user_database_meta`.
- All timestamps are ISO strings in UTC.
- All ids are app-generated strings during the first migration; do not introduce backend ids before auth/backend decisions.

```sql
CREATE TABLE user_database_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE user_profile (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  login_method TEXT NOT NULL DEFAULT 'local',
  native_language TEXT NOT NULL,
  learning_language TEXT NOT NULL,
  proficiency_level TEXT NOT NULL,
  learning_goal TEXT NOT NULL,
  timezone TEXT NOT NULL,
  daily_goal TEXT NOT NULL,
  app_lock_enabled INTEGER NOT NULL DEFAULT 0,
  daily_reminder_enabled INTEGER NOT NULL DEFAULT 1,
  review_reminder_enabled INTEGER NOT NULL DEFAULT 1,
  weekly_summary_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_time TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  color_note TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  avatar_uri TEXT NOT NULL DEFAULT '',
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE saved_words (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  ipa TEXT NOT NULL DEFAULT '',
  definition TEXT NOT NULL DEFAULT '',
  audio TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  source TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE saved_word_folders (
  word_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (word_id, folder_id)
);

CREATE TABLE search_history (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  normalized_word TEXT NOT NULL,
  looked_up_at TEXT NOT NULL
);

CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL,
  type TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TEXT NOT NULL,
  review_state TEXT NOT NULL,
  interval INTEGER NOT NULL,
  repetition INTEGER NOT NULL,
  efactor REAL NOT NULL,
  due_date TEXT NOT NULL,
  sync_status TEXT,
  last_synced_at TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT
);

CREATE TABLE deleted_entities (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  deleted_at TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);

CREATE TABLE reader_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_format TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE reader_settings (
  id TEXT PRIMARY KEY,
  selected_document_id TEXT,
  font_size INTEGER NOT NULL,
  font_family TEXT NOT NULL,
  background_color TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX saved_words_word_idx ON saved_words(word);
CREATE INDEX saved_word_folders_folder_idx ON saved_word_folders(folder_id);
CREATE INDEX search_history_lookup_idx ON search_history(normalized_word, looked_up_at);
CREATE INDEX flashcards_due_idx ON flashcards(due_date, review_state);
CREATE INDEX reader_documents_updated_idx ON reader_documents(updated_at);
```

JSON columns are acceptable for tags in the first migration because current UI treats tags as simple arrays and does not require relational tag search yet. Do not use this schema for offline dictionary entries; those remain in per-pack databases.

### Migration Strategy

1. Export safety first: run the existing JSON export path before marking a migration as complete.
2. Read current AsyncStorage payloads for profile, library, and reader.
3. Normalize with existing store normalizers by calling current load functions or equivalent pure normalizers in the future implementation.
4. Create/open `dictionary-mobile-user.sqlite`, write `schema_version=1`, then insert all normalized rows inside a single transaction.
5. Verify parity counts and representative fields:
   - one profile row;
   - folder count excluding virtual favorites behavior;
   - saved word count and folder membership count;
   - flashcard count and SM-2 fields;
   - search history count;
   - reader document count and selected document id.
6. Keep AsyncStorage payloads readable after first migration. Do not delete old keys until a later cleanup module proves the SQLite runtime path in web/native smoke.
7. Make migration idempotent: re-running migration replaces rows from the same source snapshot or detects completed schema version without duplicating relations.
8. On failure, close the database, keep AsyncStorage as source of truth, and show a recoverable error path in the future UI.

### Verification Design

Future migration implementation should add focused tests before switching runtime reads:

- profile fixture with empty email/phone and non-default notification preferences;
- library fixture with folders, deleted folder ids, saved words in multiple folders, tags, notes, and search history;
- flashcard fixture with each card type, SM-2 review fields, `pending_create`, `pending_update`, `pending_delete`, and `synced` states;
- reader fixture with multiple documents, selected document fallback, source format, and non-default settings;
- corrupted/missing AsyncStorage payload fixture proving fallback and rollback behavior;
- export compatibility test proving JSON export still includes the same user-owned domains after migration.

Acceptance criteria for the implementation module:

- no backend/auth provider required;
- no changes to offline dictionary pack SQLite databases;
- migration can run more than once without duplicate rows;
- reset/delete flows clearly target user data and do not silently delete offline packs;
- `npx tsc --noEmit`, `npm run lint`, focused migration tests, and full `npm test -- --run` pass.

### Migration Bridge Implementation

The first implementation bridge now exists without changing Profile, Library, or Reader runtime reads:

- `data/userDatabaseSchema.ts` owns the `dictionary-mobile-user.sqlite` database name, schema version, schema SQL, Expo SQLite open/delete ports, and schema bootstrap helper.
- `data/userDatabaseMappers.ts` serializes normalized `UserProfile`, `LibraryState`, and `ReaderState` snapshots into SQLite row shapes for profile, folders, saved words, saved-word folder membership, search history, flashcards, tombstones, reader documents, and reader settings.
- `data/userDatabaseMigration.ts` runs export safety, reads the current AsyncStorage-backed stores, opens the user database, creates schema, replaces rows inside one SQLite transaction, and returns parity counts.
- `tests/userDatabaseMigration.test.ts` verifies schema execution, export safety, idempotent reruns, transaction rollback, multi-folder words, flashcard sync/delete fields, deleted folder tombstones, and reader selected-document fallback with a fake SQLite harness.

Runtime stores still use AsyncStorage as the source of truth. The next module should adopt the bridge behind Profile, Library, and Reader adapters only after web/native smoke proves reads, writes, export, reset, and rollback behavior.

### Runtime Adoption Implementation

Profile, Library, and Reader runtime persistence now routes through the local user SQLite adapter with AsyncStorage kept as a fallback and export-compatible backup:

- `data/userDatabaseRuntime.ts` loads the SQLite snapshot, runs the AsyncStorage-to-SQLite migration when `schema_version=1` is missing, parses rows back into existing `UserProfile`, `LibraryState`, and `ReaderState` types, and writes whole user-data snapshots transactionally.
- `data/profileStore.ts`, `data/libraryStore.ts`, and `data/readerStore.ts` now attempt SQLite reads/writes first and fall back to legacy AsyncStorage when SQLite is unavailable.
- Store writes still update legacy AsyncStorage after the SQLite attempt so existing JSON export remains readable during the transition.
- The Profile reset flow clears Profile, Library, and Reader user data while offline dictionary pack metadata/storage remains a separate boundary.
- `tests/userDatabaseRuntime.test.ts` covers migration-on-first-read, row parsing, adapter writes, relation dedupe, and SQLite reload behavior.

Do not remove legacy AsyncStorage keys yet. A follow-up module should run web/native smoke against Profile, Library, Reader, export, reset, and offline pack preservation before old keys become cleanup candidates.

### Runtime Smoke and Cleanup Readiness

SQLite runtime smoke coverage now verifies app-facing flows before legacy AsyncStorage cleanup:

- Profile smoke saves notification preferences through `saveUserProfile`, reloads through the SQLite runtime path, and verifies the AsyncStorage backup remains readable by `exportAllLocalData`.
- Library smoke uses public store functions for folder creation, saved words, search history, and flashcard generation, then reloads from SQLite without duplicate saved-word folder relations.
- Reader smoke imports documents, updates settings, selects a missing document id, and verifies normalized selected-document fallback after SQLite reload.
- Reset/export smoke clears Profile, Library, and Reader user data sequentially to avoid snapshot overwrite races, confirms offline pack metadata remains separate, and verifies export output is explicit after reset.
- `data/userDatabaseRuntime.ts` exposes `configureUserDatabaseRuntime` so tests can inject fake SQLite ports without changing production Expo SQLite behavior.

Legacy cleanup gates:

1. Keep Profile, Library, and Reader AsyncStorage writes enabled until at least one web smoke and one native/dev-client smoke pass with SQLite runtime enabled.
2. Do not remove legacy keys until export/import or backup UX explicitly advertises SQLite as the primary user-data source.
3. Cleanup must run as a separate, idempotent migration with a rollback note: if SQLite open/read fails, the app should still recover from the last retained JSON backup.
4. Offline dictionary pack metadata and per-pack SQLite databases are not part of user-data key cleanup.
5. Before deleting keys, run `git diff --check`, `npx tsc --noEmit`, `npm run lint`, focused database/store tests, full `npm test -- --run`, and Profile/Library/Reader smoke.

Legacy cleanup implementation:

- `data/userDataLegacyCleanup.ts` owns the explicit cleanup utility. It is not wired into normal store reads/writes; callers must opt into cleanup after SQLite runtime verification.
- Cleanup eligibility requires SQLite `schema_version=1`, the `local-profile` row, the `local-reader-settings` row, and readable library tables. Missing SQLite metadata or rows skips cleanup without deleting AsyncStorage data.
- Cleanup creates or reuses `dictionary-mobile.user-data-cleanup-backup.v1` after `exportAllLocalData` succeeds and before deleting legacy keys.
- The only removable keys are `dictionary-mobile.profile.v1`, `dictionary-mobile.library.v1`, and `dictionary-mobile.reader.v1`.
- `dictionary-mobile.offline-packs.v1` and per-pack SQLite databases remain app-owned offline dictionary data and must be preserved.
- `tests/userDataLegacyCleanup.test.ts` covers successful cleanup, idempotency, missing SQLite fallback, backup failure aborts, backup marker reuse, and offline-pack preservation.

## Supabase Cloud Sync MVP Contract

The cloud sync foundation is documented in `docs/supabase-cloud-sync-mvp.md`. It selects a minimal sync scope that mirrors the current local SQLite user database without changing offline dictionary pack storage.

### Supabase-Owned Tables

The MVP sync tables are:

- `user_profiles`
- `library_folders`
- `saved_words`
- `saved_word_folders`
- `search_history`
- `flashcards`
- `deleted_entities`
- `reader_documents`
- `reader_settings`

Each table must include `user_id`, local entity id or singleton primary key, `created_at`, `updated_at`, `deleted_at` where applicable, and `version` where conflict resolution needs it. RLS must be enabled before the mobile client can read or write these tables, with policies scoped to `auth.uid() = user_id`.

### Local-First Sync Rules

- Local SQLite remains the source of truth for offline use.
- Sync is disabled when Supabase env vars or auth session are unavailable.
- Pull remote tombstones before applying remote creates/updates.
- Push local dirty rows after remote merge succeeds.
- Record `lastSuccessfulSyncAt` per domain only after pull and push both succeed.
- Sign out stops sync subscriptions but does not delete local data.

### Conflict Rules

- Profile and reader settings use field-level or row-level latest timestamp merge as defined in `docs/supabase-cloud-sync-mvp.md`.
- Folders, saved words, reader documents, and memberships preserve local ids and use latest timestamp, with `deleted_at` winning over older/equal updates.
- Flashcards use higher `version` first, then newer `updated_at`; winning rows preserve SM-2 review fields.
- Tombstones must be retained until a backend retention policy proves all clients have observed them.

### Encrypted Backup Boundary

Encrypted backup and restore are not part of the sync MVP. A later module must define client/server encryption responsibility, key recovery, restore UX, backup manifest, retention, and account-deletion behavior before the app claims encrypted cloud backup support.

## Verification

Database planning and bridge verification:

```bash
git diff --check
npm test -- --run tests/userDatabaseMigration.test.ts
npx tsc --noEmit
npm run lint
npm test -- --run
```
