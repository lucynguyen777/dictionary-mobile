# Architecture Summary

## Platform
- Expo React Native app.
- Expo Router entry: `expo-router/entry`.
- Supports native mobile and Expo web.
- Main routes live in `app/`.

## Key Routes
- `app/(tabs)/index.tsx`: home/lookup entry.
- `app/(tabs)/word.tsx`: dictionary lookup experience.
- `app/(tabs)/library.tsx`: folders, saved words, exports, flashcards.
- `app/(tabs)/advanced.tsx`: advanced tools such as import/export/training shells.
- `app/(tabs)/profile.tsx`: local profile, privacy, support/settings areas.
- `app/reader.tsx`: local reader.
- `app/folder/[id].tsx`: folder detail.

## Shared UI
- App layout helpers: `components/app/Screen.tsx`, `components/app/SectionTitle.tsx`.
- UI primitives: `components/ui/*`.
- Word UI: `components/word/*`.
- Theme tokens: `constants/theme.ts`.

## Data Layer
- Local-first stores live in `data/`.
- Storage adapter split:
  - `data/storageAdapter.ts`
  - `data/storageAdapter.web.ts`
- Important storage keys:
  - `dictionary-mobile.profile.v1`
  - `dictionary-mobile.library.v1`
  - `dictionary-mobile.reader.v1`

## Dictionary Architecture
- Language metadata: `data/languages.ts`.
- Adapter registry: `data/adapterRegistry.ts`.
- API/source helpers: `data/dictionaryApi.ts`.
- Local/fallback lexical data: `data/dictionary.ts`, `data/localLexicon.ts`, `data/phrasebook.ts`.
- Morphology helpers: `data/morphology.ts`.

## Import Export Architecture
- CSV/TSV parser and mapping: `data/csvImport.ts`.
- Full local backup export: `data/exportAllData.ts`.
- Reader import helpers: `data/readerImport.ts`.
- Folder export/share logic is in `data/libraryStore.ts`.

## Tests
- `tests/adapterRegistry.test.ts`
- `tests/dictionaryApi.test.ts`
- `tests/readerImport.test.ts`

## Backend-Sensitive Areas
These require accepted decision docs before production implementation:
- Auth
- Backend architecture
- Cloud sync
- Google Sheets export
- AI chatbot
- Speech scoring
- Production translation
- Offline dictionary bundles
