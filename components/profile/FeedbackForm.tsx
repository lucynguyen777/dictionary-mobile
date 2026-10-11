import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { APP_RELEASE } from '@/constants/appRelease';
import { submitFeedback } from '@/data/backendProxyClient';
import {
  FEEDBACK_MAX_MESSAGE_LENGTH,
  buildFeedbackContext,
  describeFeedbackError,
  feedbackCategories,
  validateFeedbackMessage,
  type FeedbackCategory,
} from '@/data/feedback';
import { useToken } from '@/hooks/use-token';

export default function FeedbackForm({ onDone }: { onDone: () => void }) {
  const { colors, radius } = useToken();
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async () => {
    const validationError = validateFeedbackMessage(message);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSending(true);
    setError('');
    try {
      await submitFeedback({ category, context: buildFeedbackContext(APP_RELEASE.version, Platform.OS), message });
      setMessage('');
      setIsDone(true);
    } catch (submitError) {
      setError(describeFeedbackError(submitError));
    } finally {
      setIsSending(false);
    }
  };

  if (isDone) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Đã gửi phản hồi</Text>
        <Text style={styles.description}>Cảm ơn bạn. Nhóm phát triển sẽ đọc phản hồi này.</Text>
        <Pressable accessibilityRole="button" onPress={onDone} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Xong</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gửi phản hồi</Text>
      <Text style={styles.description}>
        Kèm theo phiên bản ứng dụng và nền tảng để dễ tái hiện lỗi. Không gửi kèm từ vựng hay dữ liệu học của bạn.
      </Text>
      <View accessibilityRole="radiogroup" style={styles.categoryRow}>
        {feedbackCategories.map((item) => {
          const selected = item.value === category;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={item.value}
              onPress={() => setCategory(item.value)}
              style={[styles.categoryChip, selected && styles.categoryChipSelected]}>
              <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        accessibilityLabel="Nội dung phản hồi"
        maxLength={FEEDBACK_MAX_MESSAGE_LENGTH}
        multiline
        onChangeText={setMessage}
        placeholder="Mô tả lỗi, đề xuất hoặc mục từ cần sửa..."
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        textAlignVertical="top"
        value={message}
      />
      <Text style={styles.counter}>{message.trim().length}/{FEEDBACK_MAX_MESSAGE_LENGTH}</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onDone} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Hủy</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: isSending, disabled: isSending }}
          disabled={isSending}
          onPress={handleSubmit}
          style={[styles.primaryButton, styles.primaryButtonGrow, isSending && styles.primaryButtonBusy]}>
          {isSending ? <ActivityIndicator color={colors.textOnAccent} /> : <Text style={styles.primaryButtonText}>Gửi</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useToken>['colors'], radius: ReturnType<typeof useToken>['radius']) {
  return StyleSheet.create({
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    categoryChip: {
      borderColor: colors.borderDefault,
      borderRadius: radius.full,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
    },
    categoryChipSelected: {
      backgroundColor: colors.accentPrimary,
      borderColor: colors.accentPrimary,
    },
    categoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    categoryTextSelected: {
      color: colors.textOnAccent,
    },
    container: {
      gap: 12,
      width: '100%',
    },
    counter: {
      alignSelf: 'flex-end',
      color: colors.textTertiary,
      fontSize: 12,
      fontWeight: '600',
      marginTop: -8,
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
      minHeight: 128,
      padding: 12,
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
    primaryButtonGrow: {
      flex: 1,
    },
    primaryButtonText: {
      color: colors.textOnAccent,
      fontSize: 14,
      fontWeight: '700',
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: colors.borderDefault,
      borderRadius: radius.md,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 16,
    },
    secondaryButtonText: {
      color: colors.textPrimary,
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
