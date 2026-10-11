import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { loadCurrentAuthSession, sendPasswordRecoveryEmail, signInAuthSession, signOutAuthSession, signUpAuthSession } from '@/data/authController';
import type { AuthSessionSnapshot } from '@/data/authSession';

type Options = {
  authSession: AuthSessionSnapshot;
  // Shown while a refresh is in flight.
  loadingSession: AuthSessionSnapshot;
  setAuthSession: (session: AuthSessionSnapshot) => void;
};

// Cloud sign-in, sign-up, password recovery and sign-out for the Profile screen. Local data is never
// touched by any of these.
export function useAuthForm({ authSession, loadingSession, setAuthSession }: Options) {
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusyAction, setAuthBusyAction] = useState<'sign-in' | 'sign-up' | 'recovery' | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  // Suggests an email (session or profile) without overwriting what the user typed.
  const prefillAuthEmail = useCallback((email: string) => setAuthEmail((current) => current || email), []);

  const handleRefreshAuthSession = async () => {
    setAuthSession(loadingSession);
    const nextAuthSession = await loadCurrentAuthSession();
    setAuthSession(nextAuthSession);
  };

  const handleAuthEntry = () => {
    if (authSession.status === 'unconfigured') {
      Alert.alert(
        'Chưa cấu hình đăng nhập',
        'Đăng nhập cloud chưa sẵn sàng trên bản cài đặt này. Bạn vẫn có thể dùng hồ sơ local.',
        [{ text: 'OK' }]
      );
      return;
    }

    setAuthModalMode('sign-in');
    setAuthModalOpen(true);
  };

  const validateAuthEmail = () => {
    const email = authEmail.trim();

    if (!email) {
      Alert.alert('Thiếu email', 'Nhập email để dùng đăng nhập cloud.', [{ text: 'OK' }]);
      return null;
    }

    return email;
  };

  const validateAuthCredentials = () => {
    const email = validateAuthEmail();

    if (!email) return null;

    if (!authPassword) {
      Alert.alert('Thiếu mật khẩu', 'Nhập mật khẩu để tiếp tục.', [{ text: 'OK' }]);
      return null;
    }

    return {
      email,
      password: authPassword,
    };
  };

  const handleSignInAuth = async () => {
    const credentials = validateAuthCredentials();
    if (!credentials) return;

    setAuthBusyAction('sign-in');
    const nextAuthSession = await signInAuthSession(credentials);
    setAuthBusyAction(null);
    setAuthSession(nextAuthSession);

    if (nextAuthSession.status === 'error' || nextAuthSession.status === 'unconfigured') {
      Alert.alert('Chưa đăng nhập', nextAuthSession.errorMessage ?? 'Không thể đăng nhập cloud.', [{ text: 'OK' }]);
      return;
    }

    setAuthPassword('');
    setAuthModalOpen(false);
    Alert.alert('Đã đăng nhập', 'Phiên cloud đã sẵn sàng. Dữ liệu local vẫn được giữ nguyên.', [{ text: 'OK' }]);
  };

  const handleSignUpAuth = async () => {
    const credentials = validateAuthCredentials();
    if (!credentials) return;

    setAuthBusyAction('sign-up');
    const nextAuthSession = await signUpAuthSession(credentials);
    setAuthBusyAction(null);
    setAuthSession(nextAuthSession);

    if (nextAuthSession.status === 'error' || nextAuthSession.status === 'unconfigured') {
      Alert.alert('Chưa tạo tài khoản', nextAuthSession.errorMessage ?? 'Không thể tạo tài khoản cloud.', [{ text: 'OK' }]);
      return;
    }

    setAuthPassword('');
    setAuthModalOpen(false);
    Alert.alert(
      nextAuthSession.status === 'needs_verification' ? 'Kiểm tra email' : 'Tài khoản đã sẵn sàng',
      nextAuthSession.status === 'needs_verification'
        ? 'Mở email xác minh để hoàn tất đăng ký cloud.'
        : 'Phiên cloud đã sẵn sàng. Dữ liệu local vẫn được giữ nguyên.',
      [{ text: 'OK' }]
    );
  };

  const handlePasswordRecovery = async () => {
    const email = validateAuthEmail();
    if (!email) return;

    setAuthBusyAction('recovery');
    const nextAuthSession = await sendPasswordRecoveryEmail(email);
    setAuthBusyAction(null);
    setAuthSession(nextAuthSession);

    if (nextAuthSession.status === 'error' || nextAuthSession.status === 'unconfigured') {
      Alert.alert('Chưa gửi được email', nextAuthSession.errorMessage ?? 'Không thể gửi email khôi phục.', [{ text: 'OK' }]);
      return;
    }

    Alert.alert('Đã gửi email', 'Kiểm tra hộp thư để tiếp tục khôi phục mật khẩu.', [{ text: 'OK' }]);
  };

  const handleSignOutAuth = () => {
    if (authSession.status !== 'authenticated' && authSession.status !== 'needs_verification') {
      Alert.alert('Đăng xuất', 'Chưa có phiên đăng nhập cloud để đăng xuất. Dữ liệu local vẫn giữ nguyên.', [{ text: 'OK' }]);
      return;
    }

    Alert.alert('Đăng xuất', 'Đăng xuất khỏi phiên cloud? Dữ liệu local trên thiết bị sẽ không bị xóa.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        onPress: async () => {
          const nextAuthSession = await signOutAuthSession();
          setAuthSession(nextAuthSession);
          Alert.alert(
            nextAuthSession.status === 'error' ? 'Lỗi đăng xuất' : 'Đã đăng xuất',
            nextAuthSession.status === 'error'
              ? nextAuthSession.errorMessage ?? 'Không thể đăng xuất phiên cloud.'
              : 'Phiên cloud đã được xóa. Hồ sơ và thư viện local vẫn được giữ nguyên.'
          );
        },
      },
    ]);
  };

  return {
    authModalProps: {
      authBusyAction,
      authEmail,
      authPassword,
      authSession,
      mode: authModalMode,
      onChangeEmail: setAuthEmail,
      onChangeMode: setAuthModalMode,
      onChangePassword: setAuthPassword,
      onClose: () => setAuthModalOpen(false),
      onPasswordRecovery: handlePasswordRecovery,
      onSignIn: handleSignInAuth,
      onSignUp: handleSignUpAuth,
      visible: authModalOpen,
    },
    handleAuthEntry,
    handleRefreshAuthSession,
    handleSignOutAuth,
    prefillAuthEmail,
  };
}
