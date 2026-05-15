# Decision: Auth Provider

## Status
Proposed

## Context
The app needs an auth provider before implementing real email login, account identity, password changes, session handling, and account deletion.

## Options
1. Supabase
2. Firebase
3. Clerk
4. Custom backend

## Decision
Chosen option.

## Consequences
Cost, security, implementation complexity, account recovery support, data ownership, vendor lock-in, and Expo React Native integration effort.

## Tasks Unblocked
- Email login
- Password reset
- Phone/email verification
- Account deletion
- Cloud sync identity
