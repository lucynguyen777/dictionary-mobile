# Google Sheets Export MVP

## Goal

Define the Google Sheets export contract before implementing OAuth or Sheets API calls. This module keeps Google tokens backend-mediated, reuses existing local folder export semantics, and keeps CSV/XLS/Anki export as the offline fallback.

## Dependencies

- Supabase Auth Foundation: `docs/supabase-auth-foundation.md`.
- Supabase backend/cloud foundation: `docs/supabase-cloud-sync-mvp.md`.
- Backend proxy policy: `docs/deepl-openai-backend-proxy-mvp.md`.
- Decision: `.docs/decisions/google-sheets-export.md`.

## Provider Direction

- Use backend-mediated Google OAuth.
- Mobile/web client never stores long-lived Google refresh tokens.
- Backend stores encrypted Google refresh tokens or token references scoped to the Supabase user id.
- Default OAuth scope should be least privilege:
  - `https://www.googleapis.com/auth/drive.file` for files the app creates or opens;
  - `https://www.googleapis.com/auth/spreadsheets` only if implementation proves `drive.file` is insufficient for the planned create/write flow.
- Keep local CSV/XLS/Anki export available without Google login.

## Backend Environment And Secret Policy

Required backend-only env vars:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_SHEETS_EXPORT_SCOPES`

Optional env vars:

- `GOOGLE_SHEETS_EXPORT_MAX_ROWS`
- `GOOGLE_SHEETS_EXPORT_MAX_RETRIES`
- `GOOGLE_SHEETS_EXPORT_RATE_LIMIT_PER_USER`
- `GOOGLE_SHEETS_EXPORT_TOKEN_ENCRYPTION_KEY_ID`

Rules:

- Do not commit Google OAuth client secrets or token encryption keys.
- Do not return refresh tokens to the client.
- Log only metadata: user id, folder id, row count, spreadsheet id hash, status, error code, and timestamps.
- Redact words, notes, definitions, tags, access tokens, refresh tokens, and spreadsheet URLs in backend logs by default.

## OAuth Route Contract

All routes require a Supabase-authenticated user unless the route is the Google OAuth callback validating a backend-issued state token.

| Route | Purpose |
| --- | --- |
| `GET /proxy/google-sheets/connect` | Create Google consent URL with backend state, requested scopes, `access_type=offline`, and optional `prompt=consent` when refresh-token rotation is required. |
| `GET /proxy/google-sheets/callback` | Validate OAuth state, exchange auth code for tokens, encrypt/store refresh token, and redirect back to app/web status route. |
| `GET /proxy/google-sheets/status` | Return connection state, granted scopes, masked Google account label if available, and last export metadata. |
| `POST /proxy/google-sheets/export-folder` | Create or update a spreadsheet from a folder export payload. |
| `POST /proxy/google-sheets/revoke` | Revoke provider token when possible, delete stored token metadata, and mark export connection disconnected. |

OAuth state must bind:

- Supabase user id;
- nonce;
- requested scopes;
- redirect target;
- created timestamp and expiration.

## Token Storage And Revocation

- Store Google token metadata in Supabase/backend storage, never in app local SQLite.
- Store refresh tokens encrypted at rest or via a managed secret store.
- Store access tokens only in memory or short-lived encrypted cache.
- On revoke:
  - call Google's revocation endpoint when a token exists;
  - delete encrypted refresh token/token reference;
  - keep minimal audit metadata without token values;
  - keep local CSV/XLS/Anki export unaffected.
- Account deletion must revoke/delete Google token metadata and export history rows owned by the user.

## Export Row Contract

Reuse the existing folder export columns from `data/libraryStore.ts`:

| Column | Source |
| --- | --- |
| `word` | `SavedWord.word` |
| `ipa` | `SavedWord.ipa` |
| `definition` | `SavedWord.definition` |
| `note` | `SavedWord.note` |
| `folder` | `Folder.name` |
| `tags` | `SavedWord.tags.join('|')` |
| `createdAt` | `SavedWord.createdAt` |

Additional Google Sheets metadata can be written to a `Metadata` sheet:

- app name;
- export version;
- folder id;
- folder name;
- exported at;
- exported by Supabase user id;
- row count;
- source: `dictionary-mobile`;
- warning if export is partial.

## Spreadsheet And Sheet Naming

- Spreadsheet title: `Dictionary Mobile - {folderName} - {YYYY-MM-DD}`.
- Main worksheet title: sanitized folder name, max 100 characters.
- Metadata worksheet title: `Export metadata`.
- If duplicate spreadsheet handling is set to create-new, always create a new spreadsheet.
- If duplicate handling is set to update-existing, require a stored `spreadsheetId` owned by the current user and update by `values.batchUpdate`.
- MVP default: create a new spreadsheet per export to avoid unexpected overwrite.

## Write Strategy

- Use Sheets `spreadsheets.values.batchUpdate` for header + rows in one request where possible.
- Use `RAW` value input option so definitions, IPA, and dates are not reformatted unexpectedly.
- For large folders, chunk rows by backend config and report partial completion.
- Do not write formulas.
- Do not write external links except optional spreadsheet metadata links generated by Google.

## Failure States

Return user-safe error codes:

- `google_not_connected`;
- `oauth_state_expired`;
- `oauth_scope_missing`;
- `token_refresh_failed`;
- `token_revoked`;
- `folder_not_found`;
- `empty_folder`;
- `row_limit_exceeded`;
- `quota_exceeded`;
- `provider_rate_limited`;
- `provider_timeout`;
- `partial_export`;
- `provider_error`;
- `unsupported_platform`.

Partial export must include:

- spreadsheet id if created;
- rows attempted;
- rows written;
- failed chunk index;
- retry-safe export id.

## Privacy, Cost, And Quota Rules

- Exported spreadsheet data is user-selected vocabulary data and may include notes/definitions. Show confirmation before sending to Google.
- Google Sheets export should not run automatically in the background without user action.
- Backend should rate-limit exports per Supabase user id and include `quotaUser` or equivalent request attribution when supported by the Google client.
- Use exponential backoff for 429 and retryable 5xx responses.
- If quota is exceeded, keep local export options visible and suggest CSV/XLS fallback.
- Export history can store spreadsheet id hash, provider file id, row count, status, and timestamp; do not store full exported row payload by default.

## Unsupported Platform Behavior

- Native and web clients should use the same backend connect/export routes.
- If OAuth redirect handling is unavailable on a platform, show a status panel with local CSV/XLS/Anki fallback.
- Export button should remain disabled until Supabase auth and Google connection are available.
- Manual CSV upload is the fallback path for users who do not connect Google.

## Minimal Data Tables

Recommended Supabase/backend tables:

- `google_export_connections`: user id, provider account label, granted scopes, encrypted token reference, connected at, revoked at, last error.
- `google_export_jobs`: user id, folder id, export version, spreadsheet id hash, row count, status, retry count, created at, completed at, error code.
- `google_export_spreadsheets`: user id, folder id, spreadsheet id encrypted or tokenized reference, title, created at, last exported at, deleted/disconnected flag.

Every table must enable RLS and scope rows with `auth.uid() = user_id` when exposed through Supabase.

## Implementation Gate

Google Sheets export code can start when the next module agrees to:

- implement backend OAuth routes and callback state validation;
- add encrypted token storage/revocation;
- add folder-to-sheet row mapper with tests matching current CSV export columns;
- add fake Google client tests for create, batch update, rate limit, token refresh failure, revoke, and partial export;
- keep local CSV/XLS/Anki export unchanged and available when Google export is unavailable.

## Test Expectations

- Unit tests for folder row mapping and sheet name sanitizer.
- Unit tests for OAuth state creation/validation and expired-state rejection.
- Fake-provider tests for spreadsheet creation, `values.batchUpdate`, retryable 429, provider 5xx, token refresh failure, and revoke.
- UI smoke for unconnected, connected, exporting, success, partial export, quota exceeded, and fallback states.
- Regression check that existing CSV/XLS/Anki export behavior is unchanged.

## Source Notes

- Google OAuth web-server flow returns a refresh token only when the initial authorization requests offline access.
- Google Sheets values API supports `values.batchUpdate` for writing multiple ranges and lists `drive.file` and `spreadsheets` among allowed scopes.
- Google Sheets values guide recommends batch updates for efficiency.
- Google Sheets usage limits can return HTTP 429 when per-minute quotas are exceeded; backoff and batching are required.
