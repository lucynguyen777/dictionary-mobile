# Supabase Cloud Sync Manual Smoke Execution Prep

## Goal

Prepare the execution checklist and local-only result template for Supabase Cloud Sync manual smoke. This document does not run live Supabase smoke and does not accept production sync. It exists so auth smoke, SQL/RLS probes, and two-device sync smoke can be recorded consistently without committing secrets.

## Required Inputs

Before executing smoke, prepare these outside git:

- disposable Supabase project URL;
- publishable key in local uncommitted env;
- two disposable authenticated test users, if cross-user RLS probes are executed from clients;
- two test devices, browsers, or dev-client instances for same-user two-device smoke;
- a local notes file outside the repo for exact user ids, emails, project URL, and timestamps.

Never commit:

- `.env` values;
- project URLs;
- user ids;
- emails;
- auth tokens;
- screenshots containing secrets;
- service-role keys.

## Execution Order

Run smoke in this order:

1. **Static verification**
   - `git diff --check`
   - `npm test -- --run tests/supabaseSyncSmokeHarness.test.ts tests/supabaseSyncRunner.test.ts tests/supabaseSyncClient.test.ts tests/supabaseSyncMappers.test.ts tests/userDatabaseSyncMetadata.test.ts tests/supabaseCloudSyncMigration.test.ts`
   - `npx tsc --noEmit`
   - `npm run lint`
2. **Auth smoke**
   - Follow `docs/supabase-auth-manual-smoke.md`.
   - Record platform, env state, auth mode, sign-in, callback, recovery, foreground/background, and sign-out results.
3. **SQL/RLS migration review**
   - Apply `supabase/migrations/001_cloud_sync_mvp.sql` only to a disposable project.
   - Confirm all tables and policies from `docs/supabase-cloud-sync-manual-smoke.md`.
4. **RLS probes**
   - Execute own-row insert/select and cross-user block probes.
   - Record pass/fail only; keep exact ids and tokens outside git.
5. **Manual runtime harness smoke**
   - Run the harness only with explicit `enabled: true` and injected client boundary.
   - Confirm unconfigured, signed-out, and offline states do not mutate local rows.
6. **Two-device sync smoke**
   - Run the create/update/delete/tombstone/sign-out/re-sign-in flow from `docs/supabase-cloud-sync-manual-smoke.md`.
7. **Export/rollback check**
   - Confirm JSON export remains readable.
   - Confirm the production toggle remains hidden/unimplemented.
   - Confirm disabling env or signing out stops sync without deleting local data.

## Result Template

Copy this template into a local notes file outside git when executing smoke:

```text
Supabase Cloud Sync Manual Smoke Result
Date:
Executor:
App commit:
Supabase project: disposable / staging / other
Platforms:

Static verification:
- git diff --check:
- focused sync tests:
- npx tsc --noEmit:
- npm run lint:

Auth smoke:
- Web:
- Native/dev-client:
- Callback:
- Sign out preserves local data:

SQL/RLS migration review:
- Tables created:
- RLS enabled:
- Own-row CRUD policies:
- No service-role key in app:

RLS probes:
- User A insert own row:
- User A select own row:
- User B cannot select User A row:
- User B cannot update User A row:
- User B cannot delete User A row:
- Signed-out access blocked:
- Insert with another user_id blocked:

Manual runtime harness:
- Default disabled skip:
- Missing client skip:
- Enabled disposable-project run:
- Offline/signed-out no local mutation:

Two-device smoke:
- Device A create folder + word:
- Device B pull folder + word:
- Device B update note/tags:
- Device A pull update:
- Device A delete word:
- Device B receives tombstone:
- Sign out preserves local data:
- Re-sign-in keeps dirty local rows available:

Export/rollback:
- JSON export readable:
- Remove env disables sync safely:
- Production UI toggle remains absent:

Decision:
- PASS / FAIL / BLOCKED
- Follow-up fixes:
```

## Pass Criteria

Manual smoke can be considered passed only when:

- static verification passes;
- auth smoke passes on web and at least one native/dev-client path;
- SQL/RLS probes pass for own-user and cross-user access;
- manual runtime harness does not mutate local data when disabled, unconfigured, signed-out, or offline;
- two-device create/update/delete/tombstone flow passes;
- sign-out and rollback preserve local data;
- JSON export remains readable;
- no secrets or disposable project identifiers are committed.

## Failure Handling

If any smoke step fails:

- keep production sync toggle blocked;
- record the failure in local notes outside git;
- create a follow-up module with 3-5 focused tasks;
- do not broaden the module to realtime, background sync, encrypted backup, or restore UX;
- do not delete or reset local user data as a workaround.

## Next Gate

After a passing manual smoke result exists, the product owner can decide whether to accept the first production toggle path from `docs/supabase-cloud-sync-production-toggle-decision.md`. Until then, the app must remain local-first and production sync UI/lifecycle hooks stay blocked.
