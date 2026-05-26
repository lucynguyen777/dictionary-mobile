# Decision: Backend Architecture

## Status
Accepted

## Context
The app is currently local-first. A backend architecture decision is needed before adding server-side accounts, sync, feedback submission, AI features, shared data, or production APIs.

## Options
1. Supabase backend
2. Firebase backend
3. Custom Node/API backend
4. Serverless functions

## Decision
Choose **Supabase backend**.

Use Supabase as the backend architecture for account-linked data, sync tables, backend-mediated Google export, AI/translation proxy boundaries, and account deletion support. Implementation remains staged: Supabase Auth Foundation comes first, then cloud sync and proxy modules.

## Consequences
- Backend and auth share one provider boundary.
- Server-side policies, environment variables, observability, privacy copy, and quota/cost controls must be documented before proxy features are implemented.
- Local-first SQLite remains the source of truth until a sync module explicitly moves data into Supabase.

## Tasks Unblocked
- Cloud sync
- Feedback submission
- Account deletion backend
- AI chat server proxy
- Translation API proxy
- Shared user data storage
