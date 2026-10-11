import { Text, View } from 'react-native';
import { useToken } from '@/hooks/use-token';

import { styles } from '@/components/profile/styles';

export function ProfileMetric({ label, value }: { label: string; value: number }) {
  const { colors } = useToken();

  return (
    <View style={[styles.profileMetric, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderDefault }]}>
      <Text style={[styles.profileMetricValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.profileMetricLabel, { color: colors.textSecondary }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function DataStat({ label, value }: { label: string; value: number }) {
  const { colors } = useToken();

  return (
    <View style={[styles.dataStat, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderDefault }]}>
      <Text style={[styles.dataStatValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.dataStatLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export function DarkDataStat({ compact, label, value }: { compact?: boolean; label: string; value: number }) {
  return (
    <View style={[styles.darkDataStat, compact && styles.darkDataStatCompact]}>
      <Text style={styles.darkDataStatValue}>{value}</Text>
      <Text numberOfLines={1} style={[styles.darkDataStatLabel, compact && styles.darkDataStatLabelCompact]}>{label}</Text>
    </View>
  );
}

export function formatMetricNumber(value: number) {
  if (value < 10 && value % 1 !== 0) return value.toFixed(1);

  return Math.round(value).toLocaleString('vi-VN');
}
