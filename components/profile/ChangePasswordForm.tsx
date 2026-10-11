import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MIN_PASSWORD_LENGTH, updateAuthPassword } from '@/data/authController';
import { useToken } from '@/hooks/use-token';

type ChangePasswordFormProps = {
  onDone: () => void;
  // Shown under the title, e.g. why the user is asked for a new password.
  description?: string;
};

export default function ChangePasswordForm({ description, onDone }: ChangePasswordFormProps) {
  const { colors, radius } = useToken();
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);
    setError('');
    const result = await updateAuthPassword(password, confirmation).catch(() => ({
      message: 'Không thể đổi mật khẩu lúc này. Thử lại sau.',
      ok: false as const,
    }));
    setIsSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPassword('');
    setConfirmation('');
    setIsDone(true);
  };

  if (isDone) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Đã đổi mật khẩu</Text>
        <Text style={styles.description}>Lần đăng nhập sau, hãy dùng mật khẩu mới.</Text>
        <Pressable accessibilityRole="button" onPress={onDone} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Xong</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đặt mật khẩu mới</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <TextInput
        accessibilityLabel="Mật khẩu mới"
        autoCapitalize="none"
        autoComplete="new-password"
        onChangeText={setPassword}
        placeholder={`Mật khẩu mới (tối thiểu ${MIN_PASSWORD_LENGTH} ký tự)`}
        placeholderTextColor={colors.textTertiary}
        secureTextEntry
        style={styles.input}
        textContentType="newPassword"
        value={password}
      />
      <TextInput
        accessibilityLabel="Nhập lại mật khẩu mới"
        autoCapitalize="none"
        autoComplete="new-password"
        onChangeText={setConfirmation}
        onSubmitEditing={handleSubmit}
        placeholder="Nhập lại mật khẩu mới"
        placeholderTextColor={colors.textTertiary}
        secureTextEntry
        style={styles.input}
        textContentType="newPassword"
        value={confirmation}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: isSaving, disabled: isSaving }}
        disabled={isSaving}
        onPress={handleSubmit}
        style={[styles.primaryButton, isSaving && styles.primaryButtonBusy]}>
        {isSaving ? <ActivityIndicator color={colors.textOnAccent} /> : <Text style={styles.primaryButtonText}>Lưu mật khẩu mới</Text>}
      </Pressable>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useToken>['colors'], radius: ReturnType<typeof useToken>['radius']) {
  return StyleSheet.create({
    container: {
      gap: 12,
      width: '100%',
    },
    description: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 19,
    },
    error: {
      color: colors.accentError,
      fontSize: 13,
      fontWeight: '700',
    },
    input: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.borderDefault,
      borderRadius: radius.md,
      borderWidth: 1,
      color: colors.textPrimary,
      fontSize: 15,
      minHeight: 44,
      paddingHorizontal: 12,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.accentPrimary,
      borderRadius: radius.md,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 16,
    },
    primaryButtonBusy: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: colors.textOnAccent,
      fontSize: 14,
      fontWeight: '700',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
  });
}
