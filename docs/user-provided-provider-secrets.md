# User-Provided Provider Secrets

## Goal

Dictionary Mobile provides the learning environment, dataset editor, retrieval context, and agent setup. Users can bring their own provider API keys for specialized translation agents when product policy allows it. The app must not expose user API keys to the Expo bundle, logs, screenshots, exports, or other users.

MVP behavior is provider setup plus encrypted storage contract. It does not fine-tune models, sell provider access, or call providers directly from the client.

## Accepted Direction

- User-owned API keys are optional credentials for dataset-grounded agents.
- Secrets are submitted to the backend over authenticated HTTPS only.
- Secrets are encrypted server-side before persistence.
- Mobile/web clients receive only provider connection metadata, never plaintext keys.
- Provider calls execute through backend routes so quota, deletion, logging, and error handling stay centralized.

## Encryption Contract

Backend env:

- `USER_PROVIDER_SECRET_ENCRYPTION_KEY`: required 32-byte base64url key for AES-GCM encryption.
- `USER_PROVIDER_SECRET_KEY_VERSION`: optional key version label, default `v1`.

Runtime rules:

- Encrypt with AES-256-GCM and a unique 12-byte nonce per secret.
- Bind encryption to authenticated `userId`, provider, purpose, and key version as additional authenticated data.
- Store only the encrypted envelope: algorithm, nonce, ciphertext, key version, provider, purpose, status, timestamps, and soft-delete fields.
- Never log plaintext keys, encrypted ciphertext payloads with user content, provider responses that echo keys, or request authorization headers.
- Key rotation must support decrypting old key versions before any production launch.

## Planned Tables

- `user_provider_connections`: user id, provider, purpose, display label, status, key version, created/updated/revoked timestamps.
- `user_provider_secret_envelopes`: user id, connection id, algorithm, nonce, ciphertext, key version, created/rotated/revoked timestamps.
- `user_provider_usage_events`: user id, connection id, feature, provider, metadata-only usage counts, status, error code, created at.

Every table must enable RLS and scope rows with `auth.uid() = user_id`.

## Dataset Agent Boundary

For specialized translation dataset agents:

- The app sets up datasets, editor modes, retrieval, prompts, and agent context.
- Users choose whether to attach their own OpenAI-compatible or supported provider key.
- Default limit remains `maxAgentsPerUser = 3`.
- Dataset context is retrieval/context injection, not model fine-tuning.
- Raw datasets and prompts are redacted from logs by default.

## Acceptance Gate

Production use can start only after:

- Supabase tables and RLS policies are added for provider connections and encrypted envelopes.
- Backend routes validate provider type, key format, ownership, and revocation state.
- No-key-leak tests prove plaintext keys never appear in responses, logs, exported data, or client state.
- Key rotation, account deletion, and provider revocation behavior are documented and tested.
- Quota and cost controls are enforced before provider calls.
