import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('../data/storageAdapter', () => ({
  getStoredItem: vi.fn(async (key: string) => storage.get(key) ?? null),
  removeStoredItem: vi.fn(async (key: string) => {
    storage.delete(key);
  }),
  setStoredItem: vi.fn(async (key: string, value: string) => {
    storage.set(key, value);
  }),
}));

import {
  calculateActivityStreaks,
  getActivitySummary,
  getLocalDateKey,
  loadActivityState,
  recordAppOpen,
} from '../data/activityStore';

describe('activityStore', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('records each local active day only once', async () => {
    await recordAppOpen(new Date('2026-05-28T08:00:00Z'));
    const state = await recordAppOpen(new Date('2026-05-28T10:00:00Z'));

    expect(state.activeDays).toEqual(['2026-05-28']);
    expect(state.currentStreak).toBe(1);
    expect(state.longestStreak).toBe(1);
    expect(state.lastOpenedAt).toBe('2026-05-28T10:00:00.000Z');
  });

  it('counts consecutive streaks', async () => {
    await recordAppOpen(new Date('2026-05-26T08:00:00Z'));
    await recordAppOpen(new Date('2026-05-27T08:00:00Z'));
    const state = await recordAppOpen(new Date('2026-05-28T08:00:00Z'));

    expect(state.activeDays).toEqual(['2026-05-26', '2026-05-27', '2026-05-28']);
    expect(state.currentStreak).toBe(3);
    expect(state.longestStreak).toBe(3);
  });

  it('resets the current streak after a missed day but keeps the longest streak', async () => {
    await recordAppOpen(new Date('2026-05-20T08:00:00Z'));
    await recordAppOpen(new Date('2026-05-21T08:00:00Z'));
    await recordAppOpen(new Date('2026-05-22T08:00:00Z'));
    const state = await recordAppOpen(new Date('2026-05-24T08:00:00Z'));

    expect(state.currentStreak).toBe(1);
    expect(state.longestStreak).toBe(3);
  });

  it('normalizes stored state and reports month/year active-day counts', async () => {
    storage.set(
      'dictionary-mobile.activity.v1',
      JSON.stringify({
        activeDays: ['2026-05-01', 'bad-date', '2026-05-01', '2026-06-01'],
        longestStreak: 1,
      })
    );

    const state = await loadActivityState();
    const summary = getActivitySummary(state, new Date('2026-05-28T08:00:00Z'));

    expect(state.activeDays).toEqual(['2026-05-01', '2026-06-01']);
    expect(summary.activeDaysThisMonth).toBe(1);
    expect(summary.activeDaysThisYear).toBe(2);
    expect(summary.longestStreak).toBe(1);
  });

  it('calculates streaks from date keys and exposes local date keys', () => {
    expect(getLocalDateKey(new Date('2026-05-28T08:30:00Z'))).toBe('2026-05-28');
    expect(calculateActivityStreaks(['2026-05-20', '2026-05-22', '2026-05-23'], '2026-05-23')).toEqual({
      currentStreak: 2,
      longestStreak: 2,
    });
  });
});
