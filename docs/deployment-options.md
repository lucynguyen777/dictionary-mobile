# Deployment Options

This app is ready to ship as v1.3.0 with the completed feature set documented in `docs/product-progress.md`.

## Current Deploy Scope

Enabled for this release:

- Lookup/search/audio/save-to-folder.
- Library/folders with create/import/export/rename/delete/share/favorite/color/note flows.
- CSV/XLS/Anki text import and export.
- Reader import/read/select/save/TTS/progress.
- Flashcards and local learning analytics.
- Profile local privacy/settings/export/reset/app lock.
- Supabase Auth when public Supabase env vars are configured.
- Manual beta Supabase Cloud Sync for signed-in users; no automatic foreground/background sync.
- DeepL translation and AI Tutor through the Vercel `/backend-proxy` route when provider env vars are configured.
- Offline pack status shell and current minimal futuristic UI polish.

Parked as `Cập nhật trong phiên bản sau`:

- Real OCR/STT, Google Sheets export, encrypted cloud backup/restore, account deletion backend, feedback submission, specialized document translation/glossary persistence, pronunciation scoring, unsupported language/source gates, and production etymology/conjugation.

## Required Verification

Run before any deploy:

```bash
git diff --check
npx tsc --noEmit
npm run lint -- --max-warnings=0
npm test -- --run
```

For UI changes, also smoke Expo web on one narrow mobile viewport and one desktop viewport.

## Web Deployment

Selected first path: Expo web static export on Vercel plus a Vercel Function for backend proxy traffic.

Build command:

```bash
npm run build:web:clean
```

Output directory:

```txt
dist
```

Hosting options:

| Option | When to use | Build settings |
| --- | --- | --- |
| Vercel | Fast previews, easy custom domains, good default for Expo web static output. | Build: `npm run build:web:clean`; Output: `dist`. |
| Netlify | Simple static hosting and redirects. | Build: `npm run build:web:clean`; Publish: `dist`. |
| Cloudflare Pages | Low-cost global static hosting. | Build: `npm run build:web:clean`; Output: `dist`. |
| S3/CloudFront or static server | When infra is already AWS/self-hosted. | Upload `dist` after build. |

### Vercel Setup

The repo includes `vercel.json` so Vercel can infer the production build:

```txt
Build command: npm run build:web:clean
Output directory: dist
Framework preset: Other
```

Vercel deploy options:

```bash
npx vercel
npx vercel --prod
```

Or connect the GitHub repository in the Vercel dashboard and use the same build settings above.

Route handling:

- Static files are exported under `dist`.
- `/backend-proxy/:path*` is rewritten to `/api/backend-proxy?path=:path*` so DeepL/OpenAI calls stay same-origin and server-side.
- `/folder/:id` is rewritten to the exported dynamic route shell.
- `/auth/callback` is rewritten to the exported callback shell for Supabase Auth redirects.

Notes:

- Local-first flows work without production secrets.
- Supabase/Auth requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel.
- Backend proxy requires `DEEPL_API_BASE_URL`, `DEEPL_API_KEY`, `OPENAI_API_KEY`, and `OPENAI_TEXT_MODEL` in Vercel. Optional proxy limit env vars can tune quota.
- Add `https://dictionaire-mobile.vercel.app/auth/callback` and the native `dictionairemobile://auth/callback` URL to the Supabase redirect allow-list before production auth smoke.
- Keep blocked OCR/STT/OAuth/speech/source-gated copy visible and disabled.

## Native App Deployment

Recommended first path: Expo EAS builds.

Preview builds:

```bash
npm run build:android:preview
npm run build:ios:preview
```

Production builds:

```bash
npm run build:android:production
npm run build:ios:production
```

Submit:

```bash
npm run submit:android
npm run submit:ios
```

Current native identifiers:

```txt
iOS bundleIdentifier: com.dictionaire.mobile
Android package: com.dictionaire.mobile
```

Before store submission:

- Confirm the bundle/package identifiers match the real Apple Developer and Google Play Console app records.
- Replace placeholder app display metadata, screenshots, privacy policy URL, support URL, and store listing copy.
- Confirm App Privacy/Data Safety answers match v1.3.0: local-first guest mode, local export/reset, Supabase Auth/manual beta Cloud Sync only when configured, AI/DeepL through backend proxy only when configured, and no Google OAuth in this release.
- Camera, microphone, and photo-library permissions are intentionally not declared for this production config because Voice/OCR are parked for a later version.
- Re-add native permissions only when real OCR/STT is production-enabled and tested in a dev-client/custom native build.

## Recommended Release Path

1. Ship web first with static hosting, because it has the lowest review friction and is best for validating UI, copy, and local-first flows.
2. Build Android preview APK with EAS for device smoke.
3. Build iOS preview through TestFlight after Apple account/app record setup.
4. Submit Android App Bundle and iOS production build after store metadata and privacy forms are complete.

## Rollback

- Web: redeploy the previous successful static build from the host dashboard.
- Native: keep the previous production app version available in stores; use phased rollout so a bad release can be paused.
