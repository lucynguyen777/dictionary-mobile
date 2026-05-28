import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';

import { recordAppOpen } from '@/data/activityStore';
import { installDevelopmentWarningFilter } from '@/data/developmentWarnings';
import { loadUserProfile } from '@/data/profileStore';
import { useColorScheme } from '@/hooks/use-color-scheme';

installDevelopmentWarningFilter();

export const unstable_settings = {
  anchor: '(tabs)',
};

type AppLockState = 'checking' | 'unlocked' | 'locked' | 'unsupported';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appLockState, setAppLockState] = useState<AppLockState>('checking');

  const unlockApp = useCallback(async () => {
    setAppLockState('checking');

    try {
      const profile = await loadUserProfile();

      if (!profile.appLockEnabled || Platform.OS === 'web') {
        setAppLockState('unlocked');
        return;
      }

      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      if (!hasHardware || !isEnrolled) {
        setAppLockState('unsupported');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        cancelLabel: 'Hủy',
        disableDeviceFallback: false,
        fallbackLabel: 'Dùng mã thiết bị',
        promptMessage: 'Mở khóa Dictionary Mobile',
      });

      setAppLockState(result.success ? 'unlocked' : 'locked');
    } catch {
      setAppLockState('unsupported');
    }
  }, []);

  useEffect(() => {
    unlockApp();
  }, [unlockApp]);

  useEffect(() => {
    if (appLockState !== 'unlocked') return;

    recordAppOpen().catch(() => {
      // Activity tracking should never block app entry.
    });
  }, [appLockState]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {appLockState === 'unlocked' ? (
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      ) : (
        <AppLockScreen
          onContinue={() => setAppLockState('unlocked')}
          onRetry={unlockApp}
          state={appLockState}
        />
      )}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function AppLockScreen({
  onContinue,
  onRetry,
  state,
}: {
  onContinue: () => void;
  onRetry: () => void;
  state: AppLockState;
}) {
  const isChecking = state === 'checking';
  const isUnsupported = state === 'unsupported';

  return (
    <View style={styles.lockScreen}>
      <View style={styles.lockCard}>
        <Text style={styles.lockIcon}>Lock</Text>
        <Text style={styles.lockTitle}>Dictionary Mobile đang được khóa</Text>
        <Text style={styles.lockText}>
          {isUnsupported
            ? 'Thiết bị hoặc môi trường hiện tại chưa hỗ trợ khóa sinh trắc học. Bạn vẫn có thể tiếp tục để vào app.'
            : 'Xác thực bằng sinh trắc học hoặc mã thiết bị để tiếp tục học.'}
        </Text>
        {isChecking ? <ActivityIndicator color="#2563EB" style={styles.lockSpinner} /> : null}
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isChecking}
          onPress={isUnsupported ? onContinue : onRetry}
          style={[styles.lockButton, isChecking && styles.lockButtonDisabled]}
        >
          <Text style={styles.lockButtonText}>{isUnsupported ? 'Tiếp tục' : 'Mở khóa'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockScreen: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  lockCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 420,
    padding: 22,
    width: '100%',
  },
  lockIcon: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  lockTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center',
  },
  lockText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  lockSpinner: {
    marginTop: 16,
  },
  lockButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 999,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  lockButtonDisabled: {
    opacity: 0.55,
  },
  lockButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
