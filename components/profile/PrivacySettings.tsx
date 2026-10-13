import Ionicons from '@expo/vector-icons/Ionicons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { Alert, Switch, Text, TextInput, View } from 'react-native';

import Touchable from '@/components/app/Touchable';
import { NotificationPreferenceRow } from '@/components/profile/SettingsDrawerParts';
import { useProfileStyles } from '@/components/profile/styles';
import { type NotificationPreferences, type UserProfile, saveUserProfile } from '@/data/profileStore';
import { triggerManualSync } from '@/data/supabaseSyncLifecycle';
import { loadCrashReportPreference, saveCrashReportPreference } from '@/data/crashReportPreference';
import { hasErrorReporter, isErrorReportingEnabled } from '@/data/errorReporting';
import { useToken } from '@/hooks/use-token';

type Props = {
  isSignedIn: boolean;
  onMessage: (message: string) => void;
  onProfileChange: (profile: UserProfile) => void;
  profile: UserProfile;
};

// App lock, cloud sync and local notification settings in the Profile privacy & data drawer.
export default function PrivacySettings({ isSignedIn, onMessage, onProfileChange, profile }: Props) {
  const { colors } = useToken();
  const styles = useProfileStyles();
  // Crash reports (plan 7.1): the switch appears once a reporting provider is plugged in (D8).
  const [crashReportsOn, setCrashReportsOn] = useState(isErrorReportingEnabled());
  useEffect(() => {
    loadCrashReportPreference().then(() => setCrashReportsOn(isErrorReportingEnabled())).catch(() => undefined);
  }, []);
  const handleToggleCrashReports = (value: boolean) => {
    setCrashReportsOn(value);
    saveCrashReportPreference(value)
      .then(() => onMessage(value ? 'Đã bật gửi báo cáo lỗi.' : 'Đã tắt gửi báo cáo lỗi.'))
      .catch(() => undefined);
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
      onProfileChange(nextProfile);
      onMessage(nextValue ? 'Đã bật khóa ứng dụng trên thiết bị này.' : 'Đã tắt khóa ứng dụng.');
    } catch {
      Alert.alert('Lỗi khóa ứng dụng', 'Không thể thay đổi thiết lập khóa ứng dụng lúc này.');
    }
  };

  const handleToggleCloudSync = async (nextValue: boolean) => {
    try {
      const nextProfile = await saveUserProfile({ ...profile, cloudSyncEnabled: nextValue });
      onProfileChange(nextProfile);
      onMessage(nextValue ? 'Đã bật đồng bộ cloud (beta). Ứng dụng sẽ tự đồng bộ khi mở lại và sau khi bạn chỉnh sửa.' : 'Đã tắt đồng bộ đám mây.');
    } catch {
      Alert.alert('Lỗi đồng bộ', 'Không thể thay đổi thiết lập đồng bộ lúc này.');
    }
  };

  const handleManualCloudSync = async () => {
    const result = await triggerManualSync();
    if (result.status === 'synced') {
      onMessage('Đã đồng bộ cloud.');
    } else if (result.status === 'idle') {
      onMessage('Bật đồng bộ cloud (beta) trước khi đồng bộ.');
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

    onProfileChange(nextProfile);
    onMessage('Đã lưu tùy chọn thông báo local.');
  };

  // Typing only updates the screen; the time is saved when the field loses focus.
  const handleChangeNotificationTime = (value: string) => {
    onProfileChange({ ...profile, notificationPreferences: { ...profile.notificationPreferences, reminderTime: value } });
    onMessage('');
  };

  const handleCommitNotificationTime = () => {
    handleUpdateNotificationPreference('reminderTime', profile.notificationPreferences.reminderTime);
  };

  return (
    <>
      <View style={styles.privacyNote}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.accentPrimary} />
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
          thumbColor={colors.textOnAccent}
          trackColor={{ false: colors.borderDefault, true: colors.accentPrimary }}
          value={profile.appLockEnabled}
        />
      </View>
      {isSignedIn && (
        <View style={styles.cloudSyncPanel}>
          <View style={styles.securityRow}>
            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>Beta đồng bộ đám mây</Text>
              <Text style={styles.securityText}>Tự động đồng bộ dữ liệu học tập giữa các thiết bị. Dữ liệu local luôn được giữ lại; bấm Đồng bộ ngay để đồng bộ tức thì.</Text>
            </View>
            <Switch
              onValueChange={handleToggleCloudSync}
              thumbColor={colors.textOnAccent}
              trackColor={{ false: colors.borderDefault, true: colors.accentPrimary }}
              value={profile.cloudSyncEnabled}
            />
          </View>
          {profile.cloudSyncEnabled ? (
            <Touchable
              activeOpacity={0.82}
              onPress={handleManualCloudSync}
              style={styles.manualSyncButton}>
              <Ionicons name="sync-outline" size={15} color={colors.accentPrimary} />
              <Text style={styles.manualSyncButtonText} numberOfLines={1}>Đồng bộ ngay</Text>
            </Touchable>
          ) : null}
        </View>
      )}
      {hasErrorReporter() ? (
        <View style={styles.securityRow}>
          <View style={styles.securityCopy}>
            <Text style={styles.securityTitle}>Gửi báo cáo lỗi</Text>
            <Text style={styles.securityText}>Gửi thông tin lỗi ứng dụng (đã xóa email, token) để sửa lỗi nhanh hơn. Không gửi nội dung học tập.</Text>
          </View>
          <Switch accessibilityLabel="Gửi báo cáo lỗi" onValueChange={handleToggleCrashReports} value={crashReportsOn} />
        </View>
      ) : null}
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
            placeholderTextColor={colors.textTertiary}
            style={styles.notificationTimeInput}
            value={profile.notificationPreferences.reminderTime}
          />
        </View>
      </View>
    </>
  );
}
