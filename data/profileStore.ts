import { LanguageCode } from '@/data/languages';
import { getStoredItem, removeStoredItem, setStoredItem } from '@/data/storageAdapter';

const STORAGE_KEY = 'dictionary-mobile.profile.v1';

export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type LoginMethod = 'local' | 'email' | 'apple' | 'google';

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
    updatedAt: new Date().toISOString(),
  };
}

export async function loadUserProfile(): Promise<UserProfile> {
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

  await setStoredItem(STORAGE_KEY, JSON.stringify(nextProfile));

  return nextProfile;
}

export async function clearUserProfile() {
  await removeStoredItem(STORAGE_KEY);
}


function normalizeProfile(profile: Partial<UserProfile>): UserProfile {
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
  };
}

function getDefaultTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
