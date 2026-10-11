# Release Checklist v2.0

Plan task 7.5. One place to see what must be true before a store release. Owner decisions are listed in `docs/completion-plan.md` §8; feature status lives in `docs/product-progress.md`. Testing practice is in `docs/testing-and-build-guide.md`.

## 1. Code gates (every release candidate)

- [ ] CI `Verify` workflow green on the release commit: whitespace, `tsc`, lint, unit tests, Chandra pytest, Playwright on Expo web.
- [ ] `docs/product-progress.md` checklist matches the code; no `[~]` row is described as shipped in store copy.
- [ ] No fixture or mock data presented as production. The bundled English offline pack (`public/offline-packs/enwiktionary-lite`, 2 entries) is labelled "pack mẫu" in Profile; replace it with a built pack (see `docs/offline-dictionary-mvp.md`) before release.
- [ ] `constants/appRelease.ts` and `package.json` version bumped together; release notes written.

## 2. Backend and data (owner: D2, D4)

- [ ] Supabase project restored; migrations `001`–`011` applied in order (`supabase/migrations/`).
- [ ] Supabase Auth redirect allow-list includes the web origin and the native scheme callback (`/auth/callback`, including `?flow=recovery`).
- [ ] Two real accounts on two devices: Cloud Sync create/edit/delete/conflict smoke, glossary sync smoke, account isolation check.
- [ ] Vercel server env (never `EXPO_PUBLIC_*`):

| Variable | Needed for |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | durable quota (011), feedback, Google token storage |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | token verification (public values) |
| `DEEPL_API_KEY`, `DEEPL_API_BASE_URL` | translation |
| `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL` | AI Tutor, specialized translation |
| `PROXY_DAILY_AI_REQUEST_LIMIT_PER_USER`, `PROXY_DAILY_TRANSLATION_CHARACTER_LIMIT_PER_USER`, `PROXY_MONTHLY_CHARACTER_LIMIT_PER_USER`, `PROXY_MAX_TEXT_INPUT_CHARS`, `PROXY_MAX_GLOSSARY_ENTRIES` | spend limits (defaults apply if unset) |
| `USER_PROVIDER_SECRET_ENCRYPTION_KEY` | encrypting stored provider tokens |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_OAUTH_STATE_SECRET` | Google Sheets export |
| `BACKEND_PROXY_ALLOWED_ORIGINS` | extra web origins (D4) |

- [ ] App build env (public only): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_BACKEND_PROXY_URL` (set in `eas.json`), optional `EXPO_PUBLIC_CHANDRA_OCR_URL`, `EXPO_PUBLIC_READER_ENABLE_PDF`.
- [ ] Provider spend limits set at OpenAI and DeepL dashboards, independent of app quotas.

## 3. Provider smoke (signed-in user, web and native)

- [ ] DeepL translation on Word and Reader; 429 copy after the daily limit.
- [ ] AI Tutor streams on web and on a native build (expo/fetch), stop button works.
- [ ] Specialized translation applies glossary terms; quota header updates.
- [ ] Feedback form stores a row in `feedback`; 6th submission in 24h is refused.
- [ ] Google Sheets connect → export a folder → revoke.
- [ ] Chandra OCR (if hosted): scanned PDF import with sign-in; 401 when signed out.

## 4. Store requirements (owner: D3, D5, D8)

- [ ] In-app account deletion implemented and reachable (D3); deletion URL for store listings.
- [ ] Privacy Policy and Terms published; links in Profile point to them (D5).
- [ ] Help center content and support inbox; feedback notification (Resend) if chosen (D5).
- [ ] Crash/error reporting decided and wired, with privacy copy (D8).
- [ ] Apple Privacy Nutrition Label and Google Data Safety filled from what actually leaves the device: account email, synced learning data (opt-in), translation/AI text sent to providers, feedback text.
- [ ] Store screenshots from the release build (light and dark), Vietnamese copy reviewed.
- [ ] Licences: Wiktionary-derived content shown with CC BY-SA attribution; Acknowledgements screen lists sources.

## 5. Build and rollout

- [ ] OTA updates (plan 7.2): `expo-updates`, `runtimeVersion: { policy: 'appVersion' }` and per-profile channels (`development`, `preview`, `production`) are already configured. With the Expo account: `npx eas-cli init` (adds `extra.eas.projectId`), `npx eas-cli update:configure` (adds `updates.url`), rebuild, then publish with `npx eas-cli update --channel preview --message "…"`. Bump `version` for any native change so old builds never receive incompatible JS.
- [ ] `npx eas-cli build --profile production` for iOS and Android; install on real devices.
- [ ] Native smoke on devices: `.maestro/` flows, app lock, offline lookup in airplane mode, dark mode, reduced motion.
- [ ] Staged rollout; watch crash reports and provider spend for the first 48 hours.
