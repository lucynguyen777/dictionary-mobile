import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/app/AppButton';
import { useToken } from '@/hooks/use-token';

// Shown when a screen's local data could not be read; the retry reloads it (plan 3.6).
export default function LoadErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors, radius, spacing } = useToken();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderDefault, borderRadius: radius.md, gap: spacing.sm, padding: spacing.lg }]}>
      <Ionicons name="alert-circle-outline" size={22} color={colors.accentError} />
      <Text style={[styles.text, { color: colors.textPrimary }]}>{message}</Text>
      <AppButton icon="refresh" label="Thử lại" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});
