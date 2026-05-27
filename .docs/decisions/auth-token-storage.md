# Decision: Auth Token Storage

## Status
Accepted

## Context

Supabase Auth implementation needs an explicit token storage policy before real sessions, token refresh, sign out, password recovery, and account deletion flows are wired into UI.

## Options

1. Expo SecureStore on native plus web fallback.
2. AsyncStorage everywhere.
3. Hybrid adapter using SecureStore on native and AsyncStorage/localStorage fallback on web/dev.

## Decision

Use **Expo SecureStore on native plus web fallback** as the auth token storage strategy.

Native iOS/Android builds should store Supabase session tokens in `expo-secure-store`. Expo web/dev fallback may use the documented Supabase web/local storage path behind the same adapter, but native should not use AsyncStorage for long-lived auth tokens.

## Consequences

- Auth implementation can add `expo-secure-store` with the Supabase client dependencies.
- Supabase storage must live behind a typed adapter so UI code never imports platform storage directly.
- Sign out must clear SecureStore tokens and web fallback tokens.
- Missing SecureStore, unconfigured env vars, or unsupported web fallback must degrade to `unconfigured` or `unauthenticated` states without crashing.
- Existing local profile/library/reader data remains separate from auth identity and must not be deleted on sign out.

## Tasks Unblocked

- Supabase auth dependency installation planning.
- SecureStore-backed auth storage adapter implementation.
- Auth session reducer and sign-out tests.
- Deep-link callback implementation planning.
