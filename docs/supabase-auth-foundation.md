# Supabase Auth Foundation

## Goal

Define the auth contract before adding production login code. This foundation accepts Supabase Auth as the provider while preserving the app's current local-first behavior until an implementation module explicitly wires real sessions into UI and data flows.

## Current App Boundary

- App baseline: Expo SDK 54, React Native 0.81, React 19.1, Expo Router, SQLite-first local user data with AsyncStorage backup.
- Current URL scheme: `dictionairemobile` in `app.json`.
- Current profile model: `UserProfile` stores local display name, email, username, phone, avatar URL, login method, language goals, app lock, notification preferences, and `updatedAt`.
- Current account UI: profile/settings has editable local fields, disabled/coming-soon password behavior, delete/reset local data, and sign-out placeholder copy.
- Auth implementation is not present yet. Local profile data must not be treated as verified identity.

## Supabase Project And Environment Policy

- Required public env vars:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Do not commit Supabase project URLs, anon/publishable keys, service-role keys, or local `.env` values.
- Service-role keys must never be bundled into Expo/mobile/web client code.
- Initial client package plan:
  - `@supabase/supabase-js`
  - `react-native-url-polyfill`
  - keep existing `@react-native-async-storage/async-storage`
  - `expo-secure-store` is installed for native token persistence with documented web/dev fallback.
- Auth token adapter foundation:
  - `data/authTokenStorage.ts` uses Expo SecureStore on native;
  - `data/authTokenStorage.web.ts` uses localStorage on web and an SSR-safe memory fallback.
- Supabase client must live behind a small adapter, for example `data/auth/supabaseClient.ts`, so UI and stores do not import Supabase directly.
- Supabase client factory foundation now lives in `data/supabaseAuthClient.ts`; it stays unconfigured when public env vars are missing and uses the accepted token storage adapter.
- Auth state mapping foundation now lives in `data/authSession.ts`; it maps Supabase session/user/error outputs into the documented app auth states.
- Profile UI wiring now uses `data/authController.ts` to load the current auth snapshot and sign out without deleting local data.
- Auth form shell now calls the controller for email/password sign-in, sign-up, and password recovery while keeping unconfigured environments local-first.
- Auth module code must remain optional when env vars are missing. In that state the app stays local-first and shows coming-soon/unconfigured states rather than crashing.

## Redirect URL Policy

- Use the existing Expo scheme for native deep links:
  - `dictionairemobile://auth/callback`
- Supabase Dashboard redirect allow-list should include:
  - `dictionairemobile://**`
  - local Expo web/dev callback URL used during implementation smoke testing
  - production web URL only after hosting is selected
- Email confirmation, password recovery, and future OAuth flows must pass an explicit redirect URL.
- The callback route should exchange the returned session/token data, then navigate to Profile/Settings with a success or error state.
- OAuth is out of scope for the first auth implementation even though the profile model already has `apple` and `google` login method labels.

## Token Storage And Session Contract

- Initial session fields exposed to app UI:
  - `status`: `unconfigured`, `loading`, `unauthenticated`, `authenticated`, `needs_verification`, or `error`
  - `userId`: Supabase auth user id when authenticated
  - `email`: verified/auth email when available
  - `emailVerified`: boolean derived from Supabase user metadata/session state
  - `phone`: auth phone only after phone auth is explicitly implemented
  - `lastAuthEvent`: sign-in, sign-up, token refresh, sign-out, recovery, or error
- Persisted local profile remains separate from auth identity.
- When authenticated, auth email can prefill or label the profile email field, but the local profile email remains editable metadata until a sync/profile-claim module defines server-owned profile fields.
- Token refresh should follow Supabase React Native guidance: persist session, auto-refresh tokens, listen for auth state changes, and stop/start refresh based on app foreground state.
- Sign out clears the Supabase session and any auth-only cached state. It does not delete local profile/library/reader data unless the user chooses delete/reset.
- Offline app launch with a cached session should show the last known authenticated/local state and degrade network actions gracefully.

## Email, Password, Phone, And Recovery Contract

- First implementation scope:
  - email/password sign up
  - email/password sign in
  - email verification state
  - password recovery email
  - real sign out
- Phone verification remains staged until SMS/WhatsApp channel, cost, region, abuse controls, and UX copy are accepted.
- If Supabase email confirmation is enabled, sign-up can return a user without an active session; UI must show `needs_verification` and ask the user to check email.
- Existing-account errors should not expose more account enumeration detail than Supabase returns.
- Password requirements and validation copy should be defined in UI implementation, not hardcoded into this foundation beyond Supabase's minimums.

## Account Deletion Contract

- Account deletion must be a two-step destructive flow:
  1. Explain what is deleted locally and remotely.
  2. Require explicit confirmation before executing.
- Local deletion scope:
  - profile
  - library folders and saved words
  - flashcards/review state
  - reader documents/settings
  - auth-only cached session state
- Not deleted by auth account deletion:
  - app-owned offline dictionary packs unless the user chooses reset all local data
  - public dictionary source metadata and attribution
- Remote deletion scope after backend exists:
  - Supabase auth user
  - Supabase user-owned rows
  - sync tombstones/backups according to cloud sync retention policy
- If remote deletion fails after local deletion starts, UI must show a recoverable support/error state and keep an audit-safe retry path.

## Profile And Settings UI State Map

| State | Profile/settings behavior |
| --- | --- |
| `unconfigured` | Keep current local profile editing. Login, password, verification, and sign out show setup/coming-soon copy. |
| `loading` | Disable auth actions, keep local profile visible, show compact loading state. |
| `unauthenticated` | Show sign in/create account actions. Local profile remains editable and explicitly local. |
| `needs_verification` | Show check-email copy, resend verification action, and keep local profile data untouched. |
| `authenticated` | Show verified auth email/user id label, real sign out, account deletion entry, and local profile fields. |
| `error` | Show recoverable error copy and keep local-first profile available. |

## Implementation Gate

Real auth code can start after the next module agrees to:
- use the installed Supabase client dependencies and URL polyfill;
- use the accepted token storage decision in `.docs/decisions/auth-token-storage.md`: Expo SecureStore on native plus web fallback;
- build on the typed auth client/session adapter instead of importing Supabase in UI components directly;
- add callback/deep-link handling for `dictionairemobile://auth/callback`;
- preserve local SQLite profile/library/reader behavior when auth is unconfigured, offline, or signed out.

## Test Expectations

- Unit tests for auth state reducer/adapter mapping:
  - unconfigured env
  - sign-up needs verification
  - authenticated session
  - sign-out
  - recovery/error state
- UI tests or focused component tests for profile/settings state map.
- Manual smoke:
  - Expo web unconfigured env does not crash
  - native/dev-client callback URL opens the app
  - sign out does not delete local library/profile data
  - delete account confirmation distinguishes local reset from remote account deletion

## Source Notes

- Supabase React Native Auth quickstart documents `@supabase/supabase-js`, `react-native-url-polyfill`, session persistence, token auto-refresh, and auth-state listeners.
- Supabase native mobile deep-linking docs require registering an Expo scheme and adding redirect URL allow-list entries such as `scheme://**`.
- Supabase sign-up reference documents email confirmation behavior where a user may be returned without a session when confirmation is enabled.
- Supabase sign-out docs define sign-out through `supabase.auth.signOut()`.
