# Database Architecture Plan

## Goal

Dictionary Mobile uses a hybrid local-first database strategy:

- local app data stays usable without accounts or network access;
- offline dictionary packs use dedicated SQLite databases per language pack;
- backend database, auth identity, cloud sync, and encrypted backup remain blocked until provider decisions are accepted.

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
   - Blocked until auth provider, backend architecture, and cloud sync decisions are accepted.
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

The following remain blocked and must not be implied as selected by this plan:

- auth provider;
- backend architecture;
- cloud sync database;
- encrypted backup destination;
- server-side account deletion;
- feedback/support submission destination.

When those decisions are accepted, cloud sync should use local entity ids, timestamps, versions, and soft-delete metadata already present or introduced by the local user database migration module.

## Next Implementation Modules

1. **Local user-data SQLite migration readiness**
   - Define local user database schema, entity ownership, migration plan from AsyncStorage, and focused tests.
2. **Backend/auth database decision**
   - Choose auth/backend/cloud sync provider and update decision docs before implementing server-side data.
3. **Offline pack storage management expansion**
   - Add storage limits, installed-size reporting, update checks, and deletion UX around existing pack SQLite databases.

Recommended next module: **Local user-data SQLite migration readiness**, because it improves local-first foundations without requiring backend/auth decisions.

## Verification

This planning module is doc-only. Verification:

```bash
git diff --check
npx tsc --noEmit
npm run lint
```
