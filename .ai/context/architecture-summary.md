# Architecture Summary

## Platform
Expo React Native app with mobile and Expo web support.

## Product Architecture
The app is local-first by default. User data is stored locally first, with Supabase Auth and manual beta Cloud Sync available only when production env vars, RLS, and smoke checks are configured.

## Main Feature Areas
1. Dictionary Lookup
2. Library / Saved Words
3. Folder Management
4. Flashcards
5. Import Dataset
6. Reader
7. Profile Settings
8. Privacy & Security
9. Language Adapters
10. Advanced AI / Translation / Speech features

## Dictionary Architecture
Dictionary support should use language adapters.

Each language or language pair should declare:
- language code
- family
- script
- writing direction
- adapter key
- dictionary status
- source strategy
- morphology strategy
- romanization/transliteration if needed

## Local-first Principle
Do not make local features depend on backend availability. Backend/Auth/Cloud Sync may be configured in v1.2.1, but every core lookup, library, reader, flashcard, import/export, profile, and reset flow must keep working when Supabase or the backend proxy is unconfigured.

## Backend-sensitive Areas
These require production env, smoke verification, and rollback gates before being treated as fully live:
- Supabase Auth
- Manual beta Cloud Sync
- Vercel backend proxy
- AI Tutor
- DeepL translation

These remain blocked or later-version:
- Google Sheets export
- Speech scoring
- Offline dictionary bundle
