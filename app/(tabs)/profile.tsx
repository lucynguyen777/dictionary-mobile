import Ionicons from '@expo/vector-icons/Ionicons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
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
import { studyStats } from '@/data/dictionary';
import { exportAllLocalData } from '@/data/exportAllData';
import { languageOptions } from '@/data/languages';
import { LibraryState, clearLibraryState, getDefaultLibraryState, loadLibraryState } from '@/data/libraryStore';
import {
    LoginMethod,
    NotificationPreferences,
    ProficiencyLevel,
    UserProfile,
    clearUserProfile,
    getDefaultProfile,
    loadUserProfile,
    loginMethodOptions,
    proficiencyLevels,
    saveUserProfile,
} from '@/data/profileStore';
import { ReaderState, getDefaultReaderState, loadReaderState } from '@/data/readerStore';

const days = Array.from({ length: 84 }, (_, index) => index);
const chartValues = [1, 1.5, 2, 2.4, 4.6, 6.4, 5.5, 7.3, 9.1, 11.2, 10.5, 13.1, 15.5, 12.6, 17.5, 16.1, 23.6];
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
    message: 'Ứng dụng dùng Expo, React Native và các nguồn dữ liệu/adapter từ điển được tách theo giấy phép tương ứng.',
    title: 'Ghi nhận',
  },
];
type SidebarSectionKey = 'account' | 'privacy' | 'support';

