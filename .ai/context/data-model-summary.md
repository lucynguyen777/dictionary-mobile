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

## Cloud Synchronization Tables (Supabase Schema)
- **user_profiles**: stores user profile preferences and goals synced to backend.
- **library_folders**: folder metadata (id, name, color, color_note, is_favorite, etc.).
- **saved_words**: saved vocabulary (word, ipa, definition, audio, note, tags).
- **saved_word_folders**: relation mapping words to their corresponding folders.
- **search_history**: local query history logs.
- **flashcards**: spaced repetition states and schedules.
- **user_sync_cursors**: tracks incremental pull/push timestamps per domain.

## Translation & AI Tutor Tables (v1.3.0)
- **user_provider_connections**: metadata mappings for user-provided API credentials.
- **user_provider_secret_envelopes**: encrypted keys for credentials.
- **proxy_usage_events**: usage character/token metrics.
- **user_glossaries & user_glossary_entries**: custom translation mappings.
- **translation_datasets, translation_dataset_entries & translation_dataset_documents**: text segment corpus and reference document datasets.
- **translation_context_agents & translation_agent_usage_events**: tutor system instructions and usage details.

Blocked:
- Google Sheets until OAuth decision exists