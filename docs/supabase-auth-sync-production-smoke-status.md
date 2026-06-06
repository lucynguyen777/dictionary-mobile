# Supabase Auth And Cloud Sync Production Smoke Status

This is the v1.3.7 execution status after v1.3.6 shipped. It records the production-smoke prerequisite check without committing any Supabase project values, user ids, emails, tokens, or screenshots.

## Current Result

Status: **BLOCKED - production smoke setup is incomplete**.

The Supabase project and publishable client configuration were re-verified on 2026-06-06. The project health endpoint responds successfully, local Expo env is configured without committing values, and Vercel Production/Development have the required Expo public variables. Live auth/RLS/two-device smoke is still incomplete:

| Requirement | Status | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Configured | Present locally through ignored `.env.local` and in Vercel Production/Development. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Configured | Present locally through ignored `.env.local` and in Vercel Production/Development. |
| Vercel Preview env | Needs branch selection | Vercel CLI requires a target preview Git branch before adding the variables. |
| Disposable Supabase project or test schema | Not verified | Required before applying/reviewing migrations or probing RLS. |
| Two disposable auth users | Not available in this environment | Required for cross-user RLS probes. |
| Two devices/browsers/dev-client instances | Not available in this environment | Required for manual sync create/update/delete/tombstone smoke. |

## What Was Verified Locally

- Release v1.3.6 is pushed and production-deployed.
- Supabase project health responds successfully with the configured public client values.
- Focused auth/config/controller/sync runtime/lifecycle tests pass with the local Expo env loaded.
- The app still keeps Supabase Auth and Cloud Sync guarded by env/session availability.
- Existing local guard tests continue to cover:
  - auth config/session/controller behavior without real Supabase network calls;
  - sync SQL/RLS migration shape;
  - sync mapper/client/runtime/local-port/runner behavior with fake clients;
  - manual smoke harness skip behavior when no injected client is provided.
- Manual sync remains explicit: users must enable beta sync and tap `Đồng bộ ngay` / `Sync now`; no automatic foreground/background/realtime sync is accepted.

## Required User Setup Before I Can Continue v1.3.7

1. In Supabase Dashboard, confirm email/password auth is enabled.
2. Add redirect allow-list entries:
   - `dictionairemobile://**`
   - `https://dictionaire-mobile.vercel.app/auth/callback`
   - any local Expo web callback URL used for smoke, for example `http://localhost:8081/auth/callback`
3. Apply/review `supabase/migrations/001_cloud_sync_mvp.sql` in a disposable project or disposable schema.
4. Create two disposable users for RLS probes.
5. Add the public Expo variables to any Vercel Preview branch that will be used for smoke.
6. Do not provide or commit a Supabase service-role key to the mobile/web app.
7. Prepare two browsers, devices, or dev-client sessions signed in as the same user for the two-device sync smoke.

## Smoke To Run After Setup Exists

1. Auth smoke from `docs/supabase-auth-manual-smoke.md`.
2. SQL/RLS migration review and cross-user probes from `docs/supabase-cloud-sync-manual-smoke.md`.
3. Two-device manual sync from `docs/supabase-cloud-sync-manual-smoke-execution.md`.
4. Regression checks:
   - signed-out users keep local data;
   - sign-out does not delete Profile/Library/Reader data;
   - dirty rows stay dirty after offline/provider failure;
   - no automatic app-start/foreground sync runs.

## Decision

Do not mark v1.3.7 complete yet. Supabase is connected and configured, but keep Cloud Sync at manual beta until redirect, RLS, and two-device pass/fail results are recorded without secrets.
