import { getStoredItem, setStoredItem } from './storageAdapter';

const STORAGE_KEY = 'dictionary-mobile.activity.v1';

export type ActivityState = {
  activeDays: string[];
  currentStreak: number;
  lastOpenedAt: string | null;
  longestStreak: number;
  updatedAt: string;
};

export type ActivitySummary = {
  activeDaysThisMonth: number;
  activeDaysThisYear: number;
  currentStreak: number;
  longestStreak: number;
};

export function getDefaultActivityState(now: Date = new Date()): ActivityState {
  return {
    activeDays: [],
    currentStreak: 0,
    lastOpenedAt: null,
    longestStreak: 0,
    updatedAt: now.toISOString(),
  };
}

export async function loadActivityState(): Promise<ActivityState> {
  const rawState = await getStoredItem(STORAGE_KEY);
  if (!rawState) return getDefaultActivityState();

  try {
    return normalizeActivityState(JSON.parse(rawState) as Partial<ActivityState>);
  } catch {
    return getDefaultActivityState();
  }
}

export async function saveActivityState(state: ActivityState): Promise<ActivityState> {
  const nextState = normalizeActivityState(state);
  await setStoredItem(STORAGE_KEY, JSON.stringify(nextState));

  return nextState;
}

export async function recordAppOpen(now: Date = new Date()): Promise<ActivityState> {
  const currentState = await loadActivityState();
  const todayKey = getLocalDateKey(now);
  const activeDays = Array.from(new Set([...currentState.activeDays, todayKey])).sort();
  const streaks = calculateActivityStreaks(activeDays, todayKey);

  return saveActivityState({
    ...currentState,
    activeDays,
    currentStreak: streaks.currentStreak,
    lastOpenedAt: now.toISOString(),
    longestStreak: Math.max(currentState.longestStreak, streaks.longestStreak),
    updatedAt: now.toISOString(),
  });
}

export function normalizeActivityState(state: Partial<ActivityState>, now: Date = new Date()): ActivityState {
  const defaultState = getDefaultActivityState(now);
  const activeDays = Array.from(new Set((state.activeDays ?? []).filter(isDateKey))).sort();
  const streaks = calculateActivityStreaks(activeDays, activeDays[activeDays.length - 1]);

  return {
    activeDays,
    currentStreak: Number.isFinite(state.currentStreak) ? Math.max(0, Math.floor(state.currentStreak ?? 0)) : streaks.currentStreak,
    lastOpenedAt: typeof state.lastOpenedAt === 'string' ? state.lastOpenedAt : defaultState.lastOpenedAt,
    longestStreak: Number.isFinite(state.longestStreak)
      ? Math.max(streaks.longestStreak, Math.floor(state.longestStreak ?? 0))
      : streaks.longestStreak,
    updatedAt: typeof state.updatedAt === 'string' ? state.updatedAt : defaultState.updatedAt,
  };
}

export function getActivitySummary(state: ActivityState, now: Date = new Date()): ActivitySummary {
  const monthPrefix = getLocalDateKey(now).slice(0, 7);
  const yearPrefix = getLocalDateKey(now).slice(0, 4);

  return {
    activeDaysThisMonth: state.activeDays.filter((day) => day.startsWith(monthPrefix)).length,
    activeDaysThisYear: state.activeDays.filter((day) => day.startsWith(yearPrefix)).length,
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
  };
}

export function calculateActivityStreaks(activeDays: string[], currentDayKey = activeDays[activeDays.length - 1]) {
  const sortedDays = Array.from(new Set(activeDays.filter(isDateKey))).sort();
  const dayOrdinals = new Set(sortedDays.map(dateKeyToOrdinal));
  let longestStreak = 0;
  let runningStreak = 0;
  let previousOrdinal: number | null = null;

  sortedDays.forEach((day) => {
    const ordinal = dateKeyToOrdinal(day);
    runningStreak = previousOrdinal === null || ordinal === previousOrdinal + 1 ? runningStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
    previousOrdinal = ordinal;
  });

  let currentStreak = 0;
  if (currentDayKey && isDateKey(currentDayKey)) {
    for (let ordinal = dateKeyToOrdinal(currentDayKey); dayOrdinals.has(ordinal); ordinal -= 1) {
      currentStreak += 1;
    }
  }

  return { currentStreak, longestStreak };
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function dateKeyToOrdinal(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);

  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
