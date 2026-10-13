import { describe, expect, it } from 'vitest';

import { buildSavedWordChartData, buildStreakYearHeatmap, getStreakYearOptions } from '../data/profileCharts';

const now = new Date(2026, 9, 11, 12);
const word = (createdAt: Date) => ({ createdAt: createdAt.toISOString() }) as never;

describe('buildSavedWordChartData', () => {
  it('counts saved words into the last eight days and ignores older or invalid dates', () => {
    const data = buildSavedWordChartData(
      [word(new Date(2026, 9, 11, 9)), word(new Date(2026, 9, 11, 10)), word(new Date(2026, 9, 9)), word(new Date(2026, 8, 1)), { createdAt: 'bad' } as never],
      'day',
      now
    );

    expect(data.points).toHaveLength(8);
    expect(data.points.at(-1)?.value).toBe(2);
    expect(data.totalValue).toBe(3);
    expect(data.maxValue).toBe(2);
  });

  it('uses twelve monthly buckets for the month range', () => {
    const data = buildSavedWordChartData([word(new Date(2026, 0, 5)), word(new Date(2025, 10, 5))], 'month', now);
    expect(data.points).toHaveLength(12);
    expect(data.totalValue).toBe(2);
  });
});

describe('buildStreakYearHeatmap', () => {
  it('lays a year out as full weeks and marks active days', () => {
    const heatmap = buildStreakYearHeatmap(['2026-01-01', '2026-10-11', '2026-10-11'], 2026);
    const days = heatmap.weeks.flatMap((week) => week.days);

    expect(heatmap.weeks.every((week) => week.days.length === 7)).toBe(true);
    expect(days.filter((day) => day.isInYear)).toHaveLength(365);
    expect(days.find((day) => day.key === '2026-01-01')).toMatchObject({ isActive: true, level: 1 });
    expect(days.find((day) => day.key === '2026-10-11')).toMatchObject({ isActive: true, level: 2 });
    expect(heatmap.monthLabels).toHaveLength(12);
    expect(heatmap.monthLabels[0].weekIndex).toBe(0);
  });
});

describe('getStreakYearOptions', () => {
  it('always includes the current year', () => {
    expect(getStreakYearOptions({ activeDays: [] } as never, 2026)).toContain(2026);
  });
});
