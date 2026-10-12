import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { FutureFeatureNotice } from '@/components/app/FutureFeature';
import { type AuthSessionSnapshot } from '@/data/authSession';

import { styles } from '@/components/profile/styles';

function getAuthStatusCopy(authSession: AuthSessionSnapshot) {
  switch (authSession.status) {
    case 'loading':
      return {
        badge: 'Đang tải',
        description: 'Đang đọc phiên cloud được lưu an toàn.',
        title: 'Đang kiểm tra phiên cloud',
      };
    case 'unconfigured':
      return {
        badge: 'Local',
        description: 'Đăng nhập cloud chưa sẵn sàng trên bản cài đặt này. Hồ sơ local vẫn hoạt động.',
        title: 'Chưa cấu hình đăng nhập',
      };
    case 'unauthenticated':
      return {
        badge: 'Chưa login',
        description: 'Bạn có thể dùng hồ sơ local. Biểu mẫu đăng nhập cloud chưa khả dụng.',
        title: 'Chưa có phiên cloud',
      };
    case 'needs_verification':
      return {
        badge: 'Cần xác minh',
        description: authSession.email ? `Kiểm tra email ${authSession.email} để hoàn tất xác minh.` : 'Cần xác minh email.',
        title: 'Tài khoản cần xác minh',
      };
    case 'authenticated':
      return {
        badge: 'Cloud',
        description: authSession.emailVerified ? 'Email cloud đã xác minh.' : 'Phiên cloud tồn tại nhưng email chưa xác minh.',
        title: authSession.email ?? 'Đã đăng nhập',
      };
    case 'error':
      return {
        badge: 'Lỗi',
        description: authSession.errorMessage ?? 'Không thể đọc trạng thái đăng nhập.',
        title: 'Lỗi phiên cloud',
      };
  }
}

