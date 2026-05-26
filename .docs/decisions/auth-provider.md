# Decision: Auth Provider

## Status
Accepted

## Context
The app needs an auth provider before implementing real email login, account identity, password changes, session handling, and account deletion.

## Options
1. Supabase
2. Firebase
3. Clerk
4. Custom backend

## Decision
Choose **Supabase Auth**.

Use Supabase as the project auth provider for email/password account identity, session handling, password recovery, real sign out, and future backend-backed account deletion. Keep the current app local-first until the Supabase Auth Foundation module documents project/env policy, redirect URLs, token storage, and local/offline fallback behavior.

Foundation document: `docs/supabase-auth-foundation.md`.

## Consequences
- Auth and backend identity use the same Supabase project boundary.
- Expo React Native integration uses the existing `dictionairemobile` URL scheme and must allow-list `dictionairemobile://**` in Supabase Auth redirect settings before email confirmation/recovery flows are enabled.
- Supabase client setup must use public Expo env vars only and keep service-role keys out of client bundles.
- Token/session persistence must be hidden behind an auth adapter; the first implementation must choose documented AsyncStorage/localStorage persistence or an explicit `expo-secure-store` adapter before adding code.
- Local profile/library/reader data remains device-local until explicit sync modules are implemented.
- Account deletion must cover both local SQLite data and future Supabase-owned records.

## Tasks Unblocked
- Email login
- Password reset
- Phone/email verification
- Account deletion
- Cloud sync identity
