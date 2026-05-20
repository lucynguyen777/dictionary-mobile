# Data Model Summary

## User Profile
Stores local user preferences:
- display name
- email placeholder/login method
- native language
- learning language
- proficiency level
- learning goal
- timezone
- daily goal

## Saved Word
Represents a word saved by the user.

Common fields:
- id
- word
- definition
- ipa
- audio
- note
- tags
- source language
- target language
- createdAt
- updatedAt

## Folder
Represents a vocabulary collection.

Common fields:
- id
- name
- createdAt
- updatedAt
- favorite
- color
- color note
- word membership

Rule:
Duplicating a folder should copy folder metadata and membership without duplicating saved word records unnecessarily.

## Flashcard
Generated from saved words or imported datasets.

Card types:
- bilingual
- word-definition
- definition-word
- word-pronunciation

Review state:
- new
- learning
- reviewed

Scheduling:
- SM-2 spaced repetition

## Import Dataset
Supports:
- CSV
- TSV

Import flow should include:
- preview
- field mapping
- validation
- duplicate detection
- destination folder
- flashcard generation options

## Export
Supported:
- CSV
- Excel-compatible XLS
- Anki TSV

Blocked:
- Google Sheets until OAuth decision exists