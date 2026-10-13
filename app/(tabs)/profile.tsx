import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Image, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Touchable from '@/components/app/Touchable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '@/components/app/Screen';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import FeedbackForm from '@/components/profile/FeedbackForm';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { APP_RELEASE, getAppReleaseSummary } from '@/constants/appRelease';
import { ActivityState, getActivitySummary, getDefaultActivityState, loadActivityState } from '@/data/activityStore';
import { loadCurrentAuthSession, subscribeToAuthSessionChanges, syncAuthAutoRefreshForAppState } from '@/data/authController';
import { type AuthSessionSnapshot } from '@/data/authSession';
import { exportAllLocalData } from '@/data/exportAllData';
import { languageOptions } from '@/data/languages';
import { LibraryState, getDefaultLibraryState, loadLibraryState } from '@/data/libraryStore';
import { OfflinePackInstallState, getDefaultOfflinePackInstallState, loadOfflinePackInstallState } from '@/data/offlineDictionaryPackStore';
import { offlineDictionaryPacks, type OfflineDictionaryPack } from '@/data/offlineDictionaryPacks';
import { refreshOfflinePacks } from '@/data/offlinePackCatalog';
import { UserProfile, clearUserProfile, getDefaultProfile, loadUserProfile, saveUserProfile } from '@/data/profileStore';
import { ReaderState, getDefaultReaderState, loadReaderState } from '@/data/readerStore';
import { useToken } from '@/hooks/use-token';

import { SidebarActionRow, SidebarSection, sidebarNavItems, type SidebarSectionKey } from '@/components/profile/SettingsDrawerParts';
import { AuthModal, AuthStatusPanel } from '@/components/profile/AuthPanels';
import { useAuthForm } from '@/components/profile/useAuthForm';
import { SavedWordsChartCard, StreakCard } from '@/components/profile/ActivityCharts';
import OfflinePackSettings from '@/components/profile/OfflinePackSettings';
import ProfileFields from '@/components/profile/ProfileFields';
import PrivacySettings from '@/components/profile/PrivacySettings';
import { DataStat, ProfileMetric } from '@/components/profile/Metrics';
import { useProfileStyles } from '@/components/profile/styles';
import { clearAllLocalData } from '@/data/clearLocalData';
import DeleteAccountForm from '@/components/profile/DeleteAccountForm';
import { legalUrls } from '@/data/legalLinks';


