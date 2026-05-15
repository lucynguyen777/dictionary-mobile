# Decision: Backend Architecture

## Status
Proposed

## Context
The app is currently local-first. A backend architecture decision is needed before adding server-side accounts, sync, feedback submission, AI features, shared data, or production APIs.

## Options
1. Supabase backend
2. Firebase backend
3. Custom Node/API backend
4. Serverless functions

## Decision
Chosen option.

## Consequences
Cost, security, implementation complexity, deployment workflow, observability, data privacy, scaling model, and long-term maintenance.

## Tasks Unblocked
- Cloud sync
- Feedback submission
- Account deletion backend
- AI chat server proxy
- Translation API proxy
- Shared user data storage
