# Supabase Cloud Sync Manual Smoke Prep

## Goal

Define the manual smoke gate for Supabase Cloud Sync before any production runtime sync is wired into the app. This document assumes the current code has only schema, metadata, mapper, and fake-client contracts.

This smoke prep does not enable realtime subscriptions, background jobs, encrypted backup, restore UX, service-role access, or a user-facing sync toggle.

## Preconditions

Complete these checks before attempting any cloud sync smoke:

- Supabase Auth manual smoke in `docs/supabase-auth-manual-smoke.md` passes for Expo web and at least one native/dev-client path.
- Local Supabase env values are present only in uncommitted local env files.
- `supabase/migrations/001_cloud_sync_mvp.sql` has been reviewed for table coverage, RLS enablement, and own-row policies.
- Focused tests pass for migration shape, local metadata, row mappers, and fake-client ordering.
- A disposable Supabase project or disposable test schema is used for manual sync smoke.

## Secret And Access Rules

- Never commit Supabase project URLs, publishable keys, test credentials, or SQL editor screenshots with secrets.
- Never use or expose a service-role key in Expo, web, native, test fixture, or docs examples.
- Use authenticated test users only; anonymous or public sync writes are not part of the MVP.
- Keep local Profile, Library, Reader, and offline dictionary pack data local-first during smoke.

## SQL Migration Review Checklist

Before running a migration against a disposable project:

- Confirm every MVP table exists in the migration:
  - `user_profiles`
  - `library_folders`
  - `saved_words`
  - `saved_word_folders`
  - `search_history`
  - `flashcards`
  - `deleted_entities`
  - `reader_documents`
  - `reader_settings`
- Confirm every table has `user_id` referencing `auth.users(id) on delete cascade`.
- Confirm every table enables RLS before mobile reads/writes are allowed.
- Confirm every table has authenticated select, insert, update, and delete policies scoped with `auth.uid() = user_id`.
- Confirm no policy trusts email, username, profile metadata, or client-provided owner fields other than `user_id`.
- Confirm the migration does not create realtime publication entries by default.

## RLS Probe Matrix

Use two disposable users: User A and User B.

| Probe | Expected result |
| --- | --- |
| User A inserts own `library_folders` row | Insert succeeds. |
| User A selects own row | Row is visible. |
| User B selects User A row | Row is not visible. |
| User B updates User A row | Update is rejected or affects zero rows. |
| User B deletes User A row | Delete is rejected or affects zero rows. |
| Signed-out request selects sync table | Request is rejected or returns no rows. |
| User A inserts row with User B `user_id` | Insert is rejected by `with check`. |

Record only pass/fail notes locally; do not commit user ids, emails, tokens, or project URLs.

## Two-Device Manual Smoke Script

This script is the acceptance shape for a later runtime sync module. It is not runnable until real client wiring exists.

1. Device A signs in as User A.
2. Device B signs in as the same User A.
3. Device A creates a folder and saves one word to that folder.
4. Device B runs a foreground/start sync and sees the folder plus saved word.
5. Device B edits the saved word note or tags.
6. Device A runs foreground/start sync and sees the edited note or tags.
7. Device A deletes the saved word.
8. Device B runs foreground/start sync and the tombstone removes the saved word locally.
9. Device A signs out.
10. Device A local data remains on device unless the user chooses a reset/delete action.
11. Device A signs back in and unsynced local dirty rows remain available for the next sync decision.

## Failure And Rollback Expectations

- Missing env or missing auth session returns unconfigured/signed-out state and does not mutate local rows.
- Network offline state does not mark dirty rows as synced.
- Push failure keeps dirty rows dirty for retry.
- Pull failure does not advance per-domain cursors.
- Partial domain failure stops later domains until the next retry.
- Sign-out stops sync orchestration and keeps local user data available.
- JSON export remains readable before and after sync metadata exists.

## Verification Commands

Run before committing sync smoke-related changes:

```bash
git diff --check
npm test -- --run tests/supabaseSyncSmokeHarness.test.ts tests/supabaseSyncRunner.test.ts tests/supabaseSyncClient.test.ts tests/supabaseSyncMappers.test.ts tests/userDatabaseSyncMetadata.test.ts tests/supabaseCloudSyncMigration.test.ts
npx tsc --noEmit
npm run lint
```

Optional after disposable Supabase setup:

```bash
npm run web
```

Then run auth smoke first, SQL/RLS probes second, and the two-device sync script only after runtime sync wiring exists.

## Manual Runtime Harness

`data/supabaseSyncSmokeHarness.ts` provides an explicit opt-in manual harness for disposable-project smoke. By default it returns `skipped` and does not open SQLite or call Supabase.

The harness may run only when:

- `enabled: true` is passed by a developer/manual smoke path;
- a Supabase client factory or test client port is injected;
- local env values are uncommitted;
- auth smoke and SQL/RLS review have already passed.

Do not call this harness from app startup, Profile UI, background jobs, or production settings until the two-device manual smoke has passed and a separate production toggle module is accepted.

## Acceptance Gate

Sync manual smoke prep is complete when:

1. auth dependency and disposable-project expectations are documented;
2. SQL/RLS migration review checklist is documented;
3. RLS cross-user probes are documented;
4. two-device create/update/delete/sign-out smoke script is documented;
5. failure, retry, rollback, and verification commands are documented.

After this gate, the next module can be **Supabase Cloud Sync Runtime Adapter Draft**, but runtime sync must still stay behind unconfigured/offline/auth guards and should not expose a production sync toggle until manual smoke has actually passed.
