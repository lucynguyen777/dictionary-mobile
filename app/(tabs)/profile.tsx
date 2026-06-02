import Ionicons from '@expo/vector-icons/Ionicons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  AppState,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Screen from '@/components/app/Screen';
import {
  ActivityState,
  getActivitySummary,
  getDefaultActivityState,
  getLocalDateKey,
  loadActivityState,
} from '@/data/activityStore';
import {
  loadCurrentAuthSession,
  sendPasswordRecoveryEmail,
  signInAuthSession,
  signOutAuthSession,
  signUpAuthSession,
  subscribeToAuthSessionChanges,
  syncAuthAutoRefreshForAppState,
} from '@/data/authController';
import { type AuthSessionSnapshot } from '@/data/authSession';
import { exportAllLocalData } from '@/data/exportAllData';
import { languageOptions } from '@/data/languages';
import { LibraryState, clearLibraryState, getDefaultLibraryState, loadLibraryState } from '@/data/libraryStore';
import {
  deleteInstalledOfflineDictionaryPack,
  installOfflineDictionaryPackFromSource,
} from '@/data/offlineDictionaryPackActions';
import {
  OfflinePackInstallState,
  clearOfflinePackInstallState,
  formatOfflinePackInstallStatus,
  formatOfflinePackProgress,
  getDefaultOfflinePackInstallState,
  getOfflinePackInstallRecord,
  getOfflinePackInstallSummary,
  loadOfflinePackInstallState,
} from '@/data/offlineDictionaryPackStore';
import {
  formatPackSizeRange,
  formatPackStatus,
  getOfflinePackRuntimeGate,
  getOfflinePackSummary,
  offlineDictionaryPacks,
} from '@/data/offlineDictionaryPacks';
import {
    NotificationPreferences,
    UserProfile,
    clearUserProfile,
    getDefaultProfile,
    loadUserProfile,
    saveUserProfile,
} from '@/data/profileStore';
import { ReaderState, clearReaderState, getDefaultReaderState, loadReaderState } from '@/data/readerStore';

type WordChartRange = 'day' | 'week' | 'month' | 'year';

const wordChartRanges: { label: string; value: WordChartRange }[] = [
  { label: 'D', value: 'day' },
  { label: 'W', value: 'week' },
  { label: 'M', value: 'month' },
  { label: 'Y', value: 'year' },
];
const defaultAvatarUri = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop';
const monthShortLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
type SidebarSectionKey = 'account' | 'privacy' | 'support';

