import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Screen from '@/components/app/Screen';
import { completeAuthCallback, type AuthCallbackParams } from '@/data/authController';
import { type AuthSessionSnapshot } from '@/data/authSession';

const initialAuthCallbackState: AuthSessionSnapshot = {
  status: 'loading',
  userId: null,
  email: null,
  emailVerified: false,
  phone: null,
  lastAuthEvent: null,
};

function getCallbackCopy(authSession: AuthSessionSnapshot) {
  switch (authSession.status) {
    case 'authenticated':
      return {
        icon: 'checkmark-circle-outline' as const,
        title: 'Đăng nhập cloud đã sẵn sàng',
        message: authSession.email ? `${authSession.email} đã được xác nhận cho phiên cloud.` : 'Phiên cloud đã được xác nhận.',
      };
    case 'needs_verification':
      return {
        icon: 'mail-outline' as const,
        title: 'Cần xác minh email',
        message: 'Mở liên kết trong email để hoàn tất xác minh tài khoản.',
      };
    case 'unconfigured':
      return {
        icon: 'cloud-offline-outline' as const,
        title: 'Cloud chưa sẵn sàng',
        message: 'Bản cài đặt này đang giữ chế độ local-first.',
      };
    case 'error':
      return {
        icon: 'alert-circle-outline' as const,
        title: 'Không thể hoàn tất đăng nhập',
        message: authSession.errorMessage ?? 'Liên kết đăng nhập không còn hợp lệ.',
      };
    case 'unauthenticated':
      return {
        icon: 'person-circle-outline' as const,
        title: 'Chưa có phiên cloud',
        message: 'Hồ sơ local vẫn được giữ nguyên trên thiết bị này.',
      };
    case 'loading':
      return {
        icon: 'sync-outline' as const,
        title: 'Đang hoàn tất đăng nhập',
        message: 'Đang xác nhận liên kết cloud.',
      };
  }
}

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<AuthCallbackParams>();
  const [authSession, setAuthSession] = useState<AuthSessionSnapshot>(initialAuthCallbackState);

  useEffect(() => {
    let isMounted = true;

    completeAuthCallback(params).then((nextAuthSession) => {
      if (!isMounted) return;

      setAuthSession(nextAuthSession);
    });

    return () => {
      isMounted = false;
    };
  }, [params]);

  const copy = getCallbackCopy(authSession);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.statusCircle}>
          <Ionicons name={copy.icon} size={34} color="#2563EB" />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.message}>{copy.message}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/profile' as never)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
          <Text style={styles.primaryButtonText}>Về hồ sơ</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  statusCircle: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: 18,
    width: 72,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 320,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 44,
    minWidth: 132,
    paddingHorizontal: 18,
  },
  primaryButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
