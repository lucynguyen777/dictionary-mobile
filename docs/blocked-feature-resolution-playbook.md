# Blocked Feature Resolution Playbook

Updated: 2026-06-06

This playbook audits unfinished features against the current codebase and separates code work from external setup. Supabase is already connected; remaining Supabase work is production smoke, RLS verification, and multi-session validation.

## Status Summary

| Blocker group | Current state | Actual blocker | Recommended path |
| --- | --- | --- | --- |
| Supabase Auth + Cloud Sync | Implemented/manual beta | Redirect allow-list, applied migrations/RLS probes, two-session smoke | Finish production smoke first |
| DeepL + OpenAI | Backend routes and tests exist | Provider keys/models and authenticated quota/privacy smoke | Configure server-only Vercel env, then smoke |
| Google Sheets | Decision/route contract only | Google OAuth app, backend routes, encrypted refresh-token storage | Implement backend-mediated OAuth after user creates OAuth client |
| Feedback + Account Deletion | Accepted/staged | Feedback schema/Resend setup and privileged deletion backend | Implement feedback first; deletion second |
| Native OCR/STT + Chandra | Providers/contracts exist | Dev-client build and deployed Chandra service | Dev-client spike plus separately hosted Chandra service |
| Pronunciation Assessment | Recording exists; Azure accepted | Azure resource, backend audio route, privacy/quota/retention | Build fake-provider route first, then Azure smoke |
| Languages + Offline Packs | Architecture/preview adapters exist | Corpus/source/license/attribution and pack candidate | Expand one measured language corpus before packaging |
| Specialized Translation | Local matcher/schema/proxy validation exist | Dataset persistence UI/runtime and provider-backed execution | Complete local/Supabase dataset workflow before embeddings |
| Etymology + Conjugation | Source decisions and attribution slice exist | Production rows and ShareAlike packaging review | Start with live attributed rows; defer bulk packs |

## 1. Supabase Auth And Cloud Sync

Current evidence:

- `@supabase/supabase-js`, SecureStore/web storage, auth callback, session lifecycle, sync runner, migrations, and RLS policy tests exist.
- Supabase project health responds successfully.
- Local ignored Expo env and Vercel Production/Development env are configured.
- Remaining blocker is production verification, not initial connection.

### Options

1. **Recommended: verify the existing Supabase project**
   - User setup: configure redirect URLs, confirm email auth, create two disposable users, and confirm migrations are applied.
   - Codex work: run RLS probes, auth callback smoke, and two-browser manual sync; fix failures.
   - Best balance because it validates the implementation already present.
2. **Create a separate staging Supabase project**
   - User setup: create a staging project and provide only its public URL/publishable key through local/Vercel staging env.
   - Codex work: apply migrations, run destructive/RLS/two-user probes safely, then document promotion steps.
   - Safer for production data, but adds environment management.
3. **Keep auth enabled and cloud sync beta-only**
   - Codex work: keep sync opt-in/manual, improve blocked-state copy, and postpone live multi-device claims.
   - Lowest setup effort, but Cloud Sync remains below production readiness.

### User Setup

1. Open Supabase Dashboard -> Authentication -> URL Configuration.
2. Set the production Site URL to `https://dictionaire-mobile.vercel.app`.
3. Add redirect URLs:
   - `https://dictionaire-mobile.vercel.app/auth/callback`
   - `dictionairemobile://auth/callback`
   - local web callback used for smoke, such as `http://localhost:8081/auth/callback`
4. Confirm email/password auth is enabled.
5. Create two disposable users for cross-user RLS testing.
6. Confirm migrations `001`, `002`, and `006` are applied.
7. Never place a service-role key in Expo or public Vercel variables.

Official guidance:

- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/
- https://supabase.com/docs/guides/security/product-security

## 2. DeepL And OpenAI Provider Features

Current evidence:

- Vercel backend proxy routes, auth verification, request limits, quota tracker, safe validation, and fake-provider tests exist.
- Production `/backend-proxy/health` returns `configured:false` because provider env is absent.

### Options

1. **Recommended: configure app-owned DeepL/OpenAI server keys**
   - User setup: create provider projects/keys and set spend limits.
   - Codex work: add Vercel server-only env, run authenticated smoke, verify quotas/privacy/failure copy.
   - Fastest path to production AI Tutor and translation.