const sidebarNavItems: { key: SidebarSectionKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'account', label: 'Tài khoản', icon: 'person-outline' },
  { key: 'privacy', label: 'Riêng tư', icon: 'shield-outline' },
  { key: 'support', label: 'Hỗ trợ', icon: 'help-circle-outline' },
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
  const insets = useSafeAreaInsets();
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

    Alert.alert(
      'Đăng nhập cloud',
      'Biểu mẫu đăng nhập sẽ khả dụng sau khi bật phiên cloud cho tài khoản.',
      [{ text: 'OK' }]
    );
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
  const avatarUri = profile.avatarUrl || defaultAvatarUri;
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
        <View style={styles.profileHero}>
          <View style={styles.heroTopRow}>
            <Image source={{ uri: avatarUri }} style={styles.heroAvatar} />
            <View style={styles.heroIdentity}>
              <Text style={styles.heroEyebrow}>Hồ sơ học tập</Text>
              <Text style={styles.heroName} numberOfLines={1}>{profile.displayName}</Text>
              <Text style={styles.heroMeta} numberOfLines={2}>
                {nativeLanguage?.label ?? profile.nativeLanguage} → {learningLanguage?.label ?? profile.learningLanguage} · {profile.proficiencyLevel}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Mở cài đặt"
              accessibilityRole="button"
              onPress={() => openSidebarSection()}
              style={({ pressed }) => [styles.heroIconButton, pressed && styles.settingsButtonPressed]}>
              <Ionicons name="settings-outline" size={20} color="#1A1A1A" />
            </Pressable>
          </View>

          <View style={styles.heroGoalRow}>
            <View style={styles.goalBadge}>
              <Ionicons name="flame-outline" size={16} color="#EA580C" />
              <Text style={styles.goalBadgeText} numberOfLines={1}>{profile.dailyGoal}</Text>
            </View>
            <Text style={styles.goalText} numberOfLines={2}>{profile.learningGoal}</Text>
          </View>

          <View style={styles.heroMetricRow}>
            <ProfileMetric value={libraryState.savedWords.length} label="Từ đã lưu" />
            <ProfileMetric value={dueFlashcards} label="Cần ôn" />
            <ProfileMetric value={activitySummary.currentStreak} label="Streak" />
          </View>
          {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.cardTitle}>Tổng quan học tập</Text>
              <Text style={styles.cardSubtitle}>Các chỉ số chính từ dữ liệu local trên thiết bị.</Text>
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
                  onPrimaryPress={handleAuthEntry}
                  onRefreshPress={handleRefreshAuthSession}
                  onSignOutPress={handleSignOutAuth}
                />
                <AuthFormShell
                  authBusyAction={authBusyAction}
                  authEmail={authEmail}
                  authPassword={authPassword}
                  authSession={authSession}
                  onChangeEmail={setAuthEmail}
                  onChangePassword={setAuthPassword}
                  onPasswordRecovery={handlePasswordRecovery}
                  onSignIn={handleSignInAuth}
                  onSignUp={handleSignUpAuth}
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
                    Dữ liệu học tập, hồ sơ và file Reader đang lưu local trên thiết bị. Chưa đồng bộ cloud trừ khi bạn bật đăng nhập sau này.
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
                        <Text style={styles.securityTitle}>{language?.label ?? pack.languageCode}</Text>
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
                  badge="Phiên bản sau"
                  disabled
                  icon="chatbox-ellipses-outline"
                  label="Gửi phản hồi"
                  onPress={() => Alert.alert('Gửi phản hồi', 'Kênh phản hồi cloud đã được chọn. Biểu mẫu gửi phản hồi sẽ khả dụng sau khi bật máy chủ hỗ trợ.', [{ text: 'OK' }])}
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
                  disabled
                  icon="key-outline"
                  label="Thay đổi mật khẩu"
                  onPress={() => Alert.alert('Thay đổi mật khẩu', 'Khôi phục mật khẩu qua email sẽ khả dụng khi biểu mẫu đăng nhập cloud được bật.', [{ text: 'OK' }])}
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

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sidebarSection}>
      <Text style={styles.sidebarSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

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

function AuthStatusPanel({
  authSession,
  onPrimaryPress,
  onRefreshPress,
  onSignOutPress,
}: {
  authSession: AuthSessionSnapshot;
  onPrimaryPress: () => void;
  onRefreshPress: () => void;
  onSignOutPress: () => void;
}) {
  const copy = getAuthStatusCopy(authSession);
  const canSignOut = authSession.status === 'authenticated' || authSession.status === 'needs_verification';

  return (
    <View style={styles.authStatusPanel}>
      <FutureFeatureNotice reason="Đăng nhập, xác minh email, đồng bộ cloud và backup mã hóa sẽ được cập nhật trong phiên bản sau. Bản deploy hiện tại dùng hồ sơ local." />
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
        <Pressable
          accessibilityRole="button"
          disabled
          onPress={canSignOut ? onSignOutPress : onPrimaryPress}
          style={({ pressed }) => [
            styles.authStatusButton,
            canSignOut && styles.authStatusButtonSecondary,
            pressed && styles.authStatusButtonPressed,
            styles.authStatusButtonDisabled,
          ]}>
          <Text style={[styles.authStatusButtonText, canSignOut && styles.authStatusButtonTextSecondary]} numberOfLines={1}>
            {canSignOut ? 'Đăng xuất cloud' : 'Cập nhật sau'}
          </Text>
        </Pressable>
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

function AuthFormShell({
  authBusyAction,
  authEmail,
  authPassword,
  authSession,
  onChangeEmail,
  onChangePassword,
  onPasswordRecovery,
  onSignIn,
  onSignUp,
}: {
  authBusyAction: 'sign-in' | 'sign-up' | 'recovery' | null;
  authEmail: string;
  authPassword: string;
  authSession: AuthSessionSnapshot;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onPasswordRecovery: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  const isBusy = Boolean(authBusyAction);
  const isUnconfigured = authSession.status === 'unconfigured';
  const isFutureFeature = true;

  return (
    <View style={styles.authFormPanel}>
      <Text style={styles.sidebarGroupLabel}>Đăng nhập cloud</Text>
      <FutureFeatureNotice reason="Cần hoàn tất cấu hình Supabase/Auth production trước khi bật đăng nhập cho người dùng." />
      <TextInput
        autoCapitalize="none"
        editable={!isBusy && !isFutureFeature}
        keyboardType="email-address"
        onChangeText={onChangeEmail}
        placeholder="you@example.com"
        placeholderTextColor="#94A3B8"
        style={[styles.profileInput, (isBusy || isFutureFeature) && styles.profileInputDisabled]}
        value={authEmail}
      />
      <TextInput
        editable={!isBusy && !isFutureFeature}
        onChangeText={onChangePassword}
        placeholder="Mật khẩu"
        placeholderTextColor="#94A3B8"
        secureTextEntry
        style={[styles.profileInput, styles.authPasswordInput, (isBusy || isFutureFeature) && styles.profileInputDisabled]}
        value={authPassword}
      />
      <View style={styles.authFormButtonRow}>
        <Pressable
          accessibilityRole="button"
          disabled={isBusy || isFutureFeature}
          onPress={onSignIn}
          style={({ pressed }) => [styles.authFormButton, pressed && styles.authStatusButtonPressed, (isBusy || isFutureFeature) && styles.authStatusButtonDisabled]}>
          <Ionicons name="log-in-outline" size={15} color="#FFFFFF" />
          <Text style={styles.authFormButtonText} numberOfLines={1}>
            {authBusyAction === 'sign-in' ? 'Đang vào' : 'Cập nhật sau'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isBusy || isFutureFeature}
          onPress={onSignUp}
          style={({ pressed }) => [
            styles.authFormButton,
            styles.authFormButtonSecondary,
            pressed && styles.authStatusButtonPressed,
            (isBusy || isFutureFeature) && styles.authStatusButtonDisabled,
          ]}>
          <Ionicons name="person-add-outline" size={15} color="#0075DE" />
          <Text style={[styles.authFormButtonText, styles.authFormButtonTextSecondary]} numberOfLines={1}>
            {authBusyAction === 'sign-up' ? 'Đang tạo' : 'Cập nhật sau'}
          </Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={isBusy || isFutureFeature}
        onPress={onPasswordRecovery}
        style={({ pressed }) => [styles.authRecoveryButton, pressed && styles.authStatusButtonPressed, (isBusy || isFutureFeature) && styles.authStatusButtonDisabled]}>
        <Ionicons name="mail-outline" size={15} color="#0075DE" />
        <Text style={styles.authRecoveryButtonText} numberOfLines={1}>
          {authBusyAction === 'recovery' ? 'Đang gửi email' : 'Cập nhật sau'}
        </Text>
      </Pressable>
      <Text style={styles.fieldHint}>
        {isUnconfigured
          ? 'Cloud chưa sẵn sàng trên bản cài đặt này; hồ sơ local vẫn dùng bình thường.'
          : 'Phiên cloud không xóa hoặc ghi đè hồ sơ local hiện có.'}
      </Text>
    </View>
  );
}

function FutureFeatureNotice({ reason }: { reason: string }) {
  return (
    <View style={styles.futureFeatureNotice}>
      <Ionicons name="time-outline" size={15} color="#92400E" />
      <View style={styles.futureFeatureNoticeCopy}>
        <Text style={styles.futureFeatureNoticeTitle}>Cập nhật trong phiên bản sau</Text>
        <Text style={styles.futureFeatureNoticeText}>{reason}</Text>
      </View>
    </View>
  );
}

function SidebarActionRow({
  badge,
  destructive,
  disabled,
  icon,
  label,
  onPress,
}: {
  badge?: string;
  destructive?: boolean;
  disabled?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const iconColor = destructive ? '#DC2626' : disabled ? '#A4A097' : '#5D5B54';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sidebarActionRow,
        destructive && styles.sidebarActionRowDestructive,
        disabled && styles.sidebarActionRowDisabled,
        pressed && !disabled && styles.sidebarActionRowPressed,
      ]}>
      <Ionicons name={icon} size={17} color={iconColor} />
      <Text
        numberOfLines={1}
        style={[
          styles.sidebarActionText,
          destructive && styles.sidebarActionTextDestructive,
          disabled && styles.sidebarActionTextDisabled,
        ]}>
        {label}
      </Text>
      {badge ? <Text style={styles.sidebarActionBadge} numberOfLines={1}>{badge}</Text> : null}
    </Pressable>
  );
}

function NotificationPreferenceRow({
  description,
  label,
  onValueChange,
  value,
}: {
  description: string;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.notificationRow}>
      <View style={styles.securityCopy}>
        <Text style={styles.securityTitle} numberOfLines={1}>{label}</Text>
        <Text style={styles.securityText} numberOfLines={2}>{description}</Text>
      </View>
      <Switch
        onValueChange={onValueChange}
        thumbColor="#FFFFFF"
        trackColor={{ false: '#C8C4BE', true: '#5645D4' }}
        value={value}
      />
    </View>
  );
}

function ProfileInput({
  autoCapitalize,
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.profileInput}
        value={value}
      />
    </View>
  );
}

