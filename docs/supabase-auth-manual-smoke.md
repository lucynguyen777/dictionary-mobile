# Supabase Auth Manual Smoke Prep

## Goal

Define the manual smoke path for the current Supabase Auth implementation before starting cloud sync, support submission, account deletion, or backend proxy work.

This smoke prep does not commit real Supabase project values, service-role keys, test accounts, or production URLs.

## Current Auth Surface

Implemented app pieces:

- Secure token storage adapter:
  - native: `data/authTokenStorage.ts` using Expo SecureStore;
  - web/dev fallback: `data/authTokenStorage.web.ts`.
- Supabase client/config adapter:
  - `data/authConfig.ts`;
  - `data/supabaseAuthClient.ts`.
- Auth state/controller:
  - `data/authSession.ts`;
  - `data/authController.ts`.
- User-facing surfaces:
  - Profile account auth status panel;
  - Profile email/password sign-in, sign-up, and recovery shell;
  - `app/auth/callback.tsx` callback route.

Still out of scope:

- cloud sync;
- support feedback submission;
- backend account deletion;
- OAuth providers;
- phone verification;
- production Supabase RLS tables.

## Local Environment Setup

Create a local, uncommitted environment file for manual testing:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Rules:

- Do not commit `.env` values.
- Do not use a service-role key in Expo/mobile/web code.
- Use a disposable test Supabase project or test users for smoke.
- Keep local profile/library/reader data separate from Supabase auth identity during smoke.

## Supabase Dashboard Setup

Auth provider:

- Enable email/password sign-in.
- Enable or disable email confirmation intentionally before smoke; record which mode is used.
- Keep OAuth providers disabled for this smoke path.
- Phone auth remains disabled.

Redirect allow-list:

- Add `dictionairemobile://**`.
- Add local Expo web callback URL only for web smoke, for example the development origin that routes to `/auth/callback`.
- Add a production web URL only after hosting is selected.

Email templates:

- Confirmation and recovery links should route to `dictionairemobile://auth/callback` for native smoke.
- For web smoke, use the configured local web callback URL.

## Manual Smoke Matrix

| Platform | Scenario | Expected result |
| --- | --- | --- |
| Expo web without env | Open Profile account settings | Auth panel shows local/unconfigured state; app does not crash. |
| Expo web with env | Sign in with valid test user | Auth panel becomes authenticated; local profile data remains visible/editable. |
| Expo web with env | Sign in with bad password | Auth panel or alert shows provider error; no local data is deleted. |
| Expo web with env | Sign up with email confirmation enabled | Auth panel shows needs-verification or unauthenticated state based on Supabase response; user is told to check email. |
| Expo web with env | Send recovery email | Alert says recovery email was sent; no session is faked. |
| Expo web callback | Open `/auth/callback?code=...` from Supabase link | Route exchanges code and returns a cloud-ready/success or provider error state. |
| Expo Go/native without env | Open Profile account settings | Auth panel stays local/unconfigured and app does not crash. |
| Dev-client/native with env | Open `dictionairemobile://auth/callback` | App opens callback route; missing-code state is clear when no code is present. |
| Foreground/background | Background and foreground the app after sign-in | Auto-refresh start/stop path does not crash and auth panel remains recoverable. |
| Sign out | Tap sign out after authenticated state | Supabase session clears; local profile/library/reader data remains. |

## Verification Commands

Run before committing auth smoke-related changes:

```bash
git diff --check
npx tsc --noEmit
npm run lint
npm test -- --run tests/authConfig.test.ts tests/authSession.test.ts tests/authTokenStorage.test.ts tests/supabaseAuthClient.test.ts tests/authController.test.ts
```

Optional after env is configured:

```bash
npm run web
```

Then manually open Profile account settings and run the smoke scenarios above.

## Acceptance Gate

Auth manual smoke prep is complete when:

1. env setup and secret rules are documented;
2. Supabase Dashboard redirect allow-list is documented;
3. web and native smoke scenarios are listed;
4. expected local-first/no-data-delete behavior is explicit;
5. verification commands are listed.

After this gate, the next implementation module can be selected from:

- Supabase Cloud Sync MVP implementation prep;
- support feedback backend schema/route prep;
- account deletion backend prep;
- auth manual smoke fixes discovered by the matrix.