2. **User-provided provider connections**
   - Codex work: finish encrypted provider-connection persistence and BYOK UX using existing secret-envelope foundation.
   - Reduces app-owned cost, but increases key-management/privacy complexity.
3. **Keep provider features staged**
   - Codex work: retain local-first features and clear unavailable states.
   - No provider cost, but AI/translation remains unavailable.

### User Setup

Create provider keys and add these only to Vercel Production/Development server env:

- `DEEPL_API_BASE_URL`
- `DEEPL_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_TEXT_MODEL`

Do not use `EXPO_PUBLIC_` prefixes for provider secrets.

Official guidance:

- https://developers.deepl.com/docs
- https://platform.openai.com/docs/guides/production-best-practices

## 3. Google Sheets Export

Current evidence:

- OAuth/export contract is documented, but backend routes and token storage are not implemented.

### Options

1. **Recommended: backend-mediated Google OAuth**
   - User setup: create Google Cloud OAuth client and consent screen.
   - Codex work: implement connect/callback/status/export/revoke routes, encrypted refresh-token storage, row mapping, and fake client tests.
   - Correct production architecture.
2. **Export an XLS/CSV file for users to import into Sheets**
   - Already mostly supported; Codex can polish copy and a Sheets-specific CSV preset.
   - No OAuth setup, but not one-click export.
3. **Google Apps Script webhook**
   - User setup: deploy and own an Apps Script endpoint.
   - Codex work: post rows through a restricted backend route.
   - Simpler prototype, but weaker multi-user authorization and lifecycle controls.

### User Setup For Option 1

1. Create/select a Google Cloud project.
2. Enable Google Sheets API and, if needed, Drive API.
3. Configure OAuth consent screen.
4. Create a Web application OAuth client.
5. Add redirect URI:
   - `https://dictionaire-mobile.vercel.app/backend-proxy/oauth/google/callback`
6. Provide client id/secret through Vercel server-only env, never Expo public env.

Official guidance:

- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/sheets/api/guides/values

## 4. Feedback Submission And Account Deletion

### Options

1. **Recommended: Supabase feedback table + Resend notification; separate deletion route**
   - User setup: choose support inbox, verify a Resend domain, create API key.
   - Codex work: add feedback migration/RLS/rate limits, notification route, account deletion route, recovery tests, and no-local-data-loss behavior.
2. **Feedback table only, no email notification**
   - Codex can implement without Resend after schema is applied.
   - Easier MVP; support staff must review Supabase directly.
3. **External support form and manual deletion requests**
   - User setup: select external support/form provider and operational process.
   - Codex work: link UI and document privacy/response expectations.
   - Quickest operational fallback, but fragmented UX.

### User Setup For Recommended Option

1. Choose a support inbox and retention period.
2. Create a Resend account, verify a sending domain/subdomain, and create an API key.
3. Add `RESEND_API_KEY`, sender, and support destination as server-only Vercel env.
4. Decide whether account deletion is immediate or has a short recovery window.

Official guidance:

- https://resend.com/docs/dashboard/domains/introduction
- https://resend.com/docs/api-reference/emails
- https://supabase.com/docs/guides/auth/managing-user-data

## 5. Native OCR, STT, And Chandra

Current evidence:

- MLKit and speech-recognition packages are installed.
- OCR provider registry and fallback contracts exist.
- `expo-dev-client` is not installed.
- Chandra service exists but is not deployed/configured.

### Options

1. **Recommended: Expo development build for MLKit/STT; host Chandra separately**
   - Codex work: install/configure `expo-dev-client`, native plugins, build profiles, and engine wiring.
   - User setup: run/install development builds on iOS/Android and provide a Chandra-capable host/GPU environment.
2. **Chandra scanned-PDF only; keep camera OCR/STT staged**
   - Codex work: deploy/wire Chandra endpoint and smoke Reader scanned PDFs.
   - Avoids native device setup, but camera/voice lookup stays unavailable.
3. **MLKit/STT native only; defer Chandra**
   - Codex work: finish mobile lookup recognition.
   - Improves mobile lookup first, but scanned books/PDFs remain blocked.

### User Setup

