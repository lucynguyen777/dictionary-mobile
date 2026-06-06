# Provider Feature Gates Status

This is the v1.3.9 provider-gate execution status after v1.3.8 shipped. It records which provider-backed features remain blocked by missing production credentials, OAuth setup, or backend implementation work.

## Current Result

Status: **BLOCKED - missing provider/OAuth/backend setup**.

Supabase is connected and its public Expo configuration is available in local ignored env and Vercel Production/Development. Provider-backed features remain blocked by their own provider credentials, OAuth/backend routes, quotas, and production smoke.

The local environment checked on 2026-06-05 does not expose the provider variables needed for live production smoke:

| Gate | Required setup | Current status |
| --- | --- | --- |
| DeepL translation proxy | `DEEPL_API_BASE_URL`, `DEEPL_API_KEY`, authenticated Supabase session | Missing provider/auth env |
| OpenAI AI Tutor proxy | `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL`, authenticated Supabase session | Missing provider/auth env |
| Google Sheets export | Google OAuth client id/secret, backend OAuth routes, encrypted token storage | Not implemented/configured |
| Feedback submission | Supabase `feedback` table/RLS, Resend sender/domain/API key, spam/retention policy | Not implemented/configured |
| Account deletion backend | Authenticated backend route, remote deletion contract, failure recovery tests | Not implemented/configured |
| Azure pronunciation scoring | Azure Speech key/region, backend audio upload/proxy, quota/privacy/retention policy | Not implemented/configured |

## What Was Verified Locally

- Existing backend proxy config rejects missing provider keys and redacts provider env names in user-facing config output.
- Existing backend request validation enforces text/message size limits and rejects raw voice audio for the current MVP.
- Existing quota tracker and proxy tests cover fake-provider quota and unauthorized behavior without real provider calls.
- UI policy still treats provider-backed actions as gated unless auth/env/backend prerequisites exist.

## Required User Setup Before Live v1.3.9 Smoke

1. Configure Supabase Auth smoke prerequisites from `docs/supabase-auth-sync-production-smoke-status.md`.
2. Configure Vercel server-only env vars:

```bash
DEEPL_API_BASE_URL=https://api-free.deepl.com
DEEPL_API_KEY=YOUR_SERVER_ONLY_DEEPL_KEY
OPENAI_API_KEY=YOUR_SERVER_ONLY_OPENAI_KEY
OPENAI_TEXT_MODEL=YOUR_SELECTED_TEXT_MODEL
```

3. For Google Sheets, create a Google Cloud OAuth app, approved redirect URLs, server-side token storage plan, and fake Google client tests before enabling UI.
4. For feedback, create the Supabase `feedback` table/RLS policy, configure a Resend verified sender/domain, and define spam/retention behavior.
5. For account deletion, define the backend admin route and remote/local failure recovery behavior; never delete local data before remote deletion status is known.
6. For pronunciation scoring, configure Azure Speech credentials server-side only and define raw-audio retention, quota, privacy copy, and fake-provider tests.

## Decision

Do not mark v1.3.9 complete yet. Keep provider-backed features staged/env-gated until real provider credentials, OAuth/backend routes, RLS, quota/privacy smoke, and failure-state tests exist.
