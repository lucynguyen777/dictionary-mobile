# Data Model Summary

## User Profile
Source: `data/profileStore.ts`

Storage key: `dictionary-mobile.profile.v1`

Fields:
- `displayName`
- `email`
- `username`
- `phone`
- `avatarUrl`
- `loginMethod`: `local`, `email`, `apple`, `google`
- `nativeLanguage`
- `learningLanguage`
- `proficiencyLevel`: `A1` through `C2`
- `learningGoal`
- `timezone`
- `dailyGoal`
- `appLockEnabled`
- `updatedAt`

## Library State
Source: `data/libraryStore.ts`

Storage key: `dictionary-mobile.library.v1`

Contains:
- `folders`
- `savedWords`
- `searchHistory`
- `flashcards`
- `deletedFolderIds`

## Folder
Fields:
- `id`
- `name`
- `color`
- `colorNote`
- `isFavorite`
- `createdAt`
- `updatedAt`

Special folder:
- `favorites`

Rule:
Duplicating a folder copies folder metadata and word membership without duplicating saved word records unnecessarily.

## Saved Word
Fields:
- `id`
- `word`
- `ipa`
- `definition`
- `audio`
- `folderIds`
- `note`
- `tags`
- `source`
- `createdAt`
- `updatedAt`

## Flashcard
Fields:
- `id`
- `wordId`
- `type`: `bilingual`, `word-definition`, `definition-word`, `word-pronunciation`
- `front`
- `back`
- `createdAt`
- `reviewState`: `new`, `learning`, `reviewed`
- SM-2 fields: `interval`, `repetition`, `efactor`, `dueDate`

## Reader State
Source: `data/readerStore.ts`

Storage key: `dictionary-mobile.reader.v1`

Contains:
- `documents`
- `selectedDocumentId`
- `settings`

Reader document fields:
- `id`
- `title`
- `content`
- `sourceFormat`: `txt`, `html`, `docx`, or `epub` in normal import flows; `pdf` may appear only when the web PDF gate is explicitly enabled.
- `createdAt`
- `updatedAt`

## Import Row
Source: `data/csvImport.ts`

Fields:
- `word`
- `definition`
- `ipa`
- `note`
- `tags`

Import options:
- `orientation`: `rows` or `columns`
- `hasHeader`
- `primaryField`
- `fieldMapping`

## Export
Supported:
- Folder CSV
- Folder Excel-compatible `.xls`
- Folder Anki TSV
- Full local JSON backup

Blocked:
- Google Sheets until OAuth/API decisions exist.
