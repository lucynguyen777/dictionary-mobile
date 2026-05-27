# Decision: Support Feedback Channel

## Status
Accepted

## Context

Feedback submission is currently blocked because the app needs a real destination, retention policy, spam controls, and backend mediation before user messages leave the device.

## Options

1. Supabase feedback table plus email notification.
2. Resend transactional email only through backend.
3. Zendesk/Help Scout style helpdesk integration.

## Decision

Use **Supabase feedback tables plus Resend email notification** as the first support/feedback channel.

The Supabase table is the source of truth for support records. Resend is used only by backend code to notify the support inbox; no Resend key may be bundled in Expo/mobile/web client code.

## Consequences

- Feedback implementation can move into a staged backend module after Supabase auth/backend scaffolding exists.
- Feedback rows must be RLS-scoped by `user_id` when the user is authenticated and must support unauthenticated/local-first submissions only if abuse controls are defined.
- Backend must rate-limit submissions, redact provider keys, and avoid logging raw message bodies by default.
- UI must show sent, queued, failed, and retry states instead of pretending feedback was delivered.
- Zendesk/Help Scout remains a later helpdesk upgrade if support volume justifies it.

## Tasks Unblocked

- Feedback table schema and RLS policy planning.
- Backend Resend notification route planning.
- Support/feedback UI implementation planning.
- Fake email-client tests.