function ProfileMetric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.profileMetric}>
      <Text style={styles.profileMetricValue}>{value}</Text>
      <Text style={styles.profileMetricLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function DataStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.dataStat}>
      <Text style={styles.dataStatValue}>{value}</Text>
      <Text style={styles.dataStatLabel}>{label}</Text>
    </View>
  );
}

function DarkDataStat({ compact, label, value }: { compact?: boolean; label: string; value: number }) {
  return (
    <View style={[styles.darkDataStat, compact && styles.darkDataStatCompact]}>
      <Text style={styles.darkDataStatValue}>{value}</Text>
      <Text numberOfLines={1} style={[styles.darkDataStatLabel, compact && styles.darkDataStatLabelCompact]}>{label}</Text>
    </View>
  );
}

function buildSavedWordChartData(savedWords: LibraryState['savedWords'], range: WordChartRange, now: Date) {
  const bucketCount = range === 'day' ? 8 : range === 'week' ? 8 : range === 'month' ? 12 : 6;
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketDate = new Date(now);

    if (range === 'day') {
      bucketDate.setDate(now.getDate() - (bucketCount - 1 - index));
    } else if (range === 'week') {
      bucketDate.setDate(now.getDate() - (bucketCount - 1 - index) * 7);
    } else if (range === 'month') {
      bucketDate.setMonth(now.getMonth() - (bucketCount - 1 - index), 1);
    } else {
      bucketDate.setFullYear(now.getFullYear() - (bucketCount - 1 - index), 0, 1);
    }

    return {
      key: getWordChartBucketKey(bucketDate, range),
      label: getWordChartBucketLabel(bucketDate, range),
      value: 0,
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  savedWords.forEach((word) => {
    const createdAt = new Date(word.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;

    const bucket = bucketByKey.get(getWordChartBucketKey(createdAt, range));
    if (bucket) bucket.value += 1;
  });
  const totalValue = buckets.reduce((sum, bucket) => sum + bucket.value, 0);

  return {
    averageValue: totalValue / bucketCount,
    currentKey: getWordChartBucketKey(now, range),
    maxValue: Math.max(1, ...buckets.map((bucket) => bucket.value)),
    points: buckets,
    totalValue,
  };
}

function getWordChartBucketKey(date: Date, range: WordChartRange) {
  if (range === 'day') return getLocalDateKey(date);
  if (range === 'week') return getLocalDateKey(getWeekStartDate(date));
  if (range === 'month') return getLocalDateKey(date).slice(0, 7);

  return getLocalDateKey(date).slice(0, 4);
}

function getWordChartBucketLabel(date: Date, range: WordChartRange) {
  if (range === 'day') return `${date.getDate()}/${date.getMonth() + 1}`;
  if (range === 'week') return `${getWeekStartDate(date).getDate()}/${getWeekStartDate(date).getMonth() + 1}`;
  if (range === 'month') return `T${date.getMonth() + 1}`;

  return `${date.getFullYear()}`;
}

function getWordChartPeriodLabel(range: WordChartRange, now: Date) {
  if (range === 'day') return 'Hôm nay';
  if (range === 'week') return 'Tuần này';
  if (range === 'month') return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;

  return `${now.getFullYear()}`;
}

function getWeekStartDate(date: Date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart;
}

function formatMetricNumber(value: number) {
  if (value < 10 && value % 1 !== 0) return value.toFixed(1);

  return Math.round(value).toLocaleString('vi-VN');
}

function getStreakYearOptions(activityState: ActivityState, currentYear: number) {
  const years = new Set([currentYear]);

  activityState.activeDays.forEach((dayKey) => {
    const year = Number(dayKey.slice(0, 4));
    if (!Number.isNaN(year)) years.add(year);
  });

  return [...years].sort((a, b) => b - a);
}

function getActiveDaysForYear(activityState: ActivityState, year: number) {
  return activityState.activeDays.filter((dayKey) => dayKey.startsWith(`${year}-`)).length;
}

function buildStreakYearHeatmap(activeDays: string[], year: number) {
  // Count occurrences of each day to determine intensity levels
  const activeDayCounts = new Map<string, number>();
  activeDays.forEach((day) => {
    activeDayCounts.set(day, (activeDayCounts.get(day) ?? 0) + 1);
  });

  const firstDay = new Date(year, 0, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  gridStart.setHours(0, 0, 0, 0);

  const lastDay = new Date(year, 11, 31);
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  gridEnd.setHours(0, 0, 0, 0);

  const weekCount = Math.ceil((gridEnd.getTime() - gridStart.getTime() + 1) / (7 * 24 * 60 * 60 * 1000));
  const weeks = Array.from({ length: weekCount }, (_, weekIndex) => {
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);
      const key = getLocalDateKey(date);
      const count = activeDayCounts.get(key) ?? 0;

      // Level 0 = no activity, 1 = light, 2 = medium, 3 = strong, 4 = max
      const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;

      return {
        isActive: count > 0,
        isInYear: date.getFullYear() === year,
        key,
        level,
      };
    });

    return {
      days,
      key: `week-${weekIndex}`,
    };
  });
  const monthLabels = monthShortLabels.map((label, monthIndex) => {
    const monthStart = new Date(year, monthIndex, 1);
    const weekIndex = Math.floor((monthStart.getTime() - gridStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

    return { label, weekIndex };
  });

  return { monthLabels, weeks };
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  profileHero: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
    marginBottom: 12,
    padding: 14,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  heroAvatar: {
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  heroIdentity: {
    flex: 1,
    minWidth: 0,
  },
  heroEyebrow: {
    color: '#787671',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroName: {
    color: '#1A1A1A',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  heroMeta: {
    color: '#5D5B54',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  heroIconButton: {
    alignItems: 'center',
    backgroundColor: '#F6F5F4',
    borderColor: '#E5E3DF',
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  heroGoalRow: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  goalBadge: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    maxWidth: 140,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  goalBadgeText: {
    color: '#9A3412',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  goalText: {
    color: '#9A3412',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    minWidth: 0,
  },
  heroMetricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileMetric: {
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  profileMetricValue: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '700',
  },
  profileMetricLabel: {
    color: '#5D5B54',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryHeroAction: {
    alignItems: 'center',
    backgroundColor: '#5645D4',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  primaryHeroActionText: {
    color: '#FFFFFF',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryHeroAction: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#C8C4BE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 92,
    paddingHorizontal: 12,
  },
  secondaryHeroActionText: {
    color: '#0075DE',
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    flex: 1,
    gap: 9,
    minWidth: '45%',
    minHeight: 58,
    padding: 10,
  },
  quickActionIcon: {
    alignItems: 'center',
    backgroundColor: '#DCECFA',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  quickActionCopy: {
    flex: 1,
    minWidth: 0,
  },
  quickActionLabel: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionDetail: {
    color: '#5D5B54',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  cardHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  inlineEditButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#C8C4BE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 10,
  },
  inlineEditText: {
    color: '#0075DE',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryList: {
    gap: 8,
    marginTop: 12,
  },
  summaryRow: {
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: '#DCECFA',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  summaryLabel: {
    color: '#5D5B54',
    flexShrink: 0,
    fontSize: 12,
    fontWeight: '700',
    width: 92,
  },
  summaryValue: {
    color: '#1A1A1A',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 0,
    textAlign: 'right',
  },
  compactDataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settingsButtonPressed: {
    backgroundColor: '#F6F5F4',
    borderColor: '#C8C4BE',
    transform: [{ scale: 0.98 }],
  },
  settingsButtonText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
  sidebarOverlay: {
    bottom: 0,
    elevation: 20,
    justifyContent: 'flex-start',
    left: 0,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 999,
  },
  sidebarBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#00000066',
  },
  sidebarSheet: {
    backgroundColor: '#FAFAF9',
    bottom: 0,
    elevation: 22,
    left: 0,
    maxWidth: 420,
    paddingHorizontal: 14,
    position: 'absolute',
    boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.12)',
    top: 0,
    width: '88%',
  },
  sidebarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingRight: 4,
  },
  sidebarCloseButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sidebarCloseButtonPressed: {
    backgroundColor: '#F0EEEC',
  },
  sidebarTitle: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },
  sidebarProfileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    padding: 10,
  },
  sidebarProfileAvatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  sidebarProfileCopy: {
    flex: 1,
    minWidth: 0,
  },
  sidebarProfileName: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
  },
  sidebarProfileMeta: {
    color: '#5D5B54',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  sidebarGroupLabel: {
    color: '#787671',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  sidebarNavList: {
    gap: 6,
    marginBottom: 12,
  },
  sidebarNavItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  sidebarNavItemActive: {
    backgroundColor: '#E6E0F5',
    borderColor: '#D6B6F6',
  },
  sidebarNavItemPressed: {
    opacity: 0.88,
  },
  sidebarNavItemText: {
    color: '#5D5B54',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 0,
  },
  sidebarNavItemTextActive: {
    color: '#391C57',
  },
  sidebarDetailHeader: {
    alignItems: 'center',
    borderBottomColor: '#E5E3DF',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
  },
  sidebarBackButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  sidebarBackButtonPressed: {
    backgroundColor: '#F0EEEC',
  },
  sidebarDetailTitle: {
    color: '#1A1A1A',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    minWidth: 0,
  },
  sidebarContent: {
    paddingBottom: 24,
  },
  sidebarSection: {
    marginBottom: 18,
  },
  sidebarSectionTitle: {
    color: '#5D5B54',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  authStatusPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    padding: 12,
  },
  authStatusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  authStatusIcon: {
    alignItems: 'center',
    backgroundColor: '#DCECFA',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  authStatusCopy: {
    flex: 1,
    minWidth: 0,
  },
  authStatusTitle: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
  authStatusText: {
    color: '#5D5B54',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 2,
  },
  authStatusBadge: {
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '700',
    maxWidth: 86,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  authStatusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  authStatusButton: {
    alignItems: 'center',
    backgroundColor: '#5645D4',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 10,
  },
  authStatusButtonSecondary: {
    backgroundColor: '#E6E0F5',
  },
  authStatusButtonPressed: {
    opacity: 0.86,
  },
  authStatusButtonDisabled: {
    opacity: 0.62,
  },
  authStatusButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  authStatusButtonTextSecondary: {
    color: '#391C57',
  },
  authStatusRefreshButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C8C4BE',
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 42,
  },
  authFormPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  authPasswordInput: {
    marginTop: 8,
  },
  authFormButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  authFormButton: {
    alignItems: 'center',
    backgroundColor: '#5645D4',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 10,
  },
  authFormButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C8C4BE',
    borderWidth: 1,
  },
  authFormButtonText: {
    color: '#FFFFFF',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  authFormButtonTextSecondary: {
    color: '#0075DE',
  },
  authRecoveryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  authRecoveryButtonText: {
    color: '#0075DE',
    fontSize: 12,
    fontWeight: '700',
  },
  sidebarAvatarBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sidebarAvatar: {
    borderRadius: 36,
    height: 72,
    width: 72,
  },
  sidebarAvatarAction: {
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sidebarAvatarActionPressed: {
    backgroundColor: '#F6F5F4',
  },
  sidebarAvatarActionText: {
    color: '#0075DE',
    fontSize: 13,
    fontWeight: '700',
  },
  sidebarPrimaryAction: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: 12,
  },
  sidebarActionRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sidebarActionRowPressed: {
    backgroundColor: '#F6F5F4',
  },
  sidebarActionRowDestructive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  sidebarActionRowDisabled: {
    backgroundColor: '#F6F5F4',
    opacity: 0.82,
  },
  sidebarActionText: {
    color: '#37352F',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 0,
  },
  sidebarActionTextDestructive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  sidebarActionTextDisabled: {
    color: '#A4A097',
  },
  sidebarActionBadge: {
    backgroundColor: '#F0EEEC',
    borderRadius: 999,
    color: '#787671',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 74,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sidebarLegalFooter: {
    borderTopColor: '#E5E3DF',
    borderTopWidth: 1,
    gap: 6,
    marginTop: 6,
    paddingTop: 14,
  },
  sidebarLegalLink: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sidebarLegalLinkPressed: {
    backgroundColor: '#F6F5F4',
  },
  sidebarLegalLinkText: {
    color: '#5D5B54',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    minWidth: 0,
  },
  profileInputDisabled: {
    backgroundColor: '#F0EEEC',
    color: '#A4A097',
  },
  fieldHint: {
    color: '#787671',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 6,
  },
  saveProfileButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#C8C4BE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  saveProfileText: {
    color: '#0075DE',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  avatar: {
    alignSelf: 'center',
    borderRadius: 48,
    height: 96,
    marginTop: 10,
    width: 96,
  },
  userName: {
    alignSelf: 'center',
    color: '#1A1A1A',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  userMeta: {
    alignSelf: 'center',
    color: '#5D5B54',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5,
  },
  saveMessage: {
    alignSelf: 'center',
    color: '#1AAE39',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    marginTop: 22,
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  metricValue: {
    color: '#1A1A1A',
    fontSize: 22,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#5D5B54',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 14,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#5D5B54',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 6,
  },
  fieldBlock: {
    marginTop: 12,
  },
  fieldLabel: {
    color: '#5D5B54',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 12,
    textTransform: 'uppercase',
  },
  profileInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C8C4BE',
    borderRadius: 8,
    borderWidth: 1,
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 7,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  optionChipActive: {
    backgroundColor: '#E6E0F5',
    borderColor: '#5645D4',
  },
  optionChipText: {
    color: '#5D5B54',
    fontSize: 12,
    fontWeight: '700',
  },
  optionChipTextActive: {
    color: '#391C57',
  },
  privacyNote: {
    alignItems: 'flex-start',
    backgroundColor: '#DCECFA',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
    padding: 11,
  },
  privacyText: {
    color: '#37352F',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  securityRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
  },
  securityCopy: {
    flex: 1,
  },
  securityTitle: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
  securityText: {
    color: '#5D5B54',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  notificationPanel: {
    backgroundColor: '#F6F5F4',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
    padding: 10,
  },
  notificationRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  notificationTimeRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  notificationTimeInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C8C4BE',
    borderRadius: 8,
    borderWidth: 1,
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'center',
    width: 76,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  futureFeatureNotice: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 10,
    opacity: 0.62,
    padding: 10,
  },
  futureFeatureNoticeCopy: {
    flex: 1,
  },
  futureFeatureNoticeTitle: {
    color: '#78350F',
    fontSize: 12,
    fontWeight: '800',
  },
  futureFeatureNoticeText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 2,
  },
  offlinePackSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  offlinePackRow: {
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    padding: 10,
  },
  offlinePackStatus: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    color: '#3730A3',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 5,
    textAlign: 'center',
  },
  offlinePackStatusColumn: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 5,
    maxWidth: 156,
  },
  offlinePackRuntimeText: {
    color: '#5D5B54',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 13,
    textAlign: 'right',
  },
  offlinePackInstallText: {
    color: '#0F766E',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    textAlign: 'right',
  },
  offlinePackActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  offlinePackActionButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C8C4BE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  offlinePackActionButtonDisabled: {
    backgroundColor: '#F0EEEC',
    borderColor: '#E5E3DF',
  },
  offlinePackActionText: {
    color: '#0075DE',
    fontSize: 11,
    fontWeight: '700',
  },
  offlinePackActionTextDisabled: {
    color: '#A4A097',
  },
  offlinePackDeleteButton: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  offlinePackDeleteText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  dataStat: {
    backgroundColor: '#FAFAF9',
    borderColor: '#E5E3DF',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
    padding: 11,
  },
  dataStatValue: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '700',
  },
  dataStatLabel: {
    color: '#5D5B54',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  metricsCardDark: {
    backgroundColor: '#050507',
    borderColor: '#1F1D28',
  },
  metricsCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  metricsCardSubtitle: {
    color: '#9A97A7',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 3,
  },
  metricsHeaderBlock: {
    marginTop: 18,
  },
  metricsOverline: {
    color: '#8F8B9B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  metricsPrimaryValue: {
    color: '#A998F4',
    fontSize: 42,
    fontWeight: '700',
    lineHeight: 48,
    marginTop: 2,
  },
  metricsPeriod: {
    color: '#8F8B9B',
    fontSize: 14,
    fontWeight: '700',
  },
  metricsYearPill: {
    alignItems: 'center',
    backgroundColor: '#25222E',
    borderColor: '#3A3646',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  metricsYearPillPressed: {
    backgroundColor: '#302C3A',
  },
  metricsYearText: {
    color: '#EDEAF7',
    fontSize: 12,
    fontWeight: '700',
  },
  yearPickerWrap: {
    position: 'relative',
    zIndex: 20,
    elevation: 20,
  },
  yearPickerMenu: {
    backgroundColor: '#121018',
    borderColor: '#342F40',
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 82,
    padding: 4,
    position: 'absolute',
    right: 0,
    top: 36,
    zIndex: 30,
    elevation: 30,
    boxShadow: '0px 8px 18px rgba(0, 0, 0, 0.28)',
  },
  yearPickerOption: {
    borderRadius: 6,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  yearPickerOptionActive: {
    backgroundColor: '#24212B',
  },
  yearPickerOptionPressed: {
    backgroundColor: '#302C3A',
  },
  yearPickerOptionText: {
    color: '#A7A2B2',
    fontSize: 12,
    fontWeight: '700',
  },
  yearPickerOptionTextActive: {
    color: '#FFFFFF',
  },
  darkDataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  darkDataRowCompact: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    position: 'relative',
    zIndex: 1,
  },
  darkDataStat: {
    backgroundColor: '#121018',
    borderColor: '#2C2837',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
    padding: 11,
  },
  darkDataStatCompact: {
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  darkDataStatValue: {
    color: '#A998F4',
    fontSize: 22,
    fontWeight: '700',
  },
  darkDataStatLabel: {
    color: '#A7A2B2',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  darkDataStatLabelCompact: {
    fontSize: 9,
  },
  clearDataButton: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  clearDataText: {
    color: '#DC2626',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  yearPill: {
    alignItems: 'center',
    borderColor: '#E5E3DF',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    height: 28,
    paddingHorizontal: 13,
  },
  yearText: {
    color: '#5D5B54',
    fontSize: 12,
    fontWeight: '800',
  },
  heatmapRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  streakHeatmapScroll: {
    marginTop: 14,
  },
  streakHeatmapContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 2,
  },
  streakMonthRow: {
    flexDirection: 'row',
  },
  streakWeekLabelSpacer: {
    width: 34,
  },
  streakMonthGrid: {
    height: 20,
    position: 'relative',
    width: 795,
  },
  streakMonthLabel: {
    color: '#EDEAF7',
    fontSize: 11,
    fontWeight: '800',
    position: 'absolute',
    top: 2,
  },
  streakGridRow: {
    flexDirection: 'row',
  },
  weekLabels: {
    justifyContent: 'space-around',
    marginRight: 4,
  },
  streakWeekLabels: {
    height: 106,
    justifyContent: 'space-around',
    paddingBottom: 2,
    paddingTop: 11,
    width: 34,
  },
  weekLabel: {
    color: '#EDEAF7',
    fontSize: 11,
    fontWeight: '700',
  },
  heatmap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  square: {
    backgroundColor: '#161B22',
    borderRadius: 3,
    height: 12,
    width: 12,
  },
  squareMuted: {
    opacity: 0.24,
  },
  squareLevel1: {
    backgroundColor: '#0E4429',
  },
  squareLevel2: {
    backgroundColor: '#006D32',
  },
  squareLevel3: {
    backgroundColor: '#26A641',
  },
  squareLevel4: {
    backgroundColor: '#39D353',
  },
  squareStrong: {
    backgroundColor: '#26A641',
  },
  squareBright: {
    backgroundColor: '#39D353',
  },
  squareDark: {
    backgroundColor: '#5645D4',
  },
  streakWeeks: {
    flexDirection: 'row',
    gap: 3,
  },
  streakWeekColumn: {
    gap: 3,
  },
  streakContributionFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'space-between',
    marginLeft: 34,
    marginTop: 10,
    minWidth: 700,
  },
  legend: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'flex-end',
  },
  legendText: {
    color: '#A7A2B2',
    fontSize: 11,
    marginHorizontal: 4,
  },
  legendSquare: {
    backgroundColor: '#161B22',
    borderRadius: 3,
    height: 12,
    width: 12,
  },
  segmentedControl: {
    backgroundColor: '#24212B',
    borderColor: '#24212B',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 12,
    padding: 3,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 7,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#706E78',
  },
  segmentButtonText: {
    color: '#F5F3FB',
    fontSize: 15,
    fontWeight: '700',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  fitnessChartFrame: {
    height: 238,
    marginTop: 18,
    paddingRight: 34,
    position: 'relative',
  },
  chartGridOverlay: {
    bottom: 24,
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 28,
    top: 4,
  },
  chartTopRule: {
    backgroundColor: '#3C3946',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  chartMidRule: {
    backgroundColor: '#3C3946',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '50%',
  },
  chartBottomRule: {
    backgroundColor: '#3C3946',
    bottom: 0,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  chartVerticalRule: {
    borderColor: '#3C3946',
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    flex: 1,
  },
  chartYAxisLabels: {
    bottom: 12,
    justifyContent: 'space-between',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 28,
  },
  chartAxisText: {
    color: '#9A97A7',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  barChart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 6,
    height: 214,
    paddingBottom: 24,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    height: '100%',
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  barTrack: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 4,
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '100%',
  },
  barFill: {
    backgroundColor: '#5B5278',
    borderRadius: 4,
    maxWidth: 34,
    width: '62%',
  },
  barFillActive: {
    backgroundColor: '#A998F4',
  },
  barLabel: {
    color: '#8F8B9B',
    fontSize: 11,
    fontWeight: '800',
  },
  chart: {
    height: 210,
    marginTop: 20,
  },
  gridLine: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 35,
  },
  tick: {
    color: '#8A8A8A',
    fontSize: 10,
    width: 32,
  },
  gridRule: {
    backgroundColor: '#E5E3DF',
    flex: 1,
    height: 1,
  },
  lineArea: {
    bottom: 34,
    left: 34,
    position: 'absolute',
    right: 10,
    top: 6,
  },
  lineDot: {
    backgroundColor: '#5645D4',
    borderRadius: 4,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    position: 'absolute',
    width: 8,
  },
  chartFooter: {
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  dateLabel: {
    color: '#8A8A8A',
    fontSize: 11,
  },
});
