# Decision: Cloud Sync

## Status
Proposed

## Context
The app stores dictionary, library, profile, reader, and flashcard data locally. A cloud sync decision is needed before syncing data across devices or offering encrypted backup.

## Options
1. Supabase sync tables
2. Firebase Firestore sync
3. Custom sync API
4. Encrypted backup export only

## Decision
Chosen option.

## Consequences
Cost, security, implementation complexity, conflict resolution, offline behavior, data encryption, privacy expectations, and account dependency.

## Tasks Unblocked
- Multi-device sync
- Encrypted backup
- Restore from cloud
- Cross-device flashcard progress
- Cloud profile persistence
