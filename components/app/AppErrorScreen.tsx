import Ionicons from '@expo/vector-icons/Ionicons';
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { reportError } from '@/data/errorReporting';
import { useToken } from '@/hooks/use-token';

// Shown by Expo Router when a screen throws while rendering. Local data is untouched, so retrying
// is safe; the error itself goes to the provider-neutral reporter.
export default function AppErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const { colors, radius } = useToken();
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);

  useEffect(() => {
    reportError(error, { source: 'render' });
  }, [error]);

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Ionicons name="alert-circle-outline" size={40} color={colors.accentError} />
      <Text style={styles.title}>Màn hình này gặp lỗi</Text>
      <Text style={styles.body}>
        Dữ liệu học của bạn vẫn an toàn trên thiết bị. Thử tải lại màn hình; nếu lỗi lặp lại, hãy gửi phản hồi trong Hồ sơ.
      </Text>
      <Pressable accessibilityRole="button" onPress={() => void retry()} style={styles.button}>
        <Text style={styles.buttonText}>Thử lại</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useToken>['colors'], radius: ReturnType<typeof useToken>['radius']) {
  return StyleSheet.create({
    body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, maxWidth: 360, textAlign: 'center' },
    button: { alignItems: 'center', backgroundColor: colors.accentPrimary, borderRadius: radius.md, justifyContent: 'center', minHeight: 44, paddingHorizontal: 24 },
    buttonText: { color: colors.textOnAccent, fontSize: 15, fontWeight: '700' },
    container: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: 16, justifyContent: 'center', padding: 24 },
    title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  });
}