1. Install a development build on at least one iOS or Android device.
2. Grant camera/microphone permissions only when invoking those features.
3. For Chandra, select a Docker/GPU-capable host and configure `EXPO_PUBLIC_CHANDRA_OCR_URL` only after HTTPS/size/privacy controls pass.

Official guidance:

- https://docs.expo.dev/develop/development-builds/introduction/
- https://docs.expo.dev/develop/development-builds/expo-go-to-dev-build
- https://github.com/datalab-to/chandra

## 6. Azure Pronunciation Assessment

### Options

1. **Recommended: Azure backend proxy with no-retention default**
   - User setup: create Azure Speech resource, choose region, accept audio processing/privacy policy.
   - Codex work: implement upload validation, fake Azure client, quota, result mapping, history, and unavailable states.
2. **Speechace provider**
   - User setup: accept vendor pricing/terms.
   - Codex work: adapt the same provider interface.
   - Specialist alternative, but adds a new vendor.
3. **Keep playback and static guidance only**
   - Codex work: improve recording comparison UX without scores.
   - No cloud audio processing; does not satisfy phoneme scoring.

Official guidance:

- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment

## 7. Language Parity And Offline Packs

### Options

1. **Recommended: promote one language at a time from measured corpus**
   - Start with Spanish or French.
   - Codex work: run representative source smoke, build attributed corpus, expand adapter/tests, then build a pack.
   - Most reliable path to honest production parity.
2. **Expand production-pair coverage first**
   - Focus on `fr->vi`, `en->vi`, and `vi->en`.
   - Better immediate bilingual value, but monolingual preview languages remain preview.
3. **Prioritize source-gated languages**
   - User setup: obtain permission/licensed source for Cantonese/Uyghur/VI->FR/etc.
   - High product differentiation, but highest legal/source risk.

Do not create a new hosted pack until source URL, license, source date, entry count, attribution, checksum, import/delete smoke, and offline lookup smoke exist.

## 8. Specialized Translation And Glossary Agents

### Options

1. **Recommended: complete non-vector dataset workflow first**
   - Codex work: persist datasets/glossaries/agents through existing Supabase schema, add CRUD/import UI, and use deterministic longest-match retrieval.
   - Lower complexity and already matches current foundation.
2. **Add embeddings/vector retrieval**
   - User setup: select embedding provider/cost policy.
   - Codex work: add vector schema, indexing, retrieval tests, quotas, and privacy copy.
   - More capable, but cost/privacy complexity rises.
3. **Local-only glossary workflow**
   - Codex work: persist locally and send bounded context only when provider features are enabled.
   - Preserves local-first behavior, but lacks cross-device collaboration.

## 9. Etymology And Conjugation

### Options

1. **Recommended: live attributed source rows first**
   - Codex work: add real Wiktionary/UniMorph-backed rows with source labels and missing-state tests.
2. **Build separate ShareAlike offline data packs**
   - Requires source/package review before distribution.
3. **Keep current fallback/attribution slice**
   - Lowest risk, but coverage remains limited.

## Recommended Execution Order

1. Supabase redirect/RLS/two-session smoke.
2. DeepL/OpenAI server env and authenticated smoke.
3. Feedback table-only MVP, then Resend notification.
4. Expo dev-client MLKit/STT spike.
5. Chandra deployment and scanned-PDF smoke.
6. Google Sheets OAuth.
7. Azure pronunciation scoring.
8. One-language corpus expansion, then offline pack.
9. Specialized translation persistence and lexical data expansion.

## What Codex Can Start Without More User Setup

- Implement feedback table-only migration/route/tests.
- Implement Google Sheets fake client, row mapper, and route contracts without live OAuth.
- Install/configure `expo-dev-client` and prepare native OCR/STT wiring/tests.
- Implement Azure fake-provider contract and backend validation without credentials.
- Complete specialized translation dataset CRUD/local workflow.
- Run source/corpus smoke and adapter work for legally accepted sources.
- Implement live-source etymology/conjugation tests with attribution gates.

## What Requires User Setup

- Supabase redirect allow-list, disposable users, and two real sessions/devices.
- Provider accounts/credentials and spend limits.
- Google OAuth consent/client.
- Resend domain/support inbox.
- Azure Speech resource and audio privacy decision.
- A Chandra-capable deployment host.
- Permission/licensing for source-gated languages.
