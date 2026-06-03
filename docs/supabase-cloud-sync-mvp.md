# Supabase Cloud Sync MVP

## Goal

Define the first cloud sync contract for local-first user data. This module does not implement sync code; it makes the next code module decision-complete by defining Supabase tables, ownership, conflict rules, offline replay behavior, and encrypted backup boundaries.

## Dependencies

- Supabase Auth Foundation is completed in `docs/supabase-auth-foundation.md`.
- Supabase Auth user id is the remote owner id for synced rows.
- Local SQLite user database remains the local source of truth while the app is offline or sync is unavailable.
- Offline dictionary packs remain app-owned cache data and are not synced in the MVP.

## MVP Scope

Sync these user-owned domains:

- profile/settings;
- library folders;
- saved words;
- saved-word folder membership;
- search history;
- flashcards and review scheduling;
- deleted entity tombstones;
- reader documents;
- reader settings.

Out of scope for MVP:

- encrypted cloud backup;
- restore wizard;
- offline dictionary pack sync;
- Google Sheets export;
- AI/translation proxy storage;
- support/helpdesk submission;
- shared folders or collaborative editing.

## Supabase Table Contract

All sync tables must include:

- `user_id uuid not null references auth.users(id) on delete cascade`;
- local id columns that preserve existing SQLite ids;
- `created_at timestamptz not null`;
- `updated_at timestamptz not null`;
- `deleted_at timestamptz`;
- `version integer not null default 1`;
- RLS enabled with policies scoped to `auth.uid() = user_id`.

Recommended table names and primary keys:

| Table | Primary key | Notes |
| --- | --- | --- |
| `user_profiles` | `(user_id)` | One row per auth user. Preserve local profile fields separately from Supabase auth email. |
| `library_folders` | `(user_id, id)` | Mirrors local `folders`, including color, color note, tags JSON, avatar URI, favorite flag, timestamps, and soft delete. |
| `saved_words` | `(user_id, id)` | Mirrors local `saved_words`, including word, IPA, definition, audio, note, tags JSON, source, timestamps, and soft delete. |
| `saved_word_folders` | `(user_id, word_id, folder_id)` | Mirrors folder membership join rows. Use soft delete or membership tombstone for removals. |
| `search_history` | `(user_id, id)` | Sync only recent bounded history if storage limits require trimming later. |
| `flashcards` | `(user_id, id)` | Mirrors SM-2 fields, review state, due date, sync status, last synced timestamp, version, and soft delete. |
| `deleted_entities` | `(user_id, entity_type, entity_id)` | Remote tombstones for folders, saved words, flashcards, reader documents, and future syncable entities. |
| `reader_documents` | `(user_id, id)` | Sync imported text documents. Large-document limits stay governed by existing Reader import size gates. |
| `reader_settings` | `(user_id)` | One row per auth user, including selected document id, font size, font family, background color, and timestamp. |

Use JSONB columns for current simple array fields such as tags, because local UI treats them as arrays and does not need relational tag search in the MVP.

## RLS And Realtime Policy

- Enable RLS on every sync table before exposing it to the client.
- Grant authenticated users only the minimum CRUD needed for their own rows.
- Policies must use `auth.uid() = user_id`; do not trust client-provided email, username, or profile metadata for ownership.
- The service role is reserved for admin/backend maintenance and must never be bundled in the app.
- Realtime Postgres Changes can be enabled table-by-table after RLS policies exist.
- Realtime is an optimization for fresh remote changes, not the only sync mechanism. The client must still run pull/push reconciliation on app start and foreground.

## Local To Remote Mapping

| Local SQLite table | Supabase table | Mapping rule |
| --- | --- | --- |
| `user_profile` | `user_profiles` | Local singleton `local-profile` maps to remote `(user_id)`. Auth email is shown as verified identity but local email remains profile metadata until profile-claim rules change. |
| `folders` | `library_folders` | Preserve folder ids and soft-delete rows with `deleted_at`. |
| `saved_words` | `saved_words` | Preserve saved word ids and source metadata. Do not treat dictionary source data as user-owned remote dictionary data. |
| `saved_word_folders` | `saved_word_folders` | Sync membership rows. Deletion uses either `deleted_at` on membership rows or a `deleted_entities` tombstone with entity type `saved_word_folder`. |
| `search_history` | `search_history` | Sync bounded recent history; old history trimming is allowed if documented before implementation. |
| `flashcards` | `flashcards` | Preserve SM-2 fields and `version`; review changes are user writes and should increment version. |
| `deleted_entities` | `deleted_entities` | Push/pull tombstones before applying remote creates or updates. |
| `reader_documents` | `reader_documents` | Preserve local document ids, source format, text, and soft delete. |
| `reader_settings` | `reader_settings` | Local singleton `local-reader-settings` maps to remote `(user_id)`. |

