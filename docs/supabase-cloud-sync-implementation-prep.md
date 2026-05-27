# Supabase Cloud Sync Implementation Prep

## Goal

Prepare the first implementation slice for Supabase Cloud Sync without enabling production sync yet. This module turns the accepted MVP contract in `docs/supabase-cloud-sync-mvp.md` into concrete implementation boundaries for SQL/RLS migrations, local metadata, client adapters, fake-provider tests, and manual smoke gates.

## Implementation Slice Order

1. SQL/RLS migration draft for the MVP sync tables.
2. Local SQLite sync metadata additions for dirty rows, tombstones, remote versions, and per-domain sync cursors.
3. Pure row mappers and conflict helpers for local-to-remote and remote-to-local payloads.
4. Supabase sync client adapter behind unconfigured/offline guards.
5. Fake-client tests and manual smoke before any default production enablement.

Do not add realtime subscriptions, encrypted backup, restore wizard, Google Sheets export, or AI/proxy storage in this slice.

## SQL And RLS Migration Contract

Use a repo-owned migration file when the implementation starts, for example:

- `supabase/migrations/001_cloud_sync_mvp.sql`

The migration must create the MVP tables from `docs/supabase-cloud-sync-mvp.md`:

- `user_profiles`
- `library_folders`
- `saved_words`
- `saved_word_folders`
- `search_history`
- `flashcards`
- `deleted_entities`
- `reader_documents`
- `reader_settings`

Every table must:

- include `user_id uuid not null references auth.users(id) on delete cascade`;
- preserve the current local SQLite id for sync continuity;
- include `created_at`, `updated_at`, optional `deleted_at`, and `version` where conflicts need it;
- enable RLS before mobile reads or writes are exposed;
- scope select, insert, update, and delete policies with `auth.uid() = user_id`;
- avoid service-role keys in app code, tests, fixtures, docs examples, or Expo env files.

## Local Sync Metadata Contract

Before upload or replay exists, local SQLite needs explicit metadata for each syncable domain:

| Field | Purpose |
| --- | --- |
| `syncStatus` | `clean`, `dirty`, `deleting`, or `conflicted` local state. |
| `remoteVersion` | Last accepted remote `version` for conflict comparison. |
| `lastSyncedAt` | Last successful row-level sync timestamp. |
| `lastLocalChangeAt` | Local write timestamp used for push ordering and conflict tests. |
| `deletedAt` | Soft delete timestamp for tombstones and delete-wins behavior. |

Per-domain cursors should live outside individual rows so pull/push checkpoints can advance only after a full domain succeeds. Recommended domains:

- `profile`
- `folders`
- `saved_words`
- `saved_word_folders`
- `flashcards`
- `reader_documents`
- `reader_settings`
- `search_history`
- `tombstones`

## Sync Client Boundary

Add a thin adapter before wiring UI or background jobs:

- `loadRemoteChanges(domain, sinceCursor)`
- `pushLocalChanges(domain, rows)`
- `upsertRemoteRow(table, row)`
- `markRemoteDeleted(entityType, entityId, deletedAt)`
- `recordDomainCursor(domain, cursor)`

The adapter must return an explicit unconfigured/offline state when Supabase env vars or auth session are missing. Local writes must keep working in those states.

## Test Expectations

Focused tests should land before a real sync toggle is shown:

- SQL text or migration-shape tests for RLS enablement and `auth.uid() = user_id` policy coverage.
- Mapper tests for profile, folders, saved words, memberships, flashcards, reader documents, reader settings, search history, and tombstones.
- Conflict tests for delete-wins, last-writer, flashcard version precedence, and membership tombstones.
- Fake Supabase client tests for pull-before-push ordering, retry-safe dirty rows, and sign-out preservation.
- Export compatibility tests proving local JSON export remains readable before and after sync metadata exists.

## Manual Smoke Gate

Cloud sync can become a production implementation module only after:

- Supabase Auth manual smoke passes for web and at least one native/dev-client path;
- SQL/RLS migration review confirms no cross-user reads or writes;
- fake-client tests cover offline, unconfigured, auth sign-out, retry, and tombstone order;
- a manual two-device smoke script exists for create, update, delete, sign-out, and re-sign-in;
- sync remains off or unavailable when env vars are missing.

## Next Code Module Candidate

The SQL/RLS migration draft now lives in `supabase/migrations/001_cloud_sync_mvp.sql`, with migration-shape coverage in `tests/supabaseCloudSyncMigration.test.ts`.

The next code module should be **Supabase Cloud Sync Local Metadata Draft**. It should add local SQLite sync metadata and focused schema/migration tests only. Runtime sync, realtime, encrypted backup, and restore UX should remain out of scope until the local metadata slice passes review.
