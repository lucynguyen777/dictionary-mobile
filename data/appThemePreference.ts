import { getStoredItem, setStoredItem } from './storageAdapter';

export type AppColorSchemePreference = 'system' | 'light' | 'dark';
export type ResolvedAppColorScheme = 'light' | 'dark';

export const APP_THEME_PREFERENCE_STORAGE_KEY = 'dictionary-mobile.app-theme-preference.v1';

let cachedPreference: AppColorSchemePreference = 'system';
const preferenceListeners = new Set<() => void>();

export function normalizeAppColorSchemePreference(value: unknown): AppColorSchemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function resolveAppColorScheme(
  preference: AppColorSchemePreference,
  systemScheme: ResolvedAppColorScheme | null | undefined = 'light'
): ResolvedAppColorScheme {
  if (preference === 'light' || preference === 'dark') return preference;

  return systemScheme === 'dark' ? 'dark' : 'light';
}

export async function loadAppColorSchemePreference(): Promise<AppColorSchemePreference> {
  const rawPreference = await getStoredItem(APP_THEME_PREFERENCE_STORAGE_KEY);
  cachedPreference = normalizeAppColorSchemePreference(rawPreference);
  notifyThemePreferenceListeners();

  return cachedPreference;
}

export async function saveAppColorSchemePreference(preference: AppColorSchemePreference) {
  const normalizedPreference = normalizeAppColorSchemePreference(preference);
  await setStoredItem(APP_THEME_PREFERENCE_STORAGE_KEY, normalizedPreference);
  cachedPreference = normalizedPreference;
  notifyThemePreferenceListeners();

  return normalizedPreference;
}

export function getCachedAppColorSchemePreference() {
  return cachedPreference;
}

export function subscribeAppColorSchemePreference(listener: () => void) {
  preferenceListeners.add(listener);

  return () => {
    preferenceListeners.delete(listener);
  };
}

function notifyThemePreferenceListeners() {
  preferenceListeners.forEach((listener) => listener());
}