export function AuthStatusPanel({
  authSession,
  onRefreshPress,
  onSignOutPress,
}: {
  authSession: AuthSessionSnapshot;
  onRefreshPress: () => void;
  onSignOutPress: () => void;
}) {
  const copy = getAuthStatusCopy(authSession);
  const canSignOut = authSession.status === 'authenticated' || authSession.status === 'needs_verification';
  const isUnconfigured = authSession.status === 'unconfigured';
  const disabled = authSession.status === 'loading' || (isUnconfigured && !canSignOut);

  return (
    <View style={styles.authStatusPanel}>
      {isUnconfigured && (
        <FutureFeatureNotice reason="Đăng nhập, xác minh email, đồng bộ cloud và backup mã hóa sẽ được cập nhật trong phiên bản sau. Bản deploy hiện tại dùng hồ sơ local." />
      )}
      <View style={styles.authStatusHeader}>
        <View style={styles.authStatusIcon}>
          <Ionicons name={canSignOut ? 'cloud-done-outline' : 'cloud-offline-outline'} size={17} color="#0075DE" />
        </View>
        <View style={styles.authStatusCopy}>
          <Text style={styles.authStatusTitle} numberOfLines={1}>{copy.title}</Text>
          <Text style={styles.authStatusText} numberOfLines={2}>{copy.description}</Text>
        </View>
        <Text style={styles.authStatusBadge} numberOfLines={1}>{copy.badge}</Text>
      </View>
      <View style={styles.authStatusActions}>
        {canSignOut ? (
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={onSignOutPress}
            style={({ pressed }) => [
              styles.authStatusButton,
              styles.authStatusButtonSecondary,
              pressed && styles.authStatusButtonPressed,
              disabled && styles.authStatusButtonDisabled,
            ]}>
            <Text style={[styles.authStatusButtonText, styles.authStatusButtonTextSecondary]} numberOfLines={1}>
              Đăng xuất cloud
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel="Làm mới trạng thái đăng nhập"
          accessibilityRole="button"
          onPress={onRefreshPress}
          style={({ pressed }) => [styles.authStatusRefreshButton, pressed && styles.authStatusButtonPressed]}>
          <Ionicons name="refresh" size={16} color="#0075DE" />
        </Pressable>
      </View>
    </View>
  );
}

export function AuthModal({
  authBusyAction,
  authEmail,
  authPassword,
  authSession,
  mode,
  onChangeEmail,
  onChangeMode,
  onChangePassword,
  onClose,
  onPasswordRecovery,
  onSignIn,
  onSignUp,
  visible,
}: {
  authBusyAction: 'sign-in' | 'sign-up' | 'recovery' | null;
  authEmail: string;
  authPassword: string;
  authSession: AuthSessionSnapshot;
  mode: 'sign-in' | 'sign-up';
  onChangeEmail: (value: string) => void;
  onChangeMode: (value: 'sign-in' | 'sign-up') => void;
  onChangePassword: (value: string) => void;
  onClose: () => void;
  onPasswordRecovery: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  visible: boolean;
}) {
  const isBusy = Boolean(authBusyAction);
  const isUnconfigured = authSession.status === 'unconfigured';
  const submit = mode === 'sign-in' ? onSignIn : onSignUp;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.authModalBackdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.authModalCard}>
          <View style={styles.authModalHeader}>
            <View style={styles.authModalHeaderCopy}>
              <Text style={styles.authModalTitle}>{mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'}</Text>
              <Text style={styles.authModalSubtitle}>
                {mode === 'sign-in'
                  ? 'Tiếp tục phiên cloud của bạn. Dữ liệu local vẫn được giữ nguyên.'
                  : 'Tạo tài khoản để dùng đồng bộ cloud và các tính năng trực tuyến.'}
              </Text>
            </View>
            <Pressable accessibilityLabel="Đóng" accessibilityRole="button" onPress={onClose} style={styles.authModalClose}>
              <Ionicons name="close" size={20} color="#475569" />
            </Pressable>
          </View>

          <View style={styles.authModeTabs}>
            {(['sign-in', 'sign-up'] as const).map((value) => (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === value }}
                key={value}
                onPress={() => onChangeMode(value)}
                style={[styles.authModeTab, mode === value && styles.authModeTabActive]}>
                <Text style={[styles.authModeTabText, mode === value && styles.authModeTabTextActive]}>
                  {value === 'sign-in' ? 'Đăng nhập' : 'Đăng ký'}
                </Text>
              </Pressable>
            ))}
          </View>

          {isUnconfigured ? (
            <FutureFeatureNotice reason="Cần cấu hình Supabase/Auth trên bản deploy này trước khi đăng nhập." />
          ) : null}
          <TextInput
            autoCapitalize="none"
            editable={!isBusy && !isUnconfigured}
            keyboardType="email-address"
            onChangeText={onChangeEmail}
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            style={[styles.profileInput, (isBusy || isUnconfigured) && styles.profileInputDisabled]}
            value={authEmail}
          />
          <TextInput
            editable={!isBusy && !isUnconfigured}
            onChangeText={onChangePassword}
            onSubmitEditing={submit}
            placeholder="Mật khẩu"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            style={[styles.profileInput, styles.authPasswordInput, (isBusy || isUnconfigured) && styles.profileInputDisabled]}
            value={authPassword}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isBusy || isUnconfigured}
            onPress={submit}
            style={({ pressed }) => [styles.authModalSubmit, pressed && styles.authStatusButtonPressed, (isBusy || isUnconfigured) && styles.authStatusButtonDisabled]}>
            <Ionicons name={mode === 'sign-in' ? 'log-in-outline' : 'person-add-outline'} size={17} color="#FFFFFF" />
            <Text style={styles.authFormButtonText}>
              {authBusyAction === mode ? (mode === 'sign-in' ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...') : (mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản')}
            </Text>
          </Pressable>
          {mode === 'sign-in' ? (
            <Pressable
              accessibilityRole="button"
              disabled={isBusy || isUnconfigured}
              onPress={onPasswordRecovery}
              style={({ pressed }) => [styles.authRecoveryButton, pressed && styles.authStatusButtonPressed, (isBusy || isUnconfigured) && styles.authStatusButtonDisabled]}>
              <Text style={styles.authRecoveryButtonText}>
                {authBusyAction === 'recovery' ? 'Đang gửi email...' : 'Quên mật khẩu?'}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