const sidebarNavItems: { key: SidebarSectionKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'account', label: 'Tài khoản', icon: 'person-outline' },
  { key: 'privacy', label: 'Riêng tư', icon: 'shield-outline' },
  { key: 'support', label: 'Hỗ trợ', icon: 'help-circle-outline' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile>(getDefaultProfile());
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [readerState, setReaderState] = useState<ReaderState>(getDefaultReaderState());
  const [saveMessage, setSaveMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSection, setSidebarSection] = useState<SidebarSectionKey | null>(null);
  const [editingAvatar, setEditingAvatar] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      Promise.all([loadUserProfile(), loadLibraryState(), loadReaderState()]).then(
        ([nextProfile, nextLibraryState, nextReaderState]) => {
          if (!isMounted) return;

          setProfile(nextProfile);
          setLibraryState(nextLibraryState);
          setReaderState(nextReaderState);
        }
      );

      return () => {
        isMounted = false;
      };
    }, [])
  );

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
            await Promise.all([clearLibraryState(), clearUserProfile()]);
            setLibraryState(getDefaultLibraryState());
            setProfile(getDefaultProfile());
            setSaveMessage('');
            Alert.alert('Đã xóa', 'Tất cả dữ liệu local đã được xóa.');
          },
        },
      ]
    );
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
  const avatarUri = profile.avatarUrl || defaultAvatarUri;
  const activeSidebarItem = sidebarNavItems.find((item) => item.key === sidebarSection);

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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Mở cài đặt"
            accessibilityRole="button"
            onPress={() => {
              setSidebarSection(null);
              setSidebarOpen(true);
            }}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}>
            <Ionicons name="settings-outline" size={20} color="#0F172A" />
            <Text style={styles.settingsButtonText}>Cài đặt</Text>
          </Pressable>
          <TouchableOpacity activeOpacity={0.82} onPress={handleSaveProfile} style={styles.saveProfileButton}>
            <Ionicons name="save-outline" size={18} color="#2563EB" />
            <Text style={styles.saveProfileText}>Lưu</Text>
          </TouchableOpacity>
        </View>

        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        <Text style={styles.userName}>{profile.displayName}</Text>
        <Text style={styles.userMeta}>
          {nativeLanguage?.label ?? profile.nativeLanguage} → {learningLanguage?.label ?? profile.learningLanguage} · {profile.proficiencyLevel} ·{' '}
          {profile.dailyGoal}
        </Text>
        {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{studyStats.mastered}</Text>
            <Text style={styles.metricLabel}>Đã nhớ</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{studyStats.dueToday}</Text>
            <Text style={styles.metricLabel}>Cần ôn</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{studyStats.listeningScore}</Text>
            <Text style={styles.metricLabel}>Phát âm</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
          <ProfileInput
            label="Tên hiển thị"
            onChangeText={(value) => updateProfile('displayName', value)}
            placeholder="Tên của bạn"
            value={profile.displayName}
          />
          <ProfileInput
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email"
            onChangeText={(value) => updateProfile('email', value)}
            placeholder="you@example.com"
            value={profile.email}
          />
          <Text style={styles.fieldLabel}>Phương thức đăng nhập</Text>
          <View style={styles.chipRow}>
            {loginMethodOptions.map((option) => (
              <OptionChip
                key={option.value}
                isSelected={profile.loginMethod === option.value}
                label={option.label}
                onPress={() => updateProfile('loginMethod', option.value as LoginMethod)}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ngôn ngữ và trình độ</Text>
          <Text style={styles.fieldLabel}>Ngôn ngữ mẹ đẻ</Text>
          <View style={styles.chipRow}>
            {languageOptions.map((language) => (
              <OptionChip
                key={language.code}
                isSelected={profile.nativeLanguage === language.code}
                label={language.label}
                onPress={() => updateProfile('nativeLanguage', language.code)}
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>Ngôn ngữ đang học</Text>
          <View style={styles.chipRow}>
            {languageOptions.map((language) => (
              <OptionChip
                key={language.code}
                isSelected={profile.learningLanguage === language.code}
                label={language.label}
                onPress={() => updateProfile('learningLanguage', language.code)}
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>Trình độ hiện tại</Text>
          <View style={styles.chipRow}>
            {proficiencyLevels.map((level) => (
              <OptionChip
                key={level}
                isSelected={profile.proficiencyLevel === level}
                label={level}
                onPress={() => updateProfile('proficiencyLevel', level as ProficiencyLevel)}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mục tiêu học</Text>
          <ProfileInput
            label="Mục tiêu"
            onChangeText={(value) => updateProfile('learningGoal', value)}
            placeholder="Ví dụ: IELTS, công việc, giao tiếp"
            value={profile.learningGoal}
          />
          <ProfileInput
            autoCapitalize="none"
            label="Timezone"
            onChangeText={(value) => updateProfile('timezone', value)}
            placeholder="Asia/Ho_Chi_Minh"
            value={profile.timezone}
          />
          <ProfileInput
            label="Daily goal"
            onChangeText={(value) => updateProfile('dailyGoal', value)}
            placeholder="15 words/day"
            value={profile.dailyGoal}
          />
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed-outline" size={18} color="#2563EB" />
            <Text style={styles.privacyText}>
              Hồ sơ này đang lưu local trên thiết bị. Email chỉ dùng để chuẩn bị UI, chưa đăng nhập hoặc đồng bộ cloud.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dữ liệu local</Text>
          <Text style={styles.cardSubtitle}>Các dữ liệu này đang lưu trên thiết bị, chưa đồng bộ cloud.</Text>
          <View style={styles.securityRow}>
            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>Khóa ứng dụng</Text>
              <Text style={styles.securityText}>Yêu cầu Face ID, vân tay hoặc mã thiết bị khi mở app.</Text>
            </View>
            <Switch
              onValueChange={handleToggleAppLock}
              thumbColor={profile.appLockEnabled ? '#FFFFFF' : '#FFFFFF'}
              trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
              value={profile.appLockEnabled}
            />
          </View>
          <View style={styles.dataGrid}>
            <DataStat label="Bộ từ" value={libraryState.folders.length} />
            <DataStat label="Từ đã lưu" value={libraryState.savedWords.length} />
            <DataStat label="Flashcard" value={libraryState.flashcards.length} />
            <DataStat label="Lịch sử tra" value={libraryState.searchHistory.length} />
            <DataStat label="Reader files" value={readerState.documents.length} />
            <DataStat
              label="Import"
              value={libraryState.savedWords.filter((word) => word.source === 'import').length}
            />
          </View>
          <TouchableOpacity activeOpacity={0.82} onPress={handleExportAllData} style={[styles.saveProfileButton, { marginTop: 12 }]}>
            <Ionicons name="cloud-upload-outline" size={16} color="#2563EB" />
            <Text style={styles.saveProfileText}>Xuất dữ liệu</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.82} onPress={handleClearAllData} style={[styles.clearDataButton, { marginTop: 10 }]}>
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={styles.clearDataText}>Xóa tất cả dữ liệu</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Lịch học năm nay</Text>
            <View style={styles.yearPill}>
              <Text style={styles.yearText}>2026</Text>
              <Ionicons name="caret-down" size={14} color="#64748B" />
            </View>
          </View>
          <View style={styles.heatmapRow}>
            <View style={styles.weekLabels}>
              <Text style={styles.weekLabel}>Mon</Text>
              <Text style={styles.weekLabel}>Wed</Text>
              <Text style={styles.weekLabel}>Fri</Text>
            </View>
            <View style={styles.heatmap}>
              {days.map((day) => (
                <View key={day} style={[styles.square, day % 7 > 3 && styles.squareStrong, day % 13 === 0 && styles.squareDark]} />
              ))}
            </View>
          </View>
          <View style={styles.legend}>
            <Text style={styles.legendText}>Less</Text>
            {[0, 1, 2, 3, 4].map((item) => (
              <View key={item} style={[styles.legendSquare, item > 2 && styles.squareStrong]} />
            ))}
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Từ mới mỗi ngày</Text>
          <View style={styles.chart}>
            {[25, 20, 15, 10, 5].map((tick) => (
              <View key={tick} style={styles.gridLine}>
                <Text style={styles.tick}>{tick}</Text>
                <View style={styles.gridRule} />
              </View>
            ))}
            <View style={styles.lineArea}>
              {chartValues.map((value, index) => (
                <View key={`${value}-${index}`} style={[styles.lineDot, { left: `${(index / (chartValues.length - 1)) * 100}%`, bottom: `${(value / 25) * 100}%` }]} />
              ))}
            </View>
            <View style={styles.chartFooter}>
              {['Nov 23', '24', '25', '26', '27', '28', '29', '30'].map((label) => (
                <Text key={label} style={styles.dateLabel}>{label}</Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {sidebarOpen ? (
        <View style={styles.sidebarOverlay} pointerEvents="box-none">
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
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>
            <View style={styles.sidebarProfileCard}>
              <Image source={{ uri: avatarUri }} style={styles.sidebarProfileAvatar} />
              <View style={styles.sidebarProfileCopy}>
                <Text style={styles.sidebarProfileName} numberOfLines={1}>{profile.displayName}</Text>
                <Text style={styles.sidebarProfileMeta} numberOfLines={1}>
                  {profile.username ? `@${profile.username}` : profile.email || 'Hồ sơ local'}
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
                  <Ionicons name="chevron-back" size={18} color="#2563EB" />
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
                      onPress={() => setSidebarSection(item.key)}
                      style={({ pressed }) => [
                        styles.sidebarNavItem,
                        pressed && styles.sidebarNavItemPressed,
                      ]}>
                      <Ionicons name={item.icon} size={15} color="#64748B" />
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
                    placeholder="Chưa hỗ trợ — cần đăng nhập cloud"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    style={[styles.profileInput, styles.profileInputDisabled]}
                    value=""
                  />
                  <Text style={styles.fieldHint}>Chỉ lưu local. Đổi mật khẩu sẽ có sau khi chọn nhà cung cấp đăng nhập.</Text>
                </View>
                <TouchableOpacity activeOpacity={0.82} onPress={handleSaveProfile} style={[styles.saveProfileButton, styles.sidebarPrimaryAction]}>
                  <Ionicons name="save-outline" size={16} color="#2563EB" />
                  <Text style={styles.saveProfileText} numberOfLines={1}>Lưu thay đổi</Text>
                </TouchableOpacity>
              </SidebarSection>
              ) : null}

              {sidebarSection === 'privacy' ? (
              <SidebarSection title="Riêng tư & dữ liệu">
                <View style={styles.privacyNote}>
                  <Ionicons name="lock-closed-outline" size={18} color="#2563EB" />
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
                    trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
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
                  <Ionicons name="cloud-upload-outline" size={16} color="#2563EB" />
                  <Text style={styles.saveProfileText} numberOfLines={1}>Xuất dữ liệu local</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.82} onPress={handleClearAllData} style={[styles.clearDataButton, styles.sidebarPrimaryAction]}>
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={styles.clearDataText} numberOfLines={1}>Xóa tất cả dữ liệu local</Text>
                </TouchableOpacity>
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
                  badge="Sắp có"
                  icon="chatbox-ellipses-outline"
                  label="Gửi phản hồi"
                  onPress={() => Alert.alert('Gửi phản hồi', 'Gửi email/helpdesk cần backend hoặc kênh hỗ trợ — hiện chỉ là UI shell.', [{ text: 'OK' }])}
                />
                <SidebarActionRow
                  badge="Sắp có"
                  disabled
                  icon="log-out-outline"
                  label="Đăng xuất"
                  onPress={() => Alert.alert('Đăng xuất', 'Chưa có phiên đăng nhập. Đăng xuất sẽ khả dụng sau khi bật auth.', [{ text: 'OK' }])}
                />
              </SidebarSection>
              ) : null}

              {sidebarSection === 'account' ? (
              <SidebarSection title="Bảo mật & dữ liệu">
                <SidebarActionRow
                  badge="Sắp có"
                  icon="key-outline"
                  label="Thay đổi mật khẩu"
                  onPress={() => Alert.alert('Thay đổi mật khẩu', 'Chức năng này cần đăng nhập cloud và chưa khả dụng trên bản local.', [{ text: 'OK' }])}
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
                    <Ionicons name={item.icon} size={15} color="#64748B" />
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
  const iconColor = destructive ? '#DC2626' : disabled ? '#94A3B8' : '#64748B';

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
        trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
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

function OptionChip({ isSelected, label, onPress }: { isSelected: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={[styles.optionChip, isSelected && styles.optionChipActive]}>
      <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>{label}</Text>
    </TouchableOpacity>
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

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settingsButtonPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    transform: [{ scale: 0.98 }],
  },
  settingsButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  sidebarOverlay: {
    bottom: 0,
    elevation: 20,
    justifyContent: 'flex-start',
    left: 0,
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
    backgroundColor: '#FFFFFF',
    bottom: 0,
    elevation: 22,
    left: 0,
    maxWidth: 420,
    paddingHorizontal: 14,
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
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
    backgroundColor: '#F1F5F9',
  },
  sidebarTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  sidebarProfileCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
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
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  sidebarProfileMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  sidebarGroupLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  sidebarNavList: {
    gap: 6,
    marginBottom: 12,
  },
  sidebarNavItem: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  sidebarNavItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  sidebarNavItemPressed: {
    opacity: 0.88,
  },
  sidebarNavItemText: {
    color: '#64748B',
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    minWidth: 0,
  },
  sidebarNavItemTextActive: {
    color: '#2563EB',
  },
  sidebarDetailHeader: {
    alignItems: 'center',
    borderBottomColor: '#E2E8F0',
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
    backgroundColor: '#EFF6FF',
  },
  sidebarDetailTitle: {
    color: '#0F172A',
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    minWidth: 0,
  },
  sidebarContent: {
    paddingBottom: 24,
  },
  sidebarSection: {
    marginBottom: 18,
  },
  sidebarSectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 10,
    textTransform: 'uppercase',
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
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sidebarAvatarActionPressed: {
    backgroundColor: '#EFF6FF',
  },
  sidebarAvatarActionText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
  },
  sidebarPrimaryAction: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: 12,
  },
  sidebarActionRow: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
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
    backgroundColor: '#F1F5F9',
  },
  sidebarActionRowDestructive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  sidebarActionRowDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.82,
  },
  sidebarActionText: {
    color: '#334155',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 0,
  },
  sidebarActionTextDestructive: {
    color: '#DC2626',
    fontWeight: '900',
  },
  sidebarActionTextDisabled: {
    color: '#94A3B8',
  },
  sidebarActionBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    maxWidth: 74,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sidebarLegalFooter: {
    borderTopColor: '#E2E8F0',
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
    backgroundColor: '#F1F5F9',
  },
  sidebarLegalLinkText: {
    color: '#64748B',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    minWidth: 0,
  },
  profileInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  fieldHint: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 6,
  },
  saveProfileButton: {
    alignItems: 'center',
    backgroundColor: '#EAF1FF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  saveProfileText: {
    color: '#2563EB',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '900',
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
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 16,
  },
  userMeta: {
    alignSelf: 'center',
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5,
  },
  saveMessage: {
    alignSelf: 'center',
    color: '#166534',
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
    borderRadius: 8,
    flex: 1,
    paddingVertical: 14,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
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
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 6,
  },
  fieldBlock: {
    marginTop: 12,
  },
  fieldLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 12,
    textTransform: 'uppercase',
  },
  profileInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0F172A',
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
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  optionChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  optionChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  optionChipTextActive: {
    color: '#2563EB',
  },
  privacyNote: {
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
    padding: 11,
  },
  privacyText: {
    color: '#475569',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  securityRow: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
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
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  securityText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  notificationPanel: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
    padding: 10,
  },
  notificationRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
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
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  notificationTimeInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
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
  dataStat: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 11,
    width: '48%',
  },
  dataStatValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  dataStatLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  clearDataButton: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 999,
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
    fontWeight: '900',
  },
  yearPill: {
    alignItems: 'center',
    borderColor: '#E2E8F0',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    height: 28,
    paddingHorizontal: 13,
  },
  yearText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  heatmapRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  weekLabels: {
    justifyContent: 'space-around',
    marginRight: 4,
  },
  weekLabel: {
    color: '#8E8E8E',
    fontSize: 7,
  },
  heatmap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  square: {
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    height: 8,
    width: 8,
  },
  squareStrong: {
    backgroundColor: '#93C5FD',
  },
  squareDark: {
    backgroundColor: '#2563EB',
  },
  legend: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  legendText: {
    fontSize: 9,
    marginHorizontal: 4,
  },
  legendSquare: {
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    height: 8,
    marginHorizontal: 1,
    width: 8,
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
    backgroundColor: '#E2E8F0',
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
    backgroundColor: '#2F70FF',
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
