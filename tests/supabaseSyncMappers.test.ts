import { describe, expect, it } from 'vitest';

import {
  mapDeletedEntityFromRemote,
  mapDeletedEntityToRemote,
  mapFlashcardFromRemote,
  mapFlashcardToRemote,
  mapFolderFromRemote,
  mapFolderToRemote,
  mapReaderDocumentFromRemote,
  mapReaderDocumentToRemote,
  mapReaderSettingsFromRemote,
  mapReaderSettingsToRemote,
  mapSavedWordFolderFromRemote,
  mapSavedWordFolderToRemote,
  mapSavedWordFromRemote,
  mapSavedWordToRemote,
  mapSearchHistoryFromRemote,
  mapSearchHistoryToRemote,
  mapUserProfileFromRemote,
  mapUserProfileToRemote,
} from '../data/supabaseSyncMappers';

const owner = { userId: '00000000-0000-0000-0000-000000000001' };

describe('supabase sync mappers', () => {
  it('maps profile rows without treating local profile email as auth identity', () => {
    const remote = mapUserProfileToRemote(
      {
        id: 'local-profile',
        display_name: 'Mai',
        email: 'local@example.com',
        username: 'mai',
        phone: '',
        avatar_url: '',
        login_method: 'local',
        native_language: 'vi',
        learning_language: 'en',
        proficiency_level: 'B2',
        learning_goal: 'Travel',
        timezone: 'Asia/Ho_Chi_Minh',
        daily_goal: '20',
        app_lock_enabled: 1,
        cloud_sync_enabled: 0,
        daily_reminder_enabled: 0,
        review_reminder_enabled: 1,
        weekly_summary_enabled: 1,
        reminder_time: '07:30',
        updated_at: '2026-05-20T00:00:00.000Z',
      },
      owner
    );

    expect(remote).toMatchObject({
      user_id: owner.userId,
      local_profile_id: 'local-profile',
      email: 'local@example.com',
      notification_preferences: {
        dailyReminderEnabled: false,
        reminderTime: '07:30',
        reviewReminderEnabled: true,
        weeklySummaryEnabled: true,
      },
      version: 1,
    });
    expect(mapUserProfileFromRemote(remote)).toMatchObject({
      id: 'local-profile',
      login_method: 'email',
      daily_reminder_enabled: 0,
      review_reminder_enabled: 1,
    });
  });

  it('maps library folders and saved words with JSON tags and soft deletes', () => {
    const folder = mapFolderToRemote(
      {
        id: 'folder-1',
        name: 'Travel',
        color: '#2563EB',
        color_note: 'blue',
        tags_json: '["trip", 42, "airport"]',
        avatar_uri: '',
        is_favorite: 1,
        created_at: '2026-05-01T00:00:00.000Z',
        updated_at: '2026-05-02T00:00:00.000Z',
        deleted_at: null,
      },
      owner
    );
    const savedWord = mapSavedWordToRemote(
      {
        id: 'word-1',
        word: 'hello',
        ipa: '/həˈloʊ/',
        definition: 'greeting',
        audio: '',
        note: 'common',
        tags_json: '["basic"]',
        source: 'api',
        created_at: '2026-05-03T00:00:00.000Z',
        updated_at: '2026-05-04T00:00:00.000Z',
        deleted_at: '2026-05-05T00:00:00.000Z',
      },
      owner
    );

    expect(folder.tags).toEqual(['trip', 'airport']);
    expect(folder.is_favorite).toBe(true);
    expect(mapFolderFromRemote(folder).tags_json).toBe('["trip","airport"]');
    expect(savedWord).toMatchObject({
      user_id: owner.userId,
      deleted_at: '2026-05-05T00:00:00.000Z',
      tags: ['basic'],
    });
    expect(mapSavedWordFromRemote(savedWord).tags_json).toBe('["basic"]');
  });

  it('maps relation, history, tombstone, and flashcard rows with deterministic timestamps', () => {
    const relation = mapSavedWordFolderToRemote(
      {
        word_id: 'word-1',
        folder_id: 'folder-1',
        created_at: '2026-05-01T00:00:00.000Z',
      },
      owner
    );
    const history = mapSearchHistoryToRemote(
      {
        id: 'search-hello',
        word: 'Hello',
        normalized_word: 'hello',
        looked_up_at: '2026-05-02T00:00:00.000Z',
      },
      owner
    );
    const flashcard = mapFlashcardToRemote(
      {
        id: 'card-1',
        word_id: 'word-1',
        type: 'word-definition',
        front: 'hello',
        back: 'greeting',
        created_at: '2026-05-03T00:00:00.000Z',
        review_state: 'learning',
        interval: 3,
        repetition: 1,
        efactor: 2.3,
        due_date: '2026-05-10T00:00:00.000Z',
        sync_status: 'pending_delete',
        last_synced_at: null,
        version: 4,
        deleted_at: '2026-05-04T00:00:00.000Z',
      },
      owner
    );
    const tombstone = mapDeletedEntityToRemote(
      {
        entity_type: 'folder',
        entity_id: 'folder-old',
        deleted_at: '2026-05-05T00:00:00.000Z',
      },
      owner
    );

    expect(relation.updated_at).toBe(relation.created_at);
    expect(mapSavedWordFolderFromRemote(relation)).toEqual({
      word_id: 'word-1',
      folder_id: 'folder-1',
      created_at: '2026-05-01T00:00:00.000Z',
    });
    expect(history.created_at).toBe(history.looked_up_at);
    expect(mapSearchHistoryFromRemote(history).normalized_word).toBe('hello');
    expect(flashcard).toMatchObject({ version: 4, updated_at: '2026-05-03T00:00:00.000Z' });
    expect(mapFlashcardFromRemote(flashcard)).toMatchObject({
      sync_status: 'pending_delete',
      last_synced_at: '2026-05-03T00:00:00.000Z',
    });
    expect(mapDeletedEntityFromRemote(tombstone)).toEqual({
      entity_type: 'folder',
      entity_id: 'folder-old',
      deleted_at: '2026-05-05T00:00:00.000Z',
    });
  });

  it('maps reader documents and settings while preserving local singleton ids', () => {
    const document = mapReaderDocumentToRemote(
      {
        id: 'doc-1',
        title: 'Reader',
        content: 'content',
        source_format: 'txt',
        created_at: '2026-05-01T00:00:00.000Z',
        updated_at: '2026-05-02T00:00:00.000Z',
        deleted_at: null,
      },
      owner
    );
    const settings = mapReaderSettingsToRemote(
      {
        id: 'local-reader-settings',
        selected_document_id: 'doc-1',
        font_size: 20,
        font_family: 'serif',
        background_color: '#FFF7ED',
        updated_at: '2026-05-03T00:00:00.000Z',
      },
      owner
    );

    expect(document.user_id).toBe(owner.userId);
    expect(mapReaderDocumentFromRemote(document)).toMatchObject({ id: 'doc-1', source_format: 'txt' });
    expect(settings.local_settings_id).toBe('local-reader-settings');
    expect(mapReaderSettingsFromRemote(settings)).toMatchObject({
      id: 'local-reader-settings',
      selected_document_id: 'doc-1',
      font_size: 20,
    });
  });
});
