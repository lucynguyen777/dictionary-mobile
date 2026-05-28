# Supabase Cloud Sync Production Toggle Decision Prep

## Goal

Define the decision gate before Supabase Cloud Sync can appear in production UI, app lifecycle hooks, or background sync. The current implementation has schema, local metadata, row mappers, fake-client ordering, guarded runtime adapter, local port, runner wiring, and an explicit manual smoke harness. It still must not sync automatically for users.

## Current State

Implemented and test-covered:

- Supabase SQL/RLS migration draft in `supabase/migrations/001_cloud_sync_mvp.sql`;
- local sync metadata and cursor schema in `data/userDatabaseSchema.ts`;
- row mapper contracts in `data/supabaseSyncMappers.ts`;
- sync runner contract in `data/supabaseSyncClient.ts`;
- guarded runtime adapter in `data/supabaseSyncRuntimeAdapter.ts`;
- local SQLite sync port in `data/supabaseSyncLocalPort.ts`;
- guarded runner composition in `data/supabaseSyncRunner.ts`;
- explicit manual smoke harness in `data/supabaseSyncSmokeHarness.ts`.

Still not implemented:

- Profile or Settings sync toggle;
- automatic foreground/background sync;
- realtime subscriptions;
- production conflict-resolution UX;
- encrypted backup or restore UX;
- production telemetry, quota, or support tooling for sync failures.

## Production Toggle Options

| Option | Description | Benefit | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| Manual developer harness only | Keep `runSupabaseSyncManualSmoke` as the only runtime path. | Safest while RLS/two-device smoke is incomplete. | No user-visible sync. | Current default. |
| Settings beta toggle | Add an opt-in Profile/Settings switch for signed-in users after smoke passes. | Lets real users test sync intentionally. | Needs clear copy, retry state, conflict handling, and support path. | Preferred first production UI path after smoke. |
| Auto foreground sync | Run sync on sign-in/app foreground when configured. | Best convenience. | Higher blast radius if merge/dirty metadata is wrong. | Defer until beta toggle is stable. |
| Background/realtime sync | Add background jobs or Supabase realtime. | Freshest data. | Platform limits, battery/network complexity, harder failure recovery. | Defer beyond MVP. |

## Required Product Decisions

Before a production sync toggle can be implemented, decide:

- whether the first user-facing surface is Profile, Settings, or a dedicated Sync screen;
- whether sync is opt-in beta, opt-out default, or forced after sign-in;
- how to label local-first behavior and sign-out preservation;
- what UI state is shown for unconfigured, signed-out, offline, syncing, synced, failed, and partial-failed states;
- whether users can sync selected domains or only the whole MVP set;
- how much conflict detail is shown to users in MVP;
- whether failed sync reports are local-only or can be submitted through the future support channel.

Recommended MVP decision: **Profile/Settings opt-in beta toggle after manual smoke passes**, whole MVP domain set, local-first copy, local-only failure details, and no realtime/background sync.

## Acceptance Gate

A production toggle module can move from decision-prep to implementation only after:

1. Supabase Auth manual smoke passes for Expo web and at least one native/dev-client path.
2. SQL/RLS probes pass for two disposable users.
3. Two-device manual sync smoke passes for create, update, delete/tombstone, sign-out, and re-sign-in.
4. JSON export remains readable after sync metadata and manual harness runs.
5. Product owner accepts the first surface, opt-in policy, UI states, and domain scope.
6. A rollback plan exists to hide/disable the toggle without deleting local data.

## First Implementation Module After Acceptance

When accepted, the first code module should be **Supabase Cloud Sync Profile Beta Toggle Shell**:

- render signed-in/unconfigured/offline/sync disabled states;
- keep the toggle hidden or disabled until env/auth/manual-smoke gates are satisfied;
- call no automatic sync on mount;
- provide a manual "sync now" action only behind opt-in beta state;
- surface local-first and no-local-delete copy.

Realtime, background sync, encrypted backup, restore UX, and cross-device conflict UX remain later modules.
