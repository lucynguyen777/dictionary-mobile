import { describe, expect, it } from 'vitest';

import type { Flashcard } from '../data/libraryStore';
import { countDueFlashcards, getLiveStreak, getStudyStats } from '../data/studyStats';

const now = new Date(2026, 9, 11, 9, 0, 0);

function card(overrides: Partial<Flashcard>): Flashcard {
  return {
    createdAt: '2026-10-01T00:00:00.000Z',
    dueDate: new Date(2026, 9, 11, 8).toISOString(),
    reviewState: 'learning',
    ...overrides,
  } as Flashcard;
}

describe('countDueFlashcards', () => {
  it('counts cards due by the end of today and skips future or completed cards', () => {
    const cards = [
      card({ dueDate: new Date(2026, 9, 10).toISOString() }),
      card({ dueDate: new Date(2026, 9, 11, 23, 30).toISOString() }),
      card({ dueDate: new Date(2026, 9, 15).toISOString(), reviewState: 'learning' }),
      card({ dueDate: new Date(2026, 9, 9).toISOString(), finalStatus: 'completed' }),
    ];
    expect(countDueFlashcards(cards, now)).toBe(2);
  });
});

describe('getLiveStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(getLiveStreak({ activeDays: ['2026-10-09', '2026-10-10', '2026-10-11'] }, now)).toBe(3);
  });

  it('keeps yesterday’s streak alive before today’s first open', () => {
    expect(getLiveStreak({ activeDays: ['2026-10-09', '2026-10-10'] }, now)).toBe(2);
  });

  it('drops to zero after a missed day', () => {
    expect(getLiveStreak({ activeDays: ['2026-10-08'] }, now)).toBe(0);
  });
});

describe('getStudyStats', () => {
  it('derives every Home metric from local data', () => {
    const stats = getStudyStats(
      {
        flashcards: [card({}), card({ reviewState: 'reviewed', dueDate: new Date(2026, 10, 1).toISOString() })],
        savedWords: [{}, {}, {}] as never,
      },
      { activeDays: ['2026-10-11'] },
      now
    );
    expect(stats).toEqual({ dueToday: 1, mastered: 1, savedWords: 3, streak: 1 });
  });

  it('is all zeros for a new user', () => {
    expect(getStudyStats({ flashcards: [], savedWords: [] }, { activeDays: [] }, now))
      .toEqual({ dueToday: 0, mastered: 0, savedWords: 0, streak: 0 });
  });
});
