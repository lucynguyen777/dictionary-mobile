import Ionicons from '@expo/vector-icons/Ionicons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, AppState, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '@/components/app/Screen';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import FeedbackForm from '@/components/profile/FeedbackForm';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { APP_RELEASE, getAppReleaseSummary } from '@/constants/appRelease';
import { triggerManualSync } from '@/data/supabaseSyncLifecycle';
import { ActivityState, getActivitySummary, getDefaultActivityState, loadActivityState } from '@/data/activityStore';
import { loadCurrentAuthSession, sendPasswordRecoveryEmail, signInAuthSession, signOutAuthSession, signUpAuthSession, subscribeToAuthSessionChanges, syncAuthAutoRefreshForAppState } from '@/data/authController';
import { type AuthSessionSnapshot } from '@/data/authSession';
import { exportAllLocalData } from '@/data/exportAllData';
import { languageOptions } from '@/data/languages';
import { LibraryState, clearLibraryState, getDefaultLibraryState, loadLibraryState } from '@/data/libraryStore';
import { deleteInstalledOfflineDictionaryPack, installOfflineDictionaryPackFromSource } from '@/data/offlineDictionaryPackActions';
import { OfflinePackInstallState, clearOfflinePackInstallState, formatOfflinePackInstallStatus, formatOfflinePackProgress, getDefaultOfflinePackInstallState, getOfflinePackInstallRecord, getOfflinePackInstallSummary, loadOfflinePackInstallState } from '@/data/offlineDictionaryPackStore';
import { formatPackSizeRange, formatPackStatus, formatPackTitle, getOfflinePackRuntimeGate, getOfflinePackSummary, offlineDictionaryPacks } from '@/data/offlineDictionaryPacks';
import { NotificationPreferences, UserProfile, clearUserProfile, getDefaultProfile, loadUserProfile, saveUserProfile } from '@/data/profileStore';
import { ReaderState, clearReaderState, getDefaultReaderState, loadReaderState } from '@/data/readerStore';
import { useToken } from '@/hooks/use-token';

import { buildSavedWordChartData, buildStreakYearHeatmap, getActiveDaysForYear, getStreakYearOptions, getWordChartPeriodLabel, wordChartRanges, type WordChartRange } from '@/data/profileCharts';
import { NotificationPreferenceRow, ProfileInput, SidebarActionRow, SidebarSection, sidebarNavItems, type SidebarSectionKey } from '@/components/profile/SettingsDrawerParts';
import { AuthModal, AuthStatusPanel } from '@/components/profile/AuthPanels';
import { DarkDataStat, DataStat, ProfileMetric, formatMetricNumber } from '@/components/profile/Metrics';
import { styles } from '@/components/profile/styles';

const defaultAvatarUri = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop';

const legalLinks = [
  {
    icon: 'document-text-outline' as const,
    message: 'Điều khoản sử dụng sẽ được hoàn thiện trước khi phát hành công khai. Hiện app đang chạy local-first.',
    title: 'Điều khoản',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    message: 'Dictionary Mobile hiện lưu dữ liệu học tập trên thiết bị. Đồng bộ cloud và chia sẻ dữ liệu sẽ cần xác nhận riêng.',
    title: 'Chính sách riêng tư',
  },
  {
    icon: 'information-circle-outline' as const,
    message: 'Ứng dụng dùng Expo, React Native và các nguồn dữ liệu/adapter từ điển được tách theo giấy phép tương ứng. Offline dictionary pack sẽ ghi rõ nguồn Wiktionary/Kaikki và giấy phép CC BY-SA/GFDL trước khi cho tải hoặc hiển thị dữ liệu.',
    title: 'Ghi nhận',
  },
];

const initialAuthSession: AuthSessionSnapshot = {
  status: 'loading',
  userId: null,
  email: null,
  emailVerified: false,
  phone: null,
  lastAuthEvent: null,
};

