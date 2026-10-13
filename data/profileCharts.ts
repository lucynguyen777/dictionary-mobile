// Pure date bucketing for the Profile saved-words chart and login-streak heatmap.
import { getLocalDateKey, type ActivityState } from './activityStore';
import type { LibraryState } from './libraryStore';

export type WordChartRange = 'day' | 'week' | 'month' | 'year';

export const wordChartRanges: { label: string; value: WordChartRange }[] = [
  { label: 'D', value: 'day' },
  { label: 'W', value: 'week' },
  { label: 'M', value: 'month' },
  { label: 'Y', value: 'year' },
];

const monthShortLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function buildSavedWordChartData(savedWords: LibraryState['savedWords'], range: WordChartRange, now: Date) {
  const bucketCount = range === 'day' ? 8 : range === 'week' ? 8 : range === 'month' ? 12 : 6;
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketDate = new Date(now);

    if (range === 'day') {
      bucketDate.setDate(now.getDate() - (bucketCount - 1 - index));
    } else if (range === 'week') {
      bucketDate.setDate(now.getDate() - (bucketCount - 1 - index) * 7);
    } else if (range === 'month') {
      bucketDate.setMonth(now.getMonth() - (bucketCount - 1 - index), 1);
    } else {
      bucketDate.setFullYear(now.getFullYear() - (bucketCount - 1 - index), 0, 1);
    }

    return {
      key: getWordChartBucketKey(bucketDate, range),
      label: getWordChartBucketLabel(bucketDate, range),
      value: 0,
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  savedWords.forEach((word) => {
    const createdAt = new Date(word.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;

    const bucket = bucketByKey.get(getWordChartBucketKey(createdAt, range));
    if (bucket) bucket.value += 1;
  });
  const totalValue = buckets.reduce((sum, bucket) => sum + bucket.value, 0);

  return {
    averageValue: totalValue / bucketCount,
    currentKey: getWordChartBucketKey(now, range),
    maxValue: Math.max(1, ...buckets.map((bucket) => bucket.value)),
    points: buckets,
    totalValue,
  };
}

function getWordChartBucketKey(date: Date, range: WordChartRange) {
  if (range === 'day') return getLocalDateKey(date);
  if (range === 'week') return getLocalDateKey(getWeekStartDate(date));
  if (range === 'month') return getLocalDateKey(date).slice(0, 7);

  return getLocalDateKey(date).slice(0, 4);
}

function getWordChartBucketLabel(date: Date, range: WordChartRange) {
  if (range === 'day') return `${date.getDate()}/${date.getMonth() + 1}`;
  if (range === 'week') return `${getWeekStartDate(date).getDate()}/${getWeekStartDate(date).getMonth() + 1}`;
  if (range === 'month') return `T${date.getMonth() + 1}`;

  return `${date.getFullYear()}`;
}

export function getWordChartPeriodLabel(range: WordChartRange, now: Date) {
  if (range === 'day') return 'Hôm nay';
  if (range === 'week') return 'Tuần này';
  if (range === 'month') return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;

  return `${now.getFullYear()}`;
}

function getWeekStartDate(date: Date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart;
}

export function getStreakYearOptions(activityState: ActivityState, currentYear: number) {
  const years = new Set([currentYear]);

  activityState.activeDays.forEach((dayKey) => {
    const year = Number(dayKey.slice(0, 4));
    if (!Number.isNaN(year)) years.add(year);
  });

  return [...years].sort((a, b) => b - a);
}

export function getActiveDaysForYear(activityState: ActivityState, year: number) {
  return activityState.activeDays.filter((dayKey) => dayKey.startsWith(`${year}-`)).length;
}

export function buildStreakYearHeatmap(activeDays: string[], year: number) {
  // Count occurrences of each day to determine intensity levels
  const activeDayCounts = new Map<string, number>();
  activeDays.forEach((day) => {
    activeDayCounts.set(day, (activeDayCounts.get(day) ?? 0) + 1);
  });

  const firstDay = new Date(year, 0, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  gridStart.setHours(0, 0, 0, 0);

  const lastDay = new Date(year, 11, 31);
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  gridEnd.setHours(0, 0, 0, 0);

  const weekCount = Math.ceil((gridEnd.getTime() - gridStart.getTime() + 1) / (7 * 24 * 60 * 60 * 1000));
  const weeks = Array.from({ length: weekCount }, (_, weekIndex) => {
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);
      const key = getLocalDateKey(date);
      const count = activeDayCounts.get(key) ?? 0;

      // Level 0 = no activity, 1 = light, 2 = medium, 3 = strong, 4 = max
      const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;

      return {
        isActive: count > 0,
        isInYear: date.getFullYear() === year,
        key,
        level,
      };
    });

    return {
      days,
      key: `week-${weekIndex}`,
    };
  });
  const monthLabels = monthShortLabels.map((label, monthIndex) => {
    const monthStart = new Date(year, monthIndex, 1);
    const weekIndex = Math.floor((monthStart.getTime() - gridStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

    return { label, weekIndex };
  });

  return { monthLabels, weeks };
}
