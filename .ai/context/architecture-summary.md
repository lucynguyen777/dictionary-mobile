# Architecture Summary

## Platform
Expo React Native app with mobile and Expo web support.

## Product Architecture
The app is local-first. Most user data is stored locally unless a future backend/cloud sync decision is made.

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
Do not assume backend, auth, cloud sync, or server persistence exists.

## Backend-sensitive Areas
These require product decisions before implementation:
- Auth
- Cloud sync
- Google Sheets export
- AI chatbot
- Speech scoring
- Production translation
- Offline dictionary bundle