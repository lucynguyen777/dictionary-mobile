import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LibraryState } from '@/data/libraryStore';

import { useTrainingStyles } from '@/components/training/styles';
import { useToken } from '@/hooks/use-token';

export function AnalyticsStat({ label, value }: { label: string; value: number | string }) {
  const styles = useTrainingStyles();
  return (
    <View style={styles.analyticsStat}>
      <Text style={styles.analyticsStatValue}>{value}</Text>
      <Text style={styles.analyticsStatLabel}>{label}</Text>
    </View>
  );
}

export function FlashcardStatusDonut({
  completed,
  inProgress,
  started,
}: {
  completed: number;
  inProgress: number;
  started: number;
}) {
  const { colors } = useToken();
  const styles = useTrainingStyles();
  const total = Math.max(1, completed + inProgress + started);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { color: colors.successOnHero, value: completed },
    { color: colors.accentOnHero, value: inProgress },
    { color: colors.accentOnHeroMuted, value: started },
  ];
  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <Svg height={86} width={86} viewBox="0 0 86 86">
        <Circle cx="43" cy="43" fill="none" r={radius} stroke={colors.surfaceOnHero} strokeWidth="10" />
        {segments.map((segment) => {
          const dash = (segment.value / total) * circumference;
          const strokeDashoffset = -offset;
          offset += dash;

          return (
            <Circle
              key={segment.color}
              cx="43"
              cy="43"
              fill="none"
              r={radius}
              stroke={segment.color}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="10"
              transform="rotate(-90 43 43)"
            />
          );
        })}
      </Svg>
      <Text style={styles.donutCenter}>{completed}</Text>
    </View>
  );
}

export function getFlashcardAnalytics(state: LibraryState, dueToday: number) {
  const reviewEvents = state.flashcardReviewEvents ?? [];
  const totalReviews = reviewEvents.length;
  const averageScore = totalReviews ? reviewEvents.reduce((sum, event) => sum + event.quality, 0) / totalReviews : 0;
  const completedCards = state.flashcards.filter((card) => card.finalStatus === 'completed');
  const completedDurations = completedCards.flatMap((card) => {
    if (!card.completedAt) return [];
    const createdAt = new Date(card.createdAt).getTime();
    const completedAt = new Date(card.completedAt).getTime();
    if (!Number.isFinite(createdAt) || !Number.isFinite(completedAt)) return [];

    return [Math.max(0, Math.ceil((completedAt - createdAt) / 86_400_000))];
  });
  const averageDaysToComplete = completedDurations.length
    ? completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length
    : 0;

  return {
    averageDaysToCompleteLabel: completedDurations.length ? averageDaysToComplete.toFixed(1) : '0',
    averageScoreLabel: totalReviews ? averageScore.toFixed(1) : '0',
    completed: completedCards.length,
    dueToday,
    inProgress: state.flashcards.filter((card) => card.finalStatus === 'in_progress').length,
    started: state.flashcards.filter((card) => !card.finalStatus || card.finalStatus === 'started').length,
    totalCards: state.flashcards.length,
    totalReviews,
  };
}
