# Deployment Options

This app is ready to ship as a local-first build with the completed feature set documented in `docs/product-progress.md`.

## Current Deploy Scope

Enabled for this release:

- Lookup/search/audio/save-to-folder.
- Library/folders with create/import/export/rename/delete/share/favorite/color/note flows.
- CSV/XLS/Anki text import and export.
- Reader import/read/select/save/TTS/progress.
- Flashcards and local learning analytics.
- Profile local privacy/settings/export/reset/app lock.
- Offline pack status shell and current minimal futuristic UI polish.

Parked as `Cập nhật trong phiên bản sau`:

- Real OCR/STT, Google Sheets export, auth verification, cloud sync/backup, account deletion backend, feedback submission, production translation/glossary, AI chatbot, document translation, pronunciation scoring, unsupported language/source gates, and production etymology/conjugation.

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

Selected first path: static Expo web export on Vercel.

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
- `/folder/:id` is rewritten to the exported dynamic route shell.
- `/auth/callback` is rewritten to the exported callback shell, but auth remains parked for this local-first release.

Notes:

- The current app is local-first and should not require production secrets for web deploy.
- If Supabase/auth/cloud features are enabled later, add the hosted web URL to the provider redirect allowlist before release.
- Keep blocked feature copy visible and disabled; do not expose backend/OAuth/AI CTAs as production actions.

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
- Confirm App Privacy/Data Safety answers match the local-first release: local storage, local export/reset, no production auth/cloud/AI/OAuth in this release.
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
