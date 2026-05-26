# Decision: Google Sheets Export

## Status
Accepted

## Context
The app already supports local CSV, XLS-compatible, and Anki exports. Real Google Sheets export needs an OAuth flow, token policy, revocation behavior, retry/error states, and backend mediation before it can be implemented safely.

## Options
1. Backend-mediated Google OAuth
2. Direct mobile Google OAuth
3. Manual CSV upload only
4. Local-only export status quo

## Decision
Choose **backend-mediated Google OAuth**.

Use the Supabase/backend boundary to mediate Google OAuth, protect tokens, apply scopes, and execute spreadsheet creation/update requests. Keep manual CSV/XLS/Anki export available as the fallback path.

## Consequences
- Supabase Auth Foundation and backend proxy policy are dependencies before implementation.
- Token storage, revocation, spreadsheet scopes, rate limits, retry behavior, partial export states, and unsupported-platform copy must be documented before code work.
- The mobile app should send the existing folder/export payload to the backend and should not need to persist long-lived Google tokens locally.

## Tasks Unblocked
- Google Sheets export planning
- Spreadsheet row/export contract
- Backend-mediated OAuth implementation after auth/backend foundation
- Export failure/retry UI
