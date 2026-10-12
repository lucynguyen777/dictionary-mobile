import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import Touchable from '@/components/app/Touchable';
import { DarkDataStat, formatMetricNumber } from '@/components/profile/Metrics';
import { useProfileStyles } from '@/components/profile/styles';
import { type ActivityState, getActivitySummary } from '@/data/activityStore';
import type { LibraryState } from '@/data/libraryStore';
import { useToken } from '@/hooks/use-token';
import {
  buildSavedWordChartData,
  buildStreakYearHeatmap,
  getActiveDaysForYear,
  getStreakYearOptions,
  getWordChartPeriodLabel,
  wordChartRanges,
  type WordChartRange,
} from '@/data/profileCharts';

// Saved words per day/week/month/year on the Profile dashboard.
export function SavedWordsChartCard({ savedWords }: { savedWords: LibraryState['savedWords'] }) {
  const styles = useProfileStyles();
  const [wordChartRange, setWordChartRange] = useState<WordChartRange>('day');
  const now = new Date();
  const wordChartData = buildSavedWordChartData(savedWords, wordChartRange, now);
  const wordChartPrimaryValue = wordChartRange === 'day' ? wordChartData.totalValue : wordChartData.averageValue;
  const wordChartMetricLabel = wordChartRange === 'day' ? 'TOTAL' : 'TRUNG BÌNH';
  const wordChartPeriodLabel = getWordChartPeriodLabel(wordChartRange, now);

  return (
    <View style={[styles.card, styles.metricsCardDark]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.metricsCardTitle}>Từ mới thêm vào tủ từ</Text>
          <Text style={styles.metricsCardSubtitle}>Tốc độ lưu từ theo ngày, tuần, tháng hoặc năm.</Text>
        </View>
      </View>
      <View style={styles.segmentedControl}>
        {wordChartRanges.map((range) => (
          <Touchable
            key={range.value}
            activeOpacity={0.82}
            onPress={() => setWordChartRange(range.value)}
            style={[styles.segmentButton, wordChartRange === range.value && styles.segmentButtonActive]}>
            <Text style={[styles.segmentButtonText, wordChartRange === range.value && styles.segmentButtonTextActive]}>
              {range.label}
            </Text>
          </Touchable>
        ))}
      </View>
      <View style={styles.metricsHeaderBlock}>
        <Text style={styles.metricsOverline}>{wordChartMetricLabel}</Text>
        <Text style={styles.metricsPrimaryValue}>{formatMetricNumber(wordChartPrimaryValue)}</Text>
        <Text style={styles.metricsPeriod}>{wordChartPeriodLabel}</Text>
      </View>
      <View style={styles.fitnessChartFrame}>
        <View pointerEvents="none" style={styles.chartGridOverlay}>
          <View style={styles.chartTopRule} />
          <View style={styles.chartMidRule} />
          <View style={styles.chartBottomRule} />
          {wordChartData.points.map((point) => (
            <View key={point.key} style={styles.chartVerticalRule} />
          ))}
        </View>
        <View style={styles.chartYAxisLabels}>
          <Text style={styles.chartAxisText}>{wordChartData.maxValue}</Text>
          <Text style={styles.chartAxisText}>{Math.round(wordChartData.maxValue / 2)}</Text>
          <Text style={styles.chartAxisText}>0</Text>
        </View>
        <View style={styles.barChart}>
          {wordChartData.points.map((point) => (
            <View key={point.key} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    point.key === wordChartData.currentKey && styles.barFillActive,
                    { height: `${Math.max(6, (point.value / wordChartData.maxValue) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>{point.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// App-open streak with a yearly heatmap on the Profile dashboard.
export function StreakCard({ activityState }: { activityState: ActivityState }) {
  const { colors } = useToken();
  const styles = useProfileStyles();
  const [selectedStreakYear, setSelectedStreakYear] = useState(new Date().getFullYear());
  const [streakYearMenuOpen, setStreakYearMenuOpen] = useState(false);
  const now = new Date();
  const activitySummary = getActivitySummary(activityState, now);
  const currentYear = now.getFullYear();
  const streakYearOptions = getStreakYearOptions(activityState, currentYear);
  const displayedStreakYear = streakYearOptions.includes(selectedStreakYear) ? selectedStreakYear : currentYear;
  const selectedYearActiveDays = getActiveDaysForYear(activityState, displayedStreakYear);
  const streakYearHeatmap = buildStreakYearHeatmap(activityState.activeDays, displayedStreakYear);

  return (
    <View style={[styles.card, styles.metricsCardDark]}>
      <View style={[styles.cardHeader, { zIndex: 10 }]}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.metricsCardTitle}>Streak đăng nhập</Text>
          <Text style={styles.metricsCardSubtitle}>Tính theo ngày app được mở trên thiết bị này.</Text>
        </View>
        <View style={styles.yearPickerWrap}>
          <Pressable
            accessibilityLabel="Chọn năm streak"
            accessibilityRole="button"
            onPress={() => setStreakYearMenuOpen((current) => !current)}
            style={({ pressed }) => [styles.metricsYearPill, pressed && styles.metricsYearPillPressed]}>
            <Text style={styles.metricsYearText}>{displayedStreakYear}</Text>
            <Ionicons name={streakYearMenuOpen ? 'chevron-up' : 'chevron-down'} size={13} color={colors.textOnHero} />
          </Pressable>
          {streakYearMenuOpen ? (
            <View style={styles.yearPickerMenu}>
              {streakYearOptions.map((year) => (
                <Pressable
                  key={year}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedStreakYear(year);
                    setStreakYearMenuOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.yearPickerOption,
                    year === displayedStreakYear && styles.yearPickerOptionActive,
                    pressed && styles.yearPickerOptionPressed,
                  ]}>
                  <Text style={[styles.yearPickerOptionText, year === displayedStreakYear && styles.yearPickerOptionTextActive]}>
                    {year}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.darkDataRowCompact}>
        <DarkDataStat compact label="Hiện tại" value={activitySummary.currentStreak} />
        <DarkDataStat compact label="Dài nhất" value={activitySummary.longestStreak} />
        <DarkDataStat compact label="Tháng này" value={activitySummary.activeDaysThisMonth} />
        <DarkDataStat compact label={displayedStreakYear === currentYear ? 'Năm nay' : 'Năm đó'} value={selectedYearActiveDays} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.streakHeatmapScroll}
        contentContainerStyle={styles.streakHeatmapContent}>
        <View>
          <View style={styles.streakMonthRow}>
            <View style={styles.streakWeekLabelSpacer} />
            <View style={styles.streakMonthGrid}>
              {streakYearHeatmap.monthLabels.map((month) => (
                <Text key={`${month.label}-${month.weekIndex}`} style={[styles.streakMonthLabel, { left: month.weekIndex * 13 }]}>
                  {month.label}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.streakGridRow}>
            <View style={styles.streakWeekLabels}>
              <Text style={styles.weekLabel}>Mon</Text>
              <Text style={styles.weekLabel}>Wed</Text>
              <Text style={styles.weekLabel}>Fri</Text>
            </View>
            <View style={styles.streakWeeks}>
              {streakYearHeatmap.weeks.map((week) => (
                <View key={week.key} style={styles.streakWeekColumn}>
                  {week.days.map((day) => (
                    <View
                      key={day.key}
                      style={[
                        styles.square,
                        !day.isInYear && styles.squareMuted,
                        day.isActive && day.level === 1 && styles.squareLevel1,
                        day.isActive && day.level === 2 && styles.squareLevel2,
                        day.isActive && day.level === 3 && styles.squareLevel3,
                        day.isActive && day.level >= 4 && styles.squareLevel4,
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
          <View style={styles.streakContributionFooter}>
            <Text style={styles.legendText}>Learn how we count app opens</Text>
            <View style={styles.legend}>
              <Text style={styles.legendText}>Less</Text>
              <View style={[styles.legendSquare]} />
              <View style={[styles.legendSquare, styles.squareLevel1]} />
              <View style={[styles.legendSquare, styles.squareLevel2]} />
              <View style={[styles.legendSquare, styles.squareLevel3]} />
              <View style={[styles.legendSquare, styles.squareLevel4]} />
              <Text style={styles.legendText}>More</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
