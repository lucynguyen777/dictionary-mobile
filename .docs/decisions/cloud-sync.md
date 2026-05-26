# Decision: Cloud Sync

## Status
Accepted

## Context
The app stores dictionary, library, profile, reader, and flashcard data locally. A cloud sync decision is needed before syncing data across devices or offering encrypted backup.

## Options
1. Supabase sync tables
2. Firebase Firestore sync
3. Custom sync API
4. Encrypted backup export only

## Decision
Choose **Supabase sync tables**.

Use Supabase tables for future cross-device sync of local-first user data. The initial sync contract should use existing local SQLite entity ids, versions, timestamps, and tombstones. Encrypted backup and restore UX remain staged follow-up work inside the Supabase cloud sync roadmap.

## Consequences
- Supabase Auth Foundation is a dependency before implementation.
- Conflict resolution must be defined per profile, library, flashcard, reader, and tombstone domain before sync writes are enabled.
- Local export/reset behavior must remain compatible with unsynced and synced data.
- Encrypted backup policy must be documented before claiming encrypted cloud backup support.

## Tasks Unblocked
- Multi-device sync
- Encrypted backup
- Restore from cloud
- Cross-device flashcard progress
- Cloud profile persistence