const legalLinks = [
  {
    icon: 'document-text-outline' as const,
    message: 'Dữ liệu học tập nằm trên thiết bị của bạn. Các tính năng cloud (đồng bộ, dịch, AI, chấm phát âm) cần đăng nhập và có giới hạn sử dụng hằng ngày.',
    title: 'Điều khoản',
    url: legalUrls.terms,
  },
  {
    icon: 'shield-checkmark-outline' as const,
    message: 'Dữ liệu học tập nằm trên thiết bị. Chỉ khi bạn bật Đồng bộ cloud, dùng dịch/AI hoặc gửi bản ghi để chấm điểm thì dữ liệu tương ứng mới được gửi lên máy chủ. Bản ghi âm không được lưu.',
    title: 'Chính sách riêng tư',
    url: legalUrls.privacyPolicy,
  },
  {
    icon: 'information-circle-outline' as const,
    url: null,
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
  const { colors } = useToken();
  const styles = useProfileStyles();
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
  const [authSession, setAuthSession] = useState<AuthSessionSnapshot>(initialAuthSession);
  const { authModalProps, handleAuthEntry, handleRefreshAuthSession, handleSignOutAuth, prefillAuthEmail } = useAuthForm({
    authSession,
    loadingSession: initialAuthSession,
    setAuthSession,
  });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [offlinePacks, setOfflinePacks] = useState<OfflineDictionaryPack[]>(offlineDictionaryPacks);

  useEffect(() => {
    let active = true;
    // Hosted packs (EXPO_PUBLIC_OFFLINE_PACK_CATALOG_URL) join the bundled list; offline, the cached catalog is used.
    refreshOfflinePacks().then((packs) => {
      if (active) setOfflinePacks(packs);
    }).catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

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
          prefillAuthEmail(nextAuthSession.email || nextProfile.email || '');
        }
      );

      return () => {
        isMounted = false;
      };
    }, [prefillAuthEmail])
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
            await clearAllLocalData();
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

  const nativeLanguage = languageOptions.find((language) => language.code === profile.nativeLanguage);
  const learningLanguage = languageOptions.find((language) => language.code === profile.learningLanguage);
  const isSignedIn = authSession.status === 'authenticated' || authSession.status === 'needs_verification';
  const isDefaultGuestProfile =
    !isSignedIn &&
    profile.displayName === getDefaultProfile().displayName &&
    !profile.email &&
    !profile.username &&
    !profile.avatarUrl;
  // No stock photo: without a picture of their own, users see a neutral placeholder.
  const avatarUri = profile.avatarUrl;
  const activeSidebarItem = sidebarNavItems.find((item) => item.key === sidebarSection);
  const dashboardNow = new Date();
  const activitySummary = getActivitySummary(activityState, dashboardNow);
  const dueFlashcards = libraryState.flashcards.filter((card) => new Date(card.dueDate) <= dashboardNow || card.reviewState !== 'reviewed').length;

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
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.heroAvatar} />
            ) : (
              <View style={styles.heroGuestAvatar}>
                <Ionicons name="person-outline" size={26} color={colors.accentPrimary} />
              </View>
            )}
            <View style={styles.heroIdentity}>
              <Text style={styles.heroEyebrow}>Hồ sơ học tập</Text>
              <Text style={styles.heroName} numberOfLines={1}>{profile.displayName}</Text>
              <Text style={styles.heroMeta} numberOfLines={2}>
                {isDefaultGuestProfile
                  ? 'Chưa thiết lập hồ sơ · dữ liệu học tập chỉ lưu local'
                  : `${nativeLanguage?.label ?? profile.nativeLanguage} → ${learningLanguage?.label ?? profile.learningLanguage} · ${profile.proficiencyLevel}`}
              </Text>
              <View style={styles.heroAuthBadge}>
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
                  <Ionicons name="log-in-outline" size={17} color={colors.textOnAccent} />
                  <Text style={styles.heroAuthButtonText}>Đăng nhập</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityLabel="Mở cài đặt"
                accessibilityRole="button"
                onPress={() => openSidebarSection()}
                style={({ pressed }) => [styles.heroIconButton, pressed && styles.settingsButtonPressed]}>
                <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {!isDefaultGuestProfile ? (
            <View style={styles.heroGoalRow}>
              <View style={styles.goalBadge}>
                <Ionicons name="flame-outline" size={16} color={colors.statusWarningText} />
                <Text style={styles.goalBadgeText} numberOfLines={1}>{profile.dailyGoal}</Text>
              </View>
              <Text style={styles.goalText} numberOfLines={2}>{profile.learningGoal}</Text>
            </View>
          ) : (
            <View style={styles.guestSetupNotice}>
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

        <SavedWordsChartCard savedWords={libraryState.savedWords} />

        <StreakCard activityState={activityState} />
      </ScrollView>

      <AuthModal {...authModalProps} />

      <Modal animationType="fade" onRequestClose={() => setChangePasswordOpen(false)} transparent visible={changePasswordOpen}>
        <Pressable accessibilityLabel="Đóng" onPress={() => setChangePasswordOpen(false)} style={styles.authModalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={[styles.authModalCard, { backgroundColor: colors.surface, borderColor: colors.borderDefault }]}>
            <ChangePasswordForm onDone={() => setChangePasswordOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setDeleteAccountOpen(false)} transparent visible={deleteAccountOpen}>
        <Pressable accessibilityLabel="Đóng" onPress={() => setDeleteAccountOpen(false)} style={styles.authModalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={[styles.authModalCard, { backgroundColor: colors.surface, borderColor: colors.borderDefault }]}>
            <DeleteAccountForm
              onDone={({ localDataErased, signedOut }) => {
                setDeleteAccountOpen(false);
                if (localDataErased) {
                  setLibraryState(getDefaultLibraryState());
                  setOfflinePackInstallState(getDefaultOfflinePackInstallState());
                  setProfile(getDefaultProfile());
                  setReaderState(getDefaultReaderState());
                }
                if (signedOut) {
                  handleRefreshAuthSession();
                  Alert.alert('Đã xóa tài khoản', localDataErased ? 'Tài khoản cloud và dữ liệu trên thiết bị đã được xóa.' : 'Tài khoản cloud đã được xóa. Dữ liệu trên thiết bị vẫn được giữ.');
                }
              }}
            />
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
          <Touchable
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
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.sidebarProfileCard}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.sidebarProfileAvatar} />
              ) : (
                <View style={[styles.sidebarProfileAvatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person-outline" size={22} color={colors.accentPrimary} />
                </View>
              )}
              <View style={styles.sidebarProfileCopy}>
                <Text style={styles.sidebarProfileName} numberOfLines={1}>{profile.displayName}</Text>
                <Text style={styles.sidebarProfileMeta} numberOfLines={1}>
                  {authSession.email ?? (profile.username ? `@${profile.username}` : profile.email || 'Hồ sơ local')}
                </Text>
              </View>
            </View>
            <View style={styles.releaseStatusPanel}>
              <View style={styles.releaseStatusIcon}>
                <Ionicons name="rocket-outline" size={14} color={colors.accentPrimary} />
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
                  <Ionicons name="chevron-back" size={18} color={colors.accentPrimary} />
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
                      <Ionicons name={item.icon} size={15} color={colors.textSecondary} />
                      <Text numberOfLines={1} style={styles.sidebarNavItemText}>
                        {item.label}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
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
                <ProfileFields
                  isCloudSignedIn={authSession.status === 'authenticated'}
                  onChange={updateProfile}
                  profile={profile}
                />
                <Touchable activeOpacity={0.82} onPress={handleSaveProfile} style={[styles.saveProfileButton, styles.sidebarPrimaryAction]}>
                  <Ionicons name="save-outline" size={16} color={colors.accentPrimary} />
                  <Text style={styles.saveProfileText} numberOfLines={1}>Lưu thay đổi</Text>
                </Touchable>
              </SidebarSection>
              ) : null}

              {sidebarSection === 'privacy' ? (
              <SidebarSection title="Riêng tư & dữ liệu">
                <PrivacySettings
                  isSignedIn={authSession.status === 'authenticated'}
                  onMessage={setSaveMessage}
                  onProfileChange={setProfile}
                  profile={profile}
                />
                <Touchable activeOpacity={0.82} onPress={handleExportAllData} style={[styles.saveProfileButton, styles.sidebarPrimaryAction]}>
                  <Ionicons name="cloud-upload-outline" size={16} color={colors.accentPrimary} />
                  <Text style={styles.saveProfileText} numberOfLines={1}>Xuất dữ liệu local</Text>
                </Touchable>
                <Touchable activeOpacity={0.82} onPress={handleClearAllData} style={[styles.clearDataButton, styles.sidebarPrimaryAction]}>
                  <Ionicons name="trash-outline" size={16} color={colors.statusErrorText} />
                  <Text style={styles.clearDataText} numberOfLines={1}>Xóa tất cả dữ liệu local</Text>
                </Touchable>
                <OfflinePackSettings
                  installState={offlinePackInstallState}
                  onInstallStateChange={setOfflinePackInstallState}
                  packs={offlinePacks}
                />
              </SidebarSection>
              ) : null}

              {sidebarSection === 'support' ? (
              <SidebarSection title="Hỗ trợ">
                <SidebarActionRow
                  icon="book-outline"
                  label="Trung tâm trợ giúp"
                  onPress={() => (legalUrls.helpCenter
                    ? Linking.openURL(legalUrls.helpCenter).catch(() => undefined)
                    : Alert.alert('Trung tâm trợ giúp', 'Trang trợ giúp chưa được xuất bản. Bạn có thể dùng "Gửi phản hồi" để hỏi trực tiếp.', [{ text: 'OK' }]))}
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
                <SidebarActionRow
                  badge={authSession.status === 'authenticated' ? 'Cloud' : undefined}
                  destructive
                  icon="person-remove-outline"
                  label="Xóa tài khoản cloud"
                  onPress={() => {
                    if (authSession.status === 'authenticated') {
                      setDeleteAccountOpen(true);
                      return;
                    }
                    Alert.alert('Cần đăng nhập', 'Đăng nhập tài khoản cloud cần xóa. Dữ liệu chỉ có trên thiết bị có thể xóa trong Riêng tư & dữ liệu.');
                  }}
                />
              </SidebarSection>
              ) : null}

              <View style={styles.sidebarLegalFooter}>
                {legalLinks.map((item) => (
                  <Pressable
                    accessibilityRole="button"
                    key={item.title}
                    onPress={() => (item.url ? Linking.openURL(item.url).catch(() => Alert.alert(item.title, item.message)) : Alert.alert(item.title, item.message, [{ text: 'OK' }]))}
                    style={({ pressed }) => [styles.sidebarLegalLink, pressed && styles.sidebarLegalLinkPressed]}>
                    <Ionicons name={item.icon} size={15} color={colors.textSecondary} />
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
