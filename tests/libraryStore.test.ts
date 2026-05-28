// Mock expo native modules before any other imports
vi.mock('expo-file-system', () => ({
  File: class {},
  Paths: { document: '' },
}));
vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(false),
  shareAsync: vi.fn(),
}));

import { describe, expect, it, vi } from 'vitest';

import {
  createFlashcardsFromWordIds,
  deleteFlashcard,
  getDefaultLibraryState,
  getPendingFlashcards,
  markFlashcardSynced,
  reviewFlashcard,
  updateFlashcardReviewState,
} from '../data/libraryStore';
import type { LibraryState } from '../data/libraryStore';

// Mock storage module to prevent real file system access during tests
vi.mock('../data/storageAdapter', () => ({
  getStoredItem: vi.fn().mockResolvedValue(null),
  setStoredItem: vi.fn().mockResolvedValue(undefined),
  removeStoredItem: vi.fn().mockResolvedValue(undefined),
}));

describe('libraryStore flashcard sync state', () => {
  it('initializes new flashcards with pending_create sync status', async () => {
    const initialState: LibraryState = {
      ...getDefaultLibraryState(),
      savedWords: [
        {
          id: 'word-hello',
          word: 'hello',
          ipa: '',
          definition: 'greeting',
          audio: '',
          folderIds: [],
          note: '',
          tags: [],
          source: '',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
      ],
    };

    const state = await createFlashcardsFromWordIds(initialState, ['word-hello'], ['bilingual']);

    expect(state.flashcards).toHaveLength(1);
    const card = state.flashcards[0];
    expect(card.syncStatus).toBe('pending_create');
    expect(card.version).toBe(1);
    expect(card.lastSyncedAt).toBeNull();
  });

  it('maintains pending_create when updating an unsynced card', async () => {
    let state: LibraryState = {
      ...getDefaultLibraryState(),
      flashcards: [
        {
          id: 'card-1',
          wordId: 'word-1',
          type: 'bilingual',
          front: 'front',
          back: 'back',
          createdAt: '2023-01-01',
          reviewState: 'new',
          interval: 0,
          repetition: 0,
          efactor: 2.5,
          dueDate: '2023-01-01',
          syncStatus: 'pending_create',
          version: 1,
        },
      ],
    };

    state = await updateFlashcardReviewState(state, 'card-1', 'learning');

    expect(state.flashcards[0].reviewState).toBe('learning');
    expect(state.flashcards[0].syncStatus).toBe('pending_create'); // still pending_create
    expect(state.flashcards[0].version).toBe(2);
  });

  it('transitions to pending_update when updating a synced card', async () => {
    let state: LibraryState = {
      ...getDefaultLibraryState(),
      flashcards: [
        {
          id: 'card-2',
          wordId: 'word-2',
          type: 'bilingual',
          front: 'front',
          back: 'back',
          createdAt: '2023-01-01',
          reviewState: 'new',
          interval: 0,
          repetition: 0,
          efactor: 2.5,
          dueDate: '2023-01-01',
          syncStatus: 'synced',
          lastSyncedAt: '2023-01-02',
          version: 1,
        },
      ],
    };

    state = await updateFlashcardReviewState(state, 'card-2', 'learning');

    expect(state.flashcards[0].syncStatus).toBe('pending_update');
    expect(state.flashcards[0].version).toBe(2);
  });

  it('marks card as synced', async () => {
    let state: LibraryState = {
      ...getDefaultLibraryState(),
      flashcards: [
        {
          id: 'card-3',
          wordId: 'word-3',
          type: 'bilingual',
          front: 'front',
          back: 'back',
          createdAt: '2023-01-01',
          reviewState: 'new',
          interval: 0,
          repetition: 0,
          efactor: 2.5,
          dueDate: '2023-01-01',
          syncStatus: 'pending_update',
          version: 3,
        },
      ],
    };

    const timestamp = '2023-01-03';
    state = await markFlashcardSynced(state, 'card-3', timestamp);

    expect(state.flashcards[0].syncStatus).toBe('synced');
    expect(state.flashcards[0].lastSyncedAt).toBe(timestamp);
  });

  it('soft deletes a card and physically removes it when synced', async () => {
    let state: LibraryState = {
      ...getDefaultLibraryState(),
      flashcards: [
        {
          id: 'card-4',
          wordId: 'word-4',
          type: 'bilingual',
          front: 'front',
          back: 'back',
          createdAt: '2023-01-01',
          reviewState: 'new',
          interval: 0,
          repetition: 0,
          efactor: 2.5,
          dueDate: '2023-01-01',
          syncStatus: 'synced',
          version: 1,
        },
      ],
    };

    // Soft delete
    state = await deleteFlashcard(state, 'card-4');
    expect(state.flashcards).toHaveLength(1);
    expect(state.flashcards[0].syncStatus).toBe('pending_delete');
    expect(state.flashcards[0].version).toBe(2);

    // Get pending syncs
    const pending = getPendingFlashcards(state);
    expect(pending).toHaveLength(1);
    expect(pending[0].syncStatus).toBe('pending_delete');

    // Mark as synced (physically remove)
    state = await markFlashcardSynced(state, 'card-4', '2023-01-04');
    expect(state.flashcards).toHaveLength(0);
  });

  it('records review events and completes cards after user thresholds', async () => {
    let state: LibraryState = {
      ...getDefaultLibraryState(),
      flashcardLearningSettings: {
        completionMinAverageQuality: 4,
        completionMinReviewCount: 3,
      },
      flashcards: [
        {
          id: 'card-5',
          wordId: 'word-5',
          type: 'bilingual',
          front: 'front',
          back: 'back',
          createdAt: '2023-01-01',
          reviewState: 'new',
          finalStatus: 'started',
          completedAt: null,
          interval: 0,
          repetition: 0,
          efactor: 2.5,
          dueDate: '2023-01-01',
          syncStatus: 'synced',
          version: 1,
        },
      ],
    };

    state = await reviewFlashcard(state, 'card-5', 5);
    state = await reviewFlashcard(state, 'card-5', 4);
    state = await reviewFlashcard(state, 'card-5', 4);

    expect(state.flashcardReviewEvents).toHaveLength(3);
    expect(state.flashcardReviewEvents?.map((event) => event.quality)).toEqual([5, 4, 4]);
    expect(state.flashcards[0].finalStatus).toBe('completed');
    expect(state.flashcards[0].completedAt).toBeTruthy();
    expect(state.flashcards[0].syncStatus).toBe('pending_update');
  });
});
