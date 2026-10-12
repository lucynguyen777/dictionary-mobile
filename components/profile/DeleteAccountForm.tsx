import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import AppButton from '@/components/app/AppButton';
import { signOutAuthSession } from '@/data/authController';
import {
  cancelAccountDeletion,
  getAccountDeletionStatus,
  requestAccountDeletion,
  type AccountDeletionStatus,
} from '@/data/backendProxyClient';
import { clearAllLocalData } from '@/data/clearLocalData';
import { useToken } from '@/hooks/use-token';

const CONFIRM_WORD = 'XÓA';

type Props = {
  onDone: (outcome: { localDataErased: boolean; signedOut: boolean }) => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Cloud account deletion (plan 2.6). What the server does is owner decision D3, set with
// ACCOUNT_DELETION_MODE: off (explained here), immediate, or scheduled with a cancellable grace period.
export default function DeleteAccountForm({ onDone }: Props) {
  const { colors, radius, spacing } = useToken();
  const [status, setStatus] = useState<AccountDeletionStatus | null>(null);
  const [loadError, setLoadError] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [eraseDevice, setEraseDevice] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAccountDeletionStatus()
      .then(setStatus)
      .catch(() => setLoadError('Không kiểm tra được trạng thái tài khoản. Kiểm tra mạng và đăng nhập rồi thử lại.'));
  }, []);

  const textStyle = { color: colors.textSecondary };
  const card = [styles.container, { backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.md }];

  if (loadError) {
    return (
      <View style={card}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Xóa tài khoản</Text>
        <Text accessibilityRole="alert" style={textStyle}>{loadError}</Text>
        <AppButton label="Đóng" onPress={() => onDone({ localDataErased: false, signedOut: false })} />
      </View>
    );
  }
  if (!status) {
    return (
      <View style={card}>
        <ActivityIndicator color={colors.accentPrimary} />
      </View>
    );
  }

  if (!status.mode) {
    return (
      <View style={card}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Xóa tài khoản</Text>
        <Text style={textStyle}>
          Xóa tài khoản cloud chưa được bật trên bản cài đặt này. Dữ liệu trên thiết bị vẫn có thể xóa trong Riêng tư & dữ liệu.
        </Text>
        <AppButton label="Đóng" onPress={() => onDone({ localDataErased: false, signedOut: false })} />
      </View>
    );
  }

  const handleCancelScheduled = async () => {
    setIsBusy(true);
    setError('');
    try {
      await cancelAccountDeletion();
      setStatus({ ...status, scheduled: null });
    } catch {
      setError('Không hủy được yêu cầu xóa. Thử lại sau.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText.trim().toLocaleUpperCase('vi-VN') !== CONFIRM_WORD) return;
    setIsBusy(true);
    setError('');
    try {
      const result = await requestAccountDeletion();
      if (result.status === 'scheduled') {
        setStatus({ ...status, scheduled: { purgeAfter: result.purgeAfter } });
        setIsBusy(false);
        return;
      }
      if (eraseDevice) await clearAllLocalData();
      await signOutAuthSession().catch(() => undefined);
      onDone({ localDataErased: eraseDevice, signedOut: true });
    } catch {
      setError('Không xóa được tài khoản lúc này. Thử lại sau.');
      setIsBusy(false);
    }
  };

  if (status.scheduled) {
    return (
      <View style={card}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Tài khoản đang chờ xóa</Text>
        <Text style={textStyle}>
          Tài khoản và dữ liệu cloud sẽ bị xóa vĩnh viễn vào {formatDate(status.scheduled.purgeAfter)}. Trước ngày đó bạn có thể hủy yêu cầu.
        </Text>
        {error ? <Text accessibilityRole="alert" style={{ color: colors.accentError }}>{error}</Text> : null}
        <AppButton disabled={isBusy} icon="arrow-undo-outline" label="Hủy yêu cầu xóa" onPress={handleCancelScheduled} variant="primary" />
        <AppButton label="Đóng" onPress={() => onDone({ localDataErased: false, signedOut: false })} variant="ghost" />
      </View>
    );
  }

  const isConfirmed = confirmText.trim().toLocaleUpperCase('vi-VN') === CONFIRM_WORD;

  return (
    <View style={card}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Xóa tài khoản</Text>
      <Text style={textStyle}>
        {status.mode === 'immediate'
          ? 'Tài khoản cloud và mọi dữ liệu đã đồng bộ (từ, flashcard, glossary, câu mẫu, agent) sẽ bị xóa vĩnh viễn ngay.'
          : `Tài khoản cloud và mọi dữ liệu đã đồng bộ sẽ bị xóa vĩnh viễn sau ${status.graceDays} ngày. Trong thời gian đó bạn có thể hủy.`}
      </Text>
      {status.mode === 'immediate' ? (
        <View style={styles.row}>
          <Text style={[styles.rowText, { color: colors.textPrimary }]}>Xóa cả dữ liệu trên thiết bị này</Text>
          <Switch accessibilityLabel="Xóa cả dữ liệu trên thiết bị này" onValueChange={setEraseDevice} value={eraseDevice} />
        </View>
      ) : null}
      <TextInput
        accessibilityLabel={`Gõ ${CONFIRM_WORD} để xác nhận`}
        autoCapitalize="characters"
        onChangeText={setConfirmText}
        placeholder={`Gõ ${CONFIRM_WORD} để xác nhận`}
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, { borderColor: colors.borderDefault, borderRadius: radius.sm, color: colors.textPrimary }]}
        value={confirmText}
      />
      {error ? <Text accessibilityRole="alert" style={{ color: colors.accentError }}>{error}</Text> : null}
      <AppButton
        disabled={!isConfirmed || isBusy}
        icon="trash-outline"
        label={status.mode === 'immediate' ? 'Xóa tài khoản vĩnh viễn' : 'Yêu cầu xóa tài khoản'}
        onPress={handleDelete}
        variant="primary"
      />
      <AppButton label="Hủy" onPress={() => onDone({ localDataErased: false, signedOut: false })} variant="ghost" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
});