## Sync Flow

1. Deferred beyond v1.2.2: on authenticated app start or foreground:
   - v1.2.2 production behavior remains manual beta only; users must enable sync and tap "Sync now";
   - automatic app-start/foreground sync requires a later accepted production toggle module;
   - load local SQLite snapshot;
   - pull remote rows changed after `lastSuccessfulSyncAt`;
   - apply remote tombstones first;
   - merge remote rows into local SQLite;
   - push local dirty rows/tombstones;
   - record per-domain `lastSuccessfulSyncAt` only after successful pull and push.
2. While offline or unauthenticated:
   - keep writing local SQLite;
   - mark changed rows as dirty through existing or new sync metadata;
   - show local-first state without blocking lookup/library/reader workflows.
3. On reconnect:
   - replay dirty rows in deterministic domain order: profile, folders, saved words, memberships, flashcards, reader documents, reader settings, search history, tombstones.
4. On sign out:
   - stop sync subscriptions;
   - keep local data on device unless the user chooses delete/reset;
   - keep unsynced local dirty state available for the next sign in decision.

## Conflict Strategy

- Profile/settings: field-level merge for local profile metadata when fields differ and both timestamps changed; auth email remains Supabase Auth identity, not profile metadata.
- Folders: last writer wins per row using `updated_at`, except `deleted_at` wins over updates when delete is newer or equal.
- Saved words: last writer wins per row for note, tags, folder-independent metadata, and source fields; `deleted_at` wins over updates when delete is newer or equal.
- Folder membership: membership exists if the latest create timestamp is newer than the latest deletion/tombstone; otherwise it is removed.
- Flashcards: higher `version` wins; if versions tie, newer `updated_at` wins. Preserve SM-2 fields from the winning row.
- Search history: append/merge by id and normalized word/time; duplicates can be collapsed locally after sync.
- Reader documents: last writer wins by document row; `deleted_at` wins over updates when delete is newer or equal.
- Reader settings: last writer wins by `updated_at`.
- Tombstones: tombstones must be retained long enough for all clients to observe them; retention policy is a backend maintenance decision before automated pruning.

## Encrypted Backup And Restore Follow-Up

Encrypted backup is not required for the sync MVP.

Before claiming encrypted backup support, a later module must define:

- encryption key ownership and recovery model;
- whether encryption happens client-side before upload or server-side at rest only;
- restore UX for new devices, lost password, and partial restore;
- backup manifest format and domain selection;
- retention and deletion rules after account deletion.

The MVP may sync user rows under Supabase auth/RLS without presenting itself as encrypted backup.

## Implementation Gate

Cloud sync code can start when the next module agrees to:

- add Supabase client dependencies through the auth implementation path;
- create SQL migrations for the MVP tables with RLS policies;
- add a local sync metadata layer for dirty rows and per-domain last sync timestamps;
- write tests for conflict resolution, tombstone order, offline replay, sign-out preservation, and local export compatibility;
- keep sync disabled/unconfigured when auth/env vars are missing.

## Test Expectations

- Unit tests for pure merge/conflict functions by domain.
- Unit tests for local-to-remote row mappers and remote-to-local row parsers.
- Fake Supabase client tests for pull/push ordering and retry behavior.
- Store/runtime tests proving local writes work when sync is unconfigured or offline.
- Manual smoke:
  - first sign in on an existing local profile does not overwrite local data unexpectedly;
  - create folder on device A, pull to device B;
  - delete saved word on device A, tombstone removes it on device B;
  - sign out does not erase local data;
  - JSON export remains readable before and after sync.

## Source Notes

- Supabase RLS docs state that RLS should be enabled for exposed tables and can use `auth.uid()` to scope rows to the authenticated user.
- Supabase Realtime Postgres Changes can listen to insert/update/delete changes after tables are added to the realtime publication; RLS still matters for accessible events.
- Supabase table docs recommend primary keys for every table and commonly use UUID or identity columns, but this app should preserve existing local ids for local-first sync continuity.
