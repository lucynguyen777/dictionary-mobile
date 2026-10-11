import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useToken } from '@/hooks/use-token';

export const FUTURE_FEATURE_LABEL = 'Cập nhật trong phiên bản sau';

// Explains why a visible feature is not available yet (DESIGN.md: disabled/future-version controls).
export function FutureFeatureNotice({ reason, style }: { reason: string; style?: StyleProp<ViewStyle> }) {
  const styles = useFutureFeatureStyles();
  const { colors } = useToken();

  return (
    <View accessibilityRole="text" style={[styles.notice, style]}>
      <Ionicons name="time-outline" size={16} color={colors.accentWarning} />
      <View style={styles.noticeCopy}>
        <Text style={styles.noticeTitle}>{FUTURE_FEATURE_LABEL}</Text>
        <Text style={styles.noticeText}>{reason}</Text>
      </View>
    </View>
  );
}

export function FutureFeatureBadge() {
  const styles = useFutureFeatureStyles();
  const { colors } = useToken();

  return (
    <View style={styles.badge}>
      <Ionicons name="time-outline" size={12} color={colors.accentWarning} />
      <Text style={styles.badgeText}>{FUTURE_FEATURE_LABEL}</Text>
    </View>
  );
}

function useFutureFeatureStyles() {
  const { colors, radius } = useToken();
  return useMemo(
    () =>
      StyleSheet.create({
        badge: {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: colors.statusWarning,
          borderColor: colors.accentWarning,
          borderRadius: radius.full,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        badgeText: {
          color: colors.accentWarning,
          fontSize: 10,
          fontWeight: '700',
        },
        notice: {
          alignItems: 'flex-start',
          backgroundColor: colors.statusWarning,
          borderColor: colors.accentWarning,
          borderRadius: radius.md,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 8,
          marginTop: 12,
          padding: 12,
        },
        noticeCopy: {
          flex: 1,
          minWidth: 0,
        },
        noticeText: {
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: '600',
          lineHeight: 17,
          marginTop: 2,
        },
        noticeTitle: {
          color: colors.accentWarning,
          fontSize: 12,
          fontWeight: '700',
        },
      }),
    [colors, radius]
  );
}
