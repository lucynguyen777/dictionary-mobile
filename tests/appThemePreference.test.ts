import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('../data/storageAdapter', () => ({
  getStoredItem: vi.fn(async (key: string) => storage.get(key) ?? null),
  setStoredItem: vi.fn(async (key: string, value: string) => {
    storage.set(key, value);
  }),
}));

import {
  getCachedAppColorSchemePreference,
  loadAppColorSchemePreference,
  resolveAppColorScheme,
  saveAppColorSchemePreference,
  subscribeAppColorSchemePreference,
} from '../data/appThemePreference';

describe('appThemePreference', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('resolves system preference from the platform scheme', () => {
    expect(resolveAppColorScheme('system', 'dark')).toBe('dark');
    expect(resolveAppColorScheme('system', 'light')).toBe('light');
    expect(resolveAppColorScheme('light', 'dark')).toBe('light');
  });

  it('loads, saves, caches, and notifies preference changes', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAppColorSchemePreference(listener);

    expect(await loadAppColorSchemePreference()).toBe('system');
    expect(await saveAppColorSchemePreference('dark')).toBe('dark');
    expect(getCachedAppColorSchemePreference()).toBe('dark');
    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });
});
