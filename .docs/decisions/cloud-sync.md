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

Foundation document: `docs/supabase-cloud-sync-mvp.md`.

## Consequences
- Supabase Auth Foundation is a dependency before implementation.
- Conflict resolution is defined in `docs/supabase-cloud-sync-mvp.md` for profile, folders, saved words, memberships, search history, flashcards, reader documents/settings, and tombstones.
- Every sync table must be owned by `user_id`, protected with Row Level Security, and scoped to the authenticated user via `auth.uid() = user_id`.
- Local export/reset behavior must remain compatible with unsynced and synced data.
- Encrypted backup policy and restore UX are explicitly staged after the minimal sync MVP; do not claim encrypted cloud backup support until a later module defines encryption key ownership and recovery behavior.

## Tasks Unblocked
- Multi-device sync
- Encrypted backup
- Restore from cloud
- Cross-device flashcard progress
- Cloud profile persistence
