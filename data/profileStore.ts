import { LanguageCode } from '@/data/languages';
import { getStoredItem, removeStoredItem, setStoredItem } from '@/data/storageAdapter';

const STORAGE_KEY = 'dictionary-mobile.profile.v1';

export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type LoginMethod = 'local' | 'email' | 'apple' | 'google';
export type NotificationPreferences = {
  dailyReminderEnabled: boolean;
  reviewReminderEnabled: boolean;
  weeklySummaryEnabled: boolean;
  reminderTime: string;
};

export type UserProfile = {
  displayName: string;
  email: string;
  username: string;
  phone: string;
  avatarUrl: string;
  loginMethod: LoginMethod;
  nativeLanguage: LanguageCode;
  learningLanguage: LanguageCode;
  proficiencyLevel: ProficiencyLevel;
  learningGoal: string;
  timezone: string;
  dailyGoal: string;
  appLockEnabled: boolean;
  cloudSyncEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  updatedAt: string;
};

export const proficiencyLevels: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const loginMethodOptions: { value: LoginMethod; label: string }[] = [
  { value: 'local', label: 'Chỉ lưu local' },
  { value: 'email', label: 'Email' },
  { value: 'apple', label: 'Apple' },
  { value: 'google', label: 'Google' },
];

export function getDefaultProfile(): UserProfile {
  return {
    displayName: 'Mai Anh',
    email: '',
    username: '',
    phone: '',
    avatarUrl: '',
    loginMethod: 'local',
    nativeLanguage: 'vi',
    learningLanguage: 'en',
    proficiencyLevel: 'B2',
    learningGoal: 'Giao tiếp hằng ngày',
    timezone: getDefaultTimezone(),
    dailyGoal: '15 từ/ngày',
    appLockEnabled: false,
    cloudSyncEnabled: false,
    notificationPreferences: getDefaultNotificationPreferences(),
    updatedAt: new Date().toISOString(),
  };
}

export async function loadUserProfile(): Promise<UserProfile> {
  try {
    const { loadUserProfileFromUserDatabase } = await import('./userDatabaseRuntime');
    return await loadUserProfileFromUserDatabase();
  } catch {
    return loadUserProfileFromAsyncStorage();
  }
}

export async function loadUserProfileFromAsyncStorage(): Promise<UserProfile> {
  const rawProfile = await getStoredItem(STORAGE_KEY);
  if (!rawProfile) return getDefaultProfile();

  try {
    return normalizeProfile(JSON.parse(rawProfile) as Partial<UserProfile>);
  } catch {
    return getDefaultProfile();
  }
}

export async function saveUserProfile(profile: UserProfile) {
  const nextProfile = normalizeProfile({
    ...profile,
    updatedAt: new Date().toISOString(),
  });

  try {
    const { saveUserProfileToUserDatabase } = await import('./userDatabaseRuntime');
    await saveUserProfileToUserDatabase(nextProfile);
  } catch {
    // AsyncStorage remains the recoverable source when SQLite is unavailable.
  }

  await saveUserProfileToAsyncStorage(nextProfile);

  return nextProfile;
}

export async function saveUserProfileToAsyncStorage(profile: UserProfile) {
  await setStoredItem(STORAGE_KEY, JSON.stringify(profile));
}

export async function clearUserProfile() {
  try {
    const { clearUserProfileFromUserDatabase } = await import('./userDatabaseRuntime');
    await clearUserProfileFromUserDatabase();
  } catch {
    // Local reset must still work if SQLite cannot open.
  }

  await clearUserProfileFromAsyncStorage();
}

export async function clearUserProfileFromAsyncStorage() {
  await removeStoredItem(STORAGE_KEY);
}

export function normalizeProfile(profile: Partial<UserProfile>): UserProfile {
  const defaultProfile = getDefaultProfile();

  return {
    ...defaultProfile,
    ...profile,
    displayName: profile.displayName?.trim() || defaultProfile.displayName,
    email: profile.email?.trim() ?? '',
    avatarUrl: profile.avatarUrl?.trim() || defaultProfile.avatarUrl,
    username: profile.username?.trim() || defaultProfile.username,
    phone: profile.phone?.trim() || defaultProfile.phone,
    learningGoal: profile.learningGoal?.trim() || defaultProfile.learningGoal,
    timezone: profile.timezone?.trim() || defaultProfile.timezone,
    dailyGoal: profile.dailyGoal?.trim() || defaultProfile.dailyGoal,
    cloudSyncEnabled: profile.cloudSyncEnabled ?? defaultProfile.cloudSyncEnabled,
    notificationPreferences: normalizeNotificationPreferences(profile.notificationPreferences),
  };
}

function normalizeNotificationPreferences(preferences?: Partial<NotificationPreferences>): NotificationPreferences {
  const defaultPreferences = getDefaultNotificationPreferences();

  return {
    dailyReminderEnabled: preferences?.dailyReminderEnabled ?? defaultPreferences.dailyReminderEnabled,
    reviewReminderEnabled: preferences?.reviewReminderEnabled ?? defaultPreferences.reviewReminderEnabled,
    weeklySummaryEnabled: preferences?.weeklySummaryEnabled ?? defaultPreferences.weeklySummaryEnabled,
    reminderTime: normalizeReminderTime(preferences?.reminderTime, defaultPreferences.reminderTime),
  };
}

function getDefaultNotificationPreferences(): NotificationPreferences {
  return {
    dailyReminderEnabled: true,
    reviewReminderEnabled: true,
    weeklySummaryEnabled: false,
    reminderTime: '20:00',
  };
}

function normalizeReminderTime(value: string | undefined, fallback: string) {
  const trimmedValue = value?.trim();

  return trimmedValue && /^\d{2}:\d{2}$/.test(trimmedValue) ? trimmedValue : fallback;
}

function getDefaultTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
