import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('@/data/storageAdapter', () => ({
  getStoredItem: vi.fn(async (key: string) => storage.get(key) ?? null),
  removeStoredItem: vi.fn(async (key: string) => {
    storage.delete(key);
  }),
  setStoredItem: vi.fn(async (key: string, value: string) => {
    storage.set(key, value);
  }),
}));

import { clearUserProfile, getDefaultProfile, loadUserProfile, saveUserProfile } from '../data/profileStore';

describe('profileStore notification preferences', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('adds default local notification preferences to older stored profiles', async () => {
    storage.set(
      'dictionary-mobile.profile.v1',
      JSON.stringify({
        displayName: 'Older profile',
        learningGoal: 'Travel',
      })
    );

    const profile = await loadUserProfile();

    expect(profile.notificationPreferences).toEqual({
      dailyReminderEnabled: true,
      reviewReminderEnabled: true,
      weeklySummaryEnabled: false,
      reminderTime: '20:00',
    });
  });

  it('persists notification preferences locally with the profile', async () => {
    const profile = await saveUserProfile({
      ...getDefaultProfile(),
      notificationPreferences: {
        dailyReminderEnabled: false,
        reviewReminderEnabled: true,
        weeklySummaryEnabled: true,
        reminderTime: '07:30',
      },
    });

    expect(profile.notificationPreferences.weeklySummaryEnabled).toBe(true);
    expect((await loadUserProfile()).notificationPreferences.reminderTime).toBe('07:30');

    await clearUserProfile();

    expect((await loadUserProfile()).notificationPreferences.reminderTime).toBe('20:00');
  });
});