export default function ProfileScreen() {
  const { colors, radius, shadows } = useToken();
  const insets = useSafeAreaInsets();
  const themed = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.borderDefault,
        },
        guestAvatar: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.focusRing,
        },
        hero: {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.borderDefault,
          borderRadius: radius.lg,
          ...shadows.sm,
        },
        iconButton: {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.borderDefault,
        },
        mutedText: {
          color: colors.textSecondary,
        },
        primaryText: {
          color: colors.textPrimary,
        },
        softBadge: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.focusRing,
        },
        warningBadge: {
          backgroundColor: colors.statusWarning,
          borderColor: colors.accentWarning,
        },
      }),
    [colors, radius.lg, shadows.sm]
  );
  const [profile, setProfile] = useState<UserProfile>(getDefaultProfile());
  const [activityState, setActivityState] = useState<ActivityState>(getDefaultActivityState());
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [readerState, setReaderState] = useState<ReaderState>(getDefaultReaderState());
  const [offlinePackInstallState, setOfflinePackInstallState] = useState<OfflinePackInstallState>(
    getDefaultOfflinePackInstallState()
  );
  const [saveMessage, setSaveMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSection, setSidebarSection] = useState<SidebarSectionKey | null>(null);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [offlinePackBusyId, setOfflinePackBusyId] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<AuthSessionSnapshot>(initialAuthSession);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusyAction, setAuthBusyAction] = useState<'sign-in' | 'sign-up' | 'recovery' | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [wordChartRange, setWordChartRange] = useState<WordChartRange>('day');
  const [selectedStreakYear, setSelectedStreakYear] = useState(new Date().getFullYear());
  const [streakYearMenuOpen, setStreakYearMenuOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      setAuthSession(initialAuthSession);

      Promise.all([
        loadUserProfile(),
        loadActivityState(),
        loadLibraryState(),
        loadReaderState(),
        loadOfflinePackInstallState(),
        loadCurrentAuthSession(),
      ]).then(
        ([nextProfile, nextActivityState, nextLibraryState, nextReaderState, nextOfflinePackInstallState, nextAuthSession]) => {
          if (!isMounted) return;

          setProfile(nextProfile);
          setActivityState(nextActivityState);
          setLibraryState(nextLibraryState);
          setReaderState(nextReaderState);
          setOfflinePackInstallState(nextOfflinePackInstallState);
          setAuthSession(nextAuthSession);
          setAuthEmail((current) => current || nextAuthSession.email || nextProfile.email || '');
        }
      );

      return () => {
        isMounted = false;
      };
    }, [])
  );

  React.useEffect(() => {
    const unsubscribeAuth = subscribeToAuthSessionChanges(setAuthSession);
    const applyAppState = (nextState: string) => {
      const nextAuthSession = syncAuthAutoRefreshForAppState(nextState);

      if (nextAuthSession) {
        setAuthSession(nextAuthSession);
      }
    };
    const appStateSubscription = AppState.addEventListener('change', applyAppState);

    applyAppState(AppState.currentState);

    return () => {
      unsubscribeAuth();
      appStateSubscription.remove();
    };
  }, []);

  const updateProfile = <Key extends keyof UserProfile>(key: Key, value: UserProfile[Key]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaveMessage('');
  };

  const handleSaveProfile = () => {
    saveUserProfile(profile).then((nextProfile) => {
      setProfile(nextProfile);
      setSaveMessage('Hồ sơ đã lưu.');
      Alert.alert('Đã lưu hồ sơ', 'Hồ sơ đã được lưu trên thiết bị này.');
    });
  };

  const handleRefreshAuthSession = async () => {
    setAuthSession(initialAuthSession);
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

  const handleExportAllData = async () => {
    const result = await exportAllLocalData();
    Alert.alert(result.ok ? 'Đã xuất dữ liệu' : 'Lỗi xuất dữ liệu', result.message);
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Xóa tất cả dữ liệu',
      'Hành động này sẽ xóa toàn bộ dữ liệu local trên thiết bị (từ đã lưu, flashcard, lịch sử tra cứu, hồ sơ). Không thể hoàn tác. Bạn có chắc không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            await clearLibraryState();
            await clearUserProfile();
            await clearReaderState();
            await clearOfflinePackInstallState();
            setLibraryState(getDefaultLibraryState());
            setOfflinePackInstallState(getDefaultOfflinePackInstallState());
            setProfile(getDefaultProfile());
            setReaderState(getDefaultReaderState());
            setSaveMessage('');
            Alert.alert('Đã xóa', 'Tất cả dữ liệu local đã được xóa.');
          },
        },
      ]
    );
  };

  const handleInstallOfflinePack = async (pack: (typeof offlineDictionaryPacks)[number]) => {
    const runtimeGate = getOfflinePackRuntimeGate(pack);

    if (!runtimeGate.canDownload || !pack.downloadSource) {
      Alert.alert('Chưa thể tải pack', runtimeGate.detail);
      return;
    }

    setOfflinePackBusyId(pack.id);

    try {
      const result = await installOfflineDictionaryPackFromSource({
        pack,
        state: offlinePackInstallState,
      });

      setOfflinePackInstallState(result.state);
      Alert.alert(
        result.ok ? 'Đã cài pack offline' : 'Lỗi cài pack offline',
        result.ok ? `Đã cài ${result.entryCount} mục từ vào SQLite.` : result.errorMessage
      );
    } finally {
      setOfflinePackBusyId(null);
    }
  };

  const handleDeleteOfflinePack = (pack: (typeof offlineDictionaryPacks)[number]) => {
    Alert.alert('Xóa pack offline', 'Xóa SQLite pack và trạng thái cài đặt local trên thiết bị này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa pack',
        style: 'destructive',
        onPress: async () => {
          setOfflinePackBusyId(pack.id);

          try {
            const nextState = await deleteInstalledOfflineDictionaryPack({
              pack,
              state: offlinePackInstallState,
            });
            setOfflinePackInstallState(nextState);
            Alert.alert('Đã xóa pack', 'Pack offline đã được xóa khỏi thiết bị.');
          } finally {
            setOfflinePackBusyId(null);
          }
        },
      },
    ]);
  };

  const handleToggleAppLock = async (nextValue: boolean) => {
    try {
      if (nextValue) {
        const [hasHardware, isEnrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);

        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            'Chưa thể bật khóa ứng dụng',
            'Thiết bị này chưa hỗ trợ hoặc chưa thiết lập sinh trắc học/mã khóa thiết bị.'
          );
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          cancelLabel: 'Hủy',
          disableDeviceFallback: false,
          fallbackLabel: 'Dùng mã thiết bị',
          promptMessage: 'Bật khóa Dictionary Mobile',
        });

        if (!result.success) {
          Alert.alert('Chưa bật khóa', 'Bạn cần xác thực thành công trước khi bật khóa ứng dụng.');
          return;
        }
      }

      const nextProfile = await saveUserProfile({ ...profile, appLockEnabled: nextValue });
      setProfile(nextProfile);
      setSaveMessage(nextValue ? 'Đã bật khóa ứng dụng trên thiết bị này.' : 'Đã tắt khóa ứng dụng.');
    } catch {
      Alert.alert('Lỗi khóa ứng dụng', 'Không thể thay đổi thiết lập khóa ứng dụng lúc này.');
    }
  };

  const handleToggleCloudSync = async (nextValue: boolean) => {
    try {
      const nextProfile = await saveUserProfile({ ...profile, cloudSyncEnabled: nextValue });
      setProfile(nextProfile);
      setSaveMessage(nextValue ? 'Đã bật đồng bộ cloud (beta). Ứng dụng sẽ tự đồng bộ khi mở lại và sau khi bạn chỉnh sửa.' : 'Đã tắt đồng bộ đám mây.');
    } catch {
      Alert.alert('Lỗi đồng bộ', 'Không thể thay đổi thiết lập đồng bộ lúc này.');
    }
  };

  const handleManualCloudSync = async () => {
    const result = await triggerManualSync();
    if (result.status === 'synced') {
      setSaveMessage('Đã đồng bộ cloud.');
    } else if (result.status === 'idle') {
      setSaveMessage('Bật đồng bộ cloud (beta) trước khi đồng bộ.');
    } else if (result.status === 'signed-out') {
      Alert.alert('Cần đăng nhập', 'Đăng nhập cloud trước khi đồng bộ dữ liệu.');
    } else if (result.status === 'unconfigured') {
      Alert.alert('Cloud chưa cấu hình', 'Cần cấu hình Supabase production trước khi đồng bộ.');
    } else if (result.status === 'offline') {
      Alert.alert('Ngoại tuyến', 'Kiểm tra mạng rồi thử đồng bộ lại.');
    } else {
      Alert.alert('Lỗi đồng bộ', 'Không thể đồng bộ cloud lúc này.');
    }
  };

  const handleUpdateNotificationPreference = async <Key extends keyof NotificationPreferences>(
    key: Key,
    value: NotificationPreferences[Key]
  ) => {
    const nextProfile = await saveUserProfile({
      ...profile,
      notificationPreferences: {
        ...profile.notificationPreferences,
        [key]: value,
      },
    });

    setProfile(nextProfile);
    setSaveMessage('Đã lưu tùy chọn thông báo local.');
  };

  const handleChangeNotificationTime = (value: string) => {
    updateProfile('notificationPreferences', {
      ...profile.notificationPreferences,
      reminderTime: value,
    });
  };

  const handleCommitNotificationTime = () => {
    handleUpdateNotificationPreference('reminderTime', profile.notificationPreferences.reminderTime);
  };

  const nativeLanguage = languageOptions.find((language) => language.code === profile.nativeLanguage);
  const learningLanguage = languageOptions.find((language) => language.code === profile.learningLanguage);
  const offlinePackRuntimeOptions = { supportsSqliteRuntime: Platform.OS !== 'web' };
  const offlinePackSummary = getOfflinePackSummary(offlineDictionaryPacks, offlinePackRuntimeOptions);
  const offlinePackInstallSummary = getOfflinePackInstallSummary(offlinePackInstallState);
  const isSignedIn = authSession.status === 'authenticated' || authSession.status === 'needs_verification';
  const isDefaultGuestProfile =
    !isSignedIn &&
    profile.displayName === getDefaultProfile().displayName &&
    !profile.email &&
    !profile.username &&
    !profile.avatarUrl;
  const avatarUri = profile.avatarUrl || (isDefaultGuestProfile ? '' : defaultAvatarUri);
  const activeSidebarItem = sidebarNavItems.find((item) => item.key === sidebarSection);
  const dashboardNow = new Date();
  const activitySummary = getActivitySummary(activityState, dashboardNow);
  const dueFlashcards = libraryState.flashcards.filter((card) => new Date(card.dueDate) <= dashboardNow || card.reviewState !== 'reviewed').length;
  const wordChartData = buildSavedWordChartData(libraryState.savedWords, wordChartRange, dashboardNow);
  const wordChartPrimaryValue = wordChartRange === 'day' ? wordChartData.totalValue : wordChartData.averageValue;
  const wordChartMetricLabel = wordChartRange === 'day' ? 'TOTAL' : 'TRUNG BÌNH';
  const wordChartPeriodLabel = getWordChartPeriodLabel(wordChartRange, dashboardNow);
  const currentYear = dashboardNow.getFullYear();
  const streakYearOptions = getStreakYearOptions(activityState, currentYear);
  const displayedStreakYear = streakYearOptions.includes(selectedStreakYear) ? selectedStreakYear : currentYear;
  const selectedYearActiveDays = getActiveDaysForYear(activityState, displayedStreakYear);
  const streakYearHeatmap = buildStreakYearHeatmap(activityState.activeDays, displayedStreakYear);

  const handleDeleteLocalProfile = () => {
    Alert.alert('Xóa hồ sơ local', 'Hành động này sẽ xóa hồ sơ local trên thiết bị. Bạn có muốn tiếp tục?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa hồ sơ',
        style: 'destructive',
        onPress: async () => {
          await clearUserProfile();
          setProfile(getDefaultProfile());
          setSaveMessage('Hồ sơ đã xóa.');
          setSidebarOpen(false);
          Alert.alert('Đã xóa hồ sơ', 'Hồ sơ local đã được xóa.');
        },
      },
    ]);
  };

  const openSidebarSection = (section: SidebarSectionKey | null = null) => {
    setSidebarSection(section);
    setSidebarOpen(true);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileHero, themed.hero]}>
          <View style={styles.heroTopRow}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.heroAvatar} />
            ) : (
              <View style={[styles.heroGuestAvatar, themed.guestAvatar]}>
                <Ionicons name="person-outline" size={26} color={colors.accentPrimary} />
              </View>
            )}
            <View style={styles.heroIdentity}>
              <Text style={[styles.heroEyebrow, themed.mutedText]}>Hồ sơ học tập</Text>
              <Text style={[styles.heroName, themed.primaryText]} numberOfLines={1}>{profile.displayName}</Text>
              <Text style={[styles.heroMeta, themed.mutedText]} numberOfLines={2}>
                {isDefaultGuestProfile
                  ? 'Chưa thiết lập hồ sơ · dữ liệu học tập chỉ lưu local'
                  : `${nativeLanguage?.label ?? profile.nativeLanguage} → ${learningLanguage?.label ?? profile.learningLanguage} · ${profile.proficiencyLevel}`}
              </Text>
              <View style={[styles.heroAuthBadge, themed.softBadge]}>
                <Ionicons
                  name={authSession.status === 'authenticated' || authSession.status === 'needs_verification' ? 'cloud-done-outline' : 'phone-portrait-outline'}
                  size={13}
                  color={colors.accentPrimary}
                />
                <Text style={[styles.heroAuthBadgeText, { color: colors.accentPrimary }]}>
                  {authSession.status === 'authenticated' || authSession.status === 'needs_verification'
                    ? 'Signed in · cloud actions available'
                    : 'Guest local mode · lookup, Reader, Library, Flashcards vẫn dùng được'}
                </Text>
              </View>
            </View>
            <View style={styles.heroActionRow}>
              {!isSignedIn ? (
                <Pressable
                  accessibilityLabel="Đăng nhập hoặc đăng ký"
                  accessibilityRole="button"
                  onPress={handleAuthEntry}
                  style={({ pressed }) => [styles.heroAuthButton, pressed && styles.settingsButtonPressed]}>
                  <Ionicons name="log-in-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.heroAuthButtonText}>Đăng nhập</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityLabel="Mở cài đặt"
                accessibilityRole="button"
                onPress={() => openSidebarSection()}
                style={({ pressed }) => [styles.heroIconButton, themed.iconButton, pressed && styles.settingsButtonPressed]}>
                <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {!isDefaultGuestProfile ? (
            <View style={[styles.heroGoalRow, themed.warningBadge]}>
              <View style={styles.goalBadge}>
                <Ionicons name="flame-outline" size={16} color="#EA580C" />
                <Text style={styles.goalBadgeText} numberOfLines={1}>{profile.dailyGoal}</Text>
              </View>
              <Text style={styles.goalText} numberOfLines={2}>{profile.learningGoal}</Text>
            </View>
          ) : (
            <View style={[styles.guestSetupNotice, themed.softBadge]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.accentPrimary} />
              <Text style={[styles.guestSetupText, { color: colors.accentPrimary }]}>Khách chưa có hồ sơ cá nhân. Bạn vẫn có thể học local, hoặc mở cài đặt để đăng nhập/thiết lập hồ sơ.</Text>
            </View>
          )}

          <View style={styles.heroMetricRow}>
            <ProfileMetric value={libraryState.savedWords.length} label="Từ đã lưu" />
            <ProfileMetric value={dueFlashcards} label="Cần ôn" />
            <ProfileMetric value={activitySummary.currentStreak} label="Streak" />
          </View>
          {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}
        </View>

        <View style={[styles.card, themed.card]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderCopy}>
              <Text style={[styles.cardTitle, themed.primaryText]}>Tổng quan học tập</Text>
              <Text style={[styles.cardSubtitle, themed.mutedText]}>Các chỉ số chính từ dữ liệu local trên thiết bị.</Text>
            </View>
          </View>
          <View style={styles.compactDataRow}>
            <DataStat label="Bộ từ" value={libraryState.folders.length} />
            <DataStat label="Từ" value={libraryState.savedWords.length} />
            <DataStat label="Thẻ" value={libraryState.flashcards.length} />
            <DataStat label="Reader" value={readerState.documents.length} />
          </View>
        </View>

        <View style={[styles.card, styles.metricsCardDark]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.metricsCardTitle}>Từ mới thêm vào tủ từ</Text>
              <Text style={styles.metricsCardSubtitle}>Tốc độ lưu từ theo ngày, tuần, tháng hoặc năm.</Text>
            </View>
          </View>
          <View style={styles.segmentedControl}>
            {wordChartRanges.map((range) => (
              <TouchableOpacity
                key={range.value}
                activeOpacity={0.82}
                onPress={() => setWordChartRange(range.value)}
                style={[styles.segmentButton, wordChartRange === range.value && styles.segmentButtonActive]}>
                <Text style={[styles.segmentButtonText, wordChartRange === range.value && styles.segmentButtonTextActive]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.metricsHeaderBlock}>
            <Text style={styles.metricsOverline}>{wordChartMetricLabel}</Text>
            <Text style={styles.metricsPrimaryValue}>{formatMetricNumber(wordChartPrimaryValue)}</Text>
            <Text style={styles.metricsPeriod}>{wordChartPeriodLabel}</Text>
          </View>
          <View style={styles.fitnessChartFrame}>
            <View pointerEvents="none" style={styles.chartGridOverlay}>
              <View style={styles.chartTopRule} />
              <View style={styles.chartMidRule} />
              <View style={styles.chartBottomRule} />
              {wordChartData.points.map((point) => (
                <View key={point.key} style={styles.chartVerticalRule} />
              ))}
            </View>
            <View style={styles.chartYAxisLabels}>
              <Text style={styles.chartAxisText}>{wordChartData.maxValue}</Text>
              <Text style={styles.chartAxisText}>{Math.round(wordChartData.maxValue / 2)}</Text>
              <Text style={styles.chartAxisText}>0</Text>
            </View>
            <View style={styles.barChart}>
              {wordChartData.points.map((point) => (
                <View key={point.key} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        point.key === wordChartData.currentKey && styles.barFillActive,
                        { height: `${Math.max(6, (point.value / wordChartData.maxValue) * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel} numberOfLines={1}>{point.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.metricsCardDark]}>
          <View style={[styles.cardHeader, { zIndex: 10 }]}>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.metricsCardTitle}>Streak đăng nhập</Text>
              <Text style={styles.metricsCardSubtitle}>Tính theo ngày app được mở trên thiết bị này.</Text>
            </View>
            <View style={styles.yearPickerWrap}>
              <Pressable
                accessibilityLabel="Chọn năm streak"
                accessibilityRole="button"
                onPress={() => setStreakYearMenuOpen((current) => !current)}
                style={({ pressed }) => [styles.metricsYearPill, pressed && styles.metricsYearPillPressed]}>
                <Text style={styles.metricsYearText}>{displayedStreakYear}</Text>
                <Ionicons name={streakYearMenuOpen ? 'chevron-up' : 'chevron-down'} size={13} color="#EDEAF7" />
              </Pressable>
              {streakYearMenuOpen ? (
                <View style={styles.yearPickerMenu}>
                  {streakYearOptions.map((year) => (
                    <Pressable
                      key={year}
                      accessibilityRole="button"
                      onPress={() => {
                        setSelectedStreakYear(year);
                        setStreakYearMenuOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.yearPickerOption,
                        year === displayedStreakYear && styles.yearPickerOptionActive,
                        pressed && styles.yearPickerOptionPressed,
                      ]}>
                      <Text style={[styles.yearPickerOptionText, year === displayedStreakYear && styles.yearPickerOptionTextActive]}>
                        {year}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.darkDataRowCompact}>
            <DarkDataStat compact label="Hiện tại" value={activitySummary.currentStreak} />
            <DarkDataStat compact label="Dài nhất" value={activitySummary.longestStreak} />
            <DarkDataStat compact label="Tháng này" value={activitySummary.activeDaysThisMonth} />
            <DarkDataStat compact label={displayedStreakYear === currentYear ? 'Năm nay' : 'Năm đó'} value={selectedYearActiveDays} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.streakHeatmapScroll}
            contentContainerStyle={styles.streakHeatmapContent}>
            <View>
              <View style={styles.streakMonthRow}>
                <View style={styles.streakWeekLabelSpacer} />
                <View style={styles.streakMonthGrid}>
                  {streakYearHeatmap.monthLabels.map((month) => (
                    <Text key={`${month.label}-${month.weekIndex}`} style={[styles.streakMonthLabel, { left: month.weekIndex * 13 }]}>
                      {month.label}
                    </Text>
                  ))}
                </View>
              </View>
              <View style={styles.streakGridRow}>
                <View style={styles.streakWeekLabels}>
                  <Text style={styles.weekLabel}>Mon</Text>
                  <Text style={styles.weekLabel}>Wed</Text>
                  <Text style={styles.weekLabel}>Fri</Text>
                </View>
                <View style={styles.streakWeeks}>
                  {streakYearHeatmap.weeks.map((week) => (
                    <View key={week.key} style={styles.streakWeekColumn}>
                      {week.days.map((day) => (
                        <View
                          key={day.key}
                          style={[
                            styles.square,
                            !day.isInYear && styles.squareMuted,
                            day.isActive && day.level === 1 && styles.squareLevel1,
                            day.isActive && day.level === 2 && styles.squareLevel2,
                            day.isActive && day.level === 3 && styles.squareLevel3,
                            day.isActive && day.level >= 4 && styles.squareLevel4,
                          ]}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.streakContributionFooter}>
                <Text style={styles.legendText}>Learn how we count app opens</Text>
                <View style={styles.legend}>
                  <Text style={styles.legendText}>Less</Text>
                  <View style={[styles.legendSquare]} />
                  <View style={[styles.legendSquare, styles.squareLevel1]} />
                  <View style={[styles.legendSquare, styles.squareLevel2]} />
                  <View style={[styles.legendSquare, styles.squareLevel3]} />
                  <View style={[styles.legendSquare, styles.squareLevel4]} />
                  <Text style={styles.legendText}>More</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      <AuthModal
        authBusyAction={authBusyAction}
        authEmail={authEmail}
        authPassword={authPassword}
        authSession={authSession}
        mode={authModalMode}
        onChangeEmail={setAuthEmail}
        onChangeMode={setAuthModalMode}
        onChangePassword={setAuthPassword}
        onClose={() => setAuthModalOpen(false)}
        onPasswordRecovery={handlePasswordRecovery}
        onSignIn={handleSignInAuth}
        onSignUp={handleSignUpAuth}
        visible={authModalOpen}
      />

      <Modal animationType="fade" onRequestClose={() => setChangePasswordOpen(false)} transparent visible={changePasswordOpen}>
        <Pressable accessibilityLabel="Đóng" onPress={() => setChangePasswordOpen(false)} style={styles.authModalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={[styles.authModalCard, { backgroundColor: colors.surface, borderColor: colors.borderDefault }]}>
            <ChangePasswordForm onDone={() => setChangePasswordOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setFeedbackOpen(false)} transparent visible={feedbackOpen}>
        <Pressable accessibilityLabel="Đóng" onPress={() => setFeedbackOpen(false)} style={styles.authModalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={[styles.authModalCard, { backgroundColor: colors.surface, borderColor: colors.borderDefault }]}>
            <FeedbackForm onDone={() => setFeedbackOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      {sidebarOpen ? (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity
            accessibilityLabel="Đóng cài đặt"
            activeOpacity={1}
            onPress={() => setSidebarOpen(false)}
            style={styles.sidebarBackdrop}
          />
          <View style={[styles.sidebarSheet, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Cài đặt</Text>
              <SyncStatusIndicator />
              <Pressable
                accessibilityLabel="Đóng"
                accessibilityRole="button"
                onPress={() => setSidebarOpen(false)}
                style={({ pressed }) => [styles.sidebarCloseButton, pressed && styles.sidebarCloseButtonPressed]}>
                <Ionicons name="close" size={20} color="#5D5B54" />
              </Pressable>
            </View>
            <View style={styles.sidebarProfileCard}>
              <Image source={{ uri: avatarUri }} style={styles.sidebarProfileAvatar} />
              <View style={styles.sidebarProfileCopy}>
                <Text style={styles.sidebarProfileName} numberOfLines={1}>{profile.displayName}</Text>
                <Text style={styles.sidebarProfileMeta} numberOfLines={1}>
                  {authSession.email ?? (profile.username ? `@${profile.username}` : profile.email || 'Hồ sơ local')}
                </Text>
              </View>
            </View>
            <View style={styles.releaseStatusPanel}>
              <View style={styles.releaseStatusIcon}>
                <Ionicons name="rocket-outline" size={14} color="#5645D4" />
              </View>
              <View style={styles.releaseStatusCopy}>
                <Text style={styles.releaseStatusTitle} numberOfLines={1}>{getAppReleaseSummary()}</Text>
                <Text style={styles.releaseStatusText} numberOfLines={2}>{APP_RELEASE.deployScope}</Text>
              </View>
            </View>

            {activeSidebarItem ? (
              <View style={styles.sidebarDetailHeader}>
                <Pressable
                  accessibilityLabel="Quay lại danh sách cài đặt"
                  accessibilityRole="button"
                  onPress={() => setSidebarSection(null)}
                  style={({ pressed }) => [styles.sidebarBackButton, pressed && styles.sidebarBackButtonPressed]}>
                  <Ionicons name="chevron-back" size={18} color="#0075DE" />
                </Pressable>
                <Text style={styles.sidebarDetailTitle} numberOfLines={1}>{activeSidebarItem.label}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sidebarGroupLabel}>Mục cài đặt</Text>
                <View style={styles.sidebarNavList}>
                  {sidebarNavItems.map((item) => (
                    <Pressable
                      key={item.key}
                      accessibilityLabel={`Mở ${item.label}`}
                      accessibilityRole="button"
                      onPress={() => setSidebarSection(item.key)}
                      style={({ pressed }) => [
                        styles.sidebarNavItem,
                        pressed && styles.sidebarNavItemPressed,
                      ]}>
                      <Ionicons name={item.icon} size={15} color="#5D5B54" />
                      <Text numberOfLines={1} style={styles.sidebarNavItemText}>
                        {item.label}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <ScrollView
              contentContainerStyle={styles.sidebarContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {sidebarSection === 'account' ? (
              <SidebarSection title="Tài khoản">
                <AuthStatusPanel
                  authSession={authSession}
                  onRefreshPress={handleRefreshAuthSession}
                  onSignOutPress={handleSignOutAuth}
                />
                <View style={styles.sidebarAvatarBlock}>
                  <Image source={{ uri: avatarUri }} style={styles.sidebarAvatar} />
                  <Pressable
                    onPress={() => setEditingAvatar((value) => !value)}
                    style={({ pressed }) => [styles.sidebarAvatarAction, pressed && styles.sidebarAvatarActionPressed]}>
                    <Text style={styles.sidebarAvatarActionText}>{editingAvatar ? 'Hủy' : 'Thay ảnh'}</Text>
                  </Pressable>
                </View>
                {editingAvatar ? (
                  <ProfileInput
                    label="Avatar URL"
                    onChangeText={(value) => updateProfile('avatarUrl', value)}
                    placeholder="https://..."
                    value={profile.avatarUrl}
                  />
                ) : null}
                <ProfileInput
                  label="Tên hiển thị"
                  onChangeText={(value) => updateProfile('displayName', value)}
                  placeholder="Tên hiển thị"
                  value={profile.displayName}
                />
                <ProfileInput
                  label="Tên người dùng"
                  onChangeText={(value) => updateProfile('username', value)}
                  placeholder="username"
                  value={profile.username}
                />
                <ProfileInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={(value) => updateProfile('email', value)}
                  placeholder="you@example.com"
                  value={profile.email}
                />
                <ProfileInput
                  label="Số điện thoại"
                  onChangeText={(value) => updateProfile('phone', value)}
                  placeholder="+84..."
                  value={profile.phone}
                />
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Mật khẩu</Text>
                  <TextInput
                    editable={false}
                    placeholder={authSession.status === 'authenticated' ? 'Dùng email khôi phục để đổi mật khẩu' : 'Cần phiên cloud'}
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    style={[styles.profileInput, styles.profileInputDisabled]}
                    value=""
                  />
                  <Text style={styles.fieldHint}>Hồ sơ local vẫn tách khỏi danh tính cloud. Đổi mật khẩu sẽ dùng email khôi phục khi đăng nhập khả dụng.</Text>
                </View>
                <TouchableOpacity activeOpacity={0.82} onPress={handleSaveProfile} style={[styles.saveProfileButton, styles.sidebarPrimaryAction]}>
                  <Ionicons name="save-outline" size={16} color="#0075DE" />
                  <Text style={styles.saveProfileText} numberOfLines={1}>Lưu thay đổi</Text>
                </TouchableOpacity>
              </SidebarSection>
              ) : null}

              {sidebarSection === 'privacy' ? (
              <SidebarSection title="Riêng tư & dữ liệu">
                <View style={styles.privacyNote}>
                  <Ionicons name="lock-closed-outline" size={18} color="#0075DE" />
                  <Text style={styles.privacyText}>
                    Dữ liệu học tập, hồ sơ và file Reader luôn lưu local trước. Cloud chỉ chạy khi bạn đăng nhập và bật đồng bộ (beta); khi đã bật, ứng dụng tự đồng bộ khi mở lại và sau khi bạn chỉnh sửa.
                  </Text>
                </View>
                <View style={styles.securityRow}>
                  <View style={styles.securityCopy}>
                    <Text style={styles.securityTitle}>Khóa ứng dụng</Text>
                    <Text style={styles.securityText}>Face ID, vân tay hoặc mã thiết bị khi mở app.</Text>
                  </View>
                  <Switch
                    onValueChange={handleToggleAppLock}
                    thumbColor="#FFFFFF"
                    trackColor={{ false: '#C8C4BE', true: '#5645D4' }}
                    value={profile.appLockEnabled}
                  />
                </View>
                {authSession.status === 'authenticated' && (
                  <View style={styles.cloudSyncPanel}>
                    <View style={styles.securityRow}>
                      <View style={styles.securityCopy}>
                        <Text style={styles.securityTitle}>Beta đồng bộ đám mây</Text>
                        <Text style={styles.securityText}>Tự động đồng bộ dữ liệu học tập giữa các thiết bị. Dữ liệu local luôn được giữ lại; bấm Đồng bộ ngay để đồng bộ tức thì.</Text>
                      </View>
                      <Switch
                        onValueChange={handleToggleCloudSync}
                        thumbColor="#FFFFFF"
                        trackColor={{ false: '#C8C4BE', true: '#5645D4' }}
                        value={profile.cloudSyncEnabled}
                      />
                    </View>
                    {profile.cloudSyncEnabled ? (
                      <TouchableOpacity
                        activeOpacity={0.82}
                        onPress={handleManualCloudSync}
                        style={styles.manualSyncButton}>
                        <Ionicons name="sync-outline" size={15} color="#0075DE" />
                        <Text style={styles.manualSyncButtonText} numberOfLines={1}>Đồng bộ ngay</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
                <Text style={styles.sidebarGroupLabel}>Thông báo local</Text>
                <View style={styles.notificationPanel}>
                  <NotificationPreferenceRow
                    description="Nhắc bạn quay lại học theo giờ đã chọn."
                    label="Nhắc học mỗi ngày"
                    onValueChange={(value) => handleUpdateNotificationPreference('dailyReminderEnabled', value)}
                    value={profile.notificationPreferences.dailyReminderEnabled}
                  />
                  <NotificationPreferenceRow
                    description="Ưu tiên thẻ flashcard đến hạn trong ngày."
                    label="Nhắc ôn flashcard"
                    onValueChange={(value) => handleUpdateNotificationPreference('reviewReminderEnabled', value)}
                    value={profile.notificationPreferences.reviewReminderEnabled}
                  />
                  <NotificationPreferenceRow
                    description="Tổng kết nhẹ vào cuối tuần, vẫn chỉ lưu local."
                    label="Tổng kết tuần"
                    onValueChange={(value) => handleUpdateNotificationPreference('weeklySummaryEnabled', value)}
                    value={profile.notificationPreferences.weeklySummaryEnabled}
                  />
                  <View style={styles.notificationTimeRow}>
                    <View style={styles.securityCopy}>
                      <Text style={styles.securityTitle}>Giờ nhắc</Text>
                      <Text style={styles.securityText}>Định dạng 24h, ví dụ 20:00.</Text>
                    </View>
                    <TextInput
                      autoCapitalize="none"
                      onBlur={handleCommitNotificationTime}
                      onChangeText={handleChangeNotificationTime}
                      placeholder="20:00"
                      placeholderTextColor="#94A3B8"
                      style={styles.notificationTimeInput}
                      value={profile.notificationPreferences.reminderTime}
                    />
                  </View>
                </View>
                <TouchableOpacity activeOpacity={0.82} onPress={handleExportAllData} style={[styles.saveProfileButton, styles.sidebarPrimaryAction]}>
                  <Ionicons name="cloud-upload-outline" size={16} color="#0075DE" />
                  <Text style={styles.saveProfileText} numberOfLines={1}>Xuất dữ liệu local</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.82} onPress={handleClearAllData} style={[styles.clearDataButton, styles.sidebarPrimaryAction]}>
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={styles.clearDataText} numberOfLines={1}>Xóa tất cả dữ liệu local</Text>
                </TouchableOpacity>
                <Text style={styles.sidebarGroupLabel}>Gói từ điển offline</Text>
                <View style={styles.offlinePackSummaryRow}>
                  <DataStat label="Gói" value={offlinePackSummary.packCount} />
                  <DataStat label="Đã cài" value={offlinePackInstallSummary.readyCount} />
                </View>
                {offlineDictionaryPacks.map((pack) => {
                  const language = languageOptions.find((item) => item.code === pack.languageCode);
                  const runtimeGate = getOfflinePackRuntimeGate(pack, offlinePackRuntimeOptions);
                  const installRecord = getOfflinePackInstallRecord(offlinePackInstallState, pack);
                  const installStatus = formatOfflinePackInstallStatus(installRecord.status);
                  const progressLabel =
                    installRecord.status === 'downloading' ? `Tiến độ ${formatOfflinePackProgress(installRecord)}` : installStatus;
                  const isBusy = offlinePackBusyId === pack.id;
                  const canInstall = runtimeGate.canDownload && !isBusy;
                  const hasInstallRecord = installRecord.status !== 'not_downloaded';

                  return (
                    <View key={pack.id} style={styles.offlinePackRow}>
                      <View style={styles.securityCopy}>
                        <Text style={styles.securityTitle}>{formatPackTitle(pack, language?.label ?? pack.languageCode)}</Text>
                        <Text style={styles.securityText}>
                          {pack.sourceName} · {formatPackSizeRange(pack)} · {pack.license}
                        </Text>
                        <Text style={styles.securityText}>{runtimeGate.detail}</Text>
                      </View>
                      <View style={styles.offlinePackStatusColumn}>
                        <Text style={styles.offlinePackStatus}>{formatPackStatus(pack.status)}</Text>
                        <Text style={styles.offlinePackInstallText}>{progressLabel}</Text>
                        <Text style={styles.offlinePackRuntimeText}>{runtimeGate.actionLabel}</Text>
                        <View style={styles.offlinePackActionRow}>
                          <TouchableOpacity
                            accessibilityLabel={`Tải ${language?.label ?? pack.languageCode} offline pack`}
                            accessibilityRole="button"
                            activeOpacity={0.82}
                            disabled={!canInstall}
                            onPress={() => handleInstallOfflinePack(pack)}
                            style={[styles.offlinePackActionButton, !canInstall && styles.offlinePackActionButtonDisabled]}>
                            <Ionicons name="download-outline" size={14} color={canInstall ? '#0075DE' : '#A4A097'} />
                            <Text style={[styles.offlinePackActionText, !canInstall && styles.offlinePackActionTextDisabled]}>
                              {isBusy ? 'Đang xử lý' : installRecord.status === 'ready' ? 'Cài lại' : 'Tải pack'}
                            </Text>
                          </TouchableOpacity>
                          {hasInstallRecord ? (
                            <TouchableOpacity
                              accessibilityLabel={`Xóa ${language?.label ?? pack.languageCode} offline pack`}
                              accessibilityRole="button"
                              activeOpacity={0.82}
                              disabled={isBusy}
                              onPress={() => handleDeleteOfflinePack(pack)}
                              style={[styles.offlinePackDeleteButton, isBusy && styles.offlinePackActionButtonDisabled]}>
                              <Ionicons name="trash-outline" size={14} color={isBusy ? '#94A3B8' : '#DC2626'} />
                              <Text style={[styles.offlinePackDeleteText, isBusy && styles.offlinePackActionTextDisabled]}>
                                Xóa
                              </Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </SidebarSection>
              ) : null}

              {sidebarSection === 'support' ? (
              <SidebarSection title="Hỗ trợ">
                <SidebarActionRow
                  icon="book-outline"
                  label="Trung tâm trợ giúp"
                  onPress={() => Alert.alert('Trung tâm trợ giúp', 'Trang trợ giúp sẽ mở khi chọn kênh hỗ trợ chính thức.', [{ text: 'OK' }])}
                />
                <SidebarActionRow
                  badge={authSession.status === 'authenticated' ? undefined : authSession.status === 'unconfigured' ? 'Chưa cấu hình' : 'Cần đăng nhập'}
                  disabled={authSession.status === 'loading' || authSession.status === 'unconfigured'}
                  icon="chatbox-ellipses-outline"
                  label="Gửi phản hồi"
                  onPress={() => {
                    if (authSession.status === 'authenticated') {
                      setFeedbackOpen(true);
                      return;
                    }
                    Alert.alert('Cần đăng nhập', 'Đăng nhập cloud để gửi phản hồi. Mỗi tài khoản gửi tối đa 5 phản hồi mỗi ngày.');
                  }}
                />
                <SidebarActionRow
                  badge={authSession.status === 'authenticated' || authSession.status === 'needs_verification' ? 'Cloud' : 'Local'}
                  disabled={authSession.status === 'loading'}
                  icon="log-out-outline"
                  label="Đăng xuất"
                  onPress={handleSignOutAuth}
                />
              </SidebarSection>
              ) : null}

              {sidebarSection === 'account' ? (
              <SidebarSection title="Bảo mật & dữ liệu">
                <SidebarActionRow
                  badge="Phiên bản sau"
                  icon="key-outline"
                  label="Thay đổi mật khẩu"
                  onPress={() => {
                    if (authSession.status === 'authenticated') {
                      setChangePasswordOpen(true);
                      return;
                    }
                    Alert.alert('Cần đăng nhập', 'Đăng nhập cloud để đổi mật khẩu. Nếu quên mật khẩu, dùng "Quên mật khẩu" trong màn đăng nhập.');
                  }}
                />
                <SidebarActionRow
                  destructive
                  icon="trash-outline"
                  label="Xóa hồ sơ local"
                  onPress={handleDeleteLocalProfile}
                />
              </SidebarSection>
              ) : null}

              <View style={styles.sidebarLegalFooter}>
                {legalLinks.map((item) => (
                  <Pressable
                    accessibilityRole="button"
                    key={item.title}
                    onPress={() => Alert.alert(item.title, item.message, [{ text: 'OK' }])}
                    style={({ pressed }) => [styles.sidebarLegalLink, pressed && styles.sidebarLegalLinkPressed]}>
                    <Ionicons name={item.icon} size={15} color="#5D5B54" />
                    <Text style={styles.sidebarLegalLinkText}>{item.title}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
