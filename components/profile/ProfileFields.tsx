import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { ProfileInput } from '@/components/profile/SettingsDrawerParts';
import { styles } from '@/components/profile/styles';
import type { UserProfile } from '@/data/profileStore';
import { useToken } from '@/hooks/use-token';

type Props = {
  avatarPlaceholderStyle: StyleProp<ViewStyle>;
  isCloudSignedIn: boolean;
  onChange: <Key extends keyof UserProfile>(key: Key, value: UserProfile[Key]) => void;
  profile: UserProfile;
};

// Editable local profile fields in the Profile account drawer (saved by the screen's Save button).
export default function ProfileFields({ avatarPlaceholderStyle, isCloudSignedIn, onChange, profile }: Props) {
  const { colors } = useToken();
  const [editingAvatar, setEditingAvatar] = useState(false);

  return (
    <>
      <View style={styles.sidebarAvatarBlock}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.sidebarAvatar} />
        ) : (
          <View style={[styles.sidebarAvatar, styles.avatarPlaceholder, avatarPlaceholderStyle]}>
            <Ionicons name="person-outline" size={26} color={colors.accentPrimary} />
          </View>
        )}
        <Pressable
          onPress={() => setEditingAvatar((value) => !value)}
          style={({ pressed }) => [styles.sidebarAvatarAction, pressed && styles.sidebarAvatarActionPressed]}>
          <Text style={styles.sidebarAvatarActionText}>{editingAvatar ? 'Hủy' : 'Thay ảnh'}</Text>
        </Pressable>
      </View>
      {editingAvatar ? (
        <ProfileInput
          label="Avatar URL"
          onChangeText={(value) => onChange('avatarUrl', value)}
          placeholder="https://..."
          value={profile.avatarUrl}
        />
      ) : null}
      <ProfileInput
        label="Tên hiển thị"
        onChangeText={(value) => onChange('displayName', value)}
        placeholder="Tên hiển thị"
        value={profile.displayName}
      />
      <ProfileInput
        label="Tên người dùng"
        onChangeText={(value) => onChange('username', value)}
        placeholder="username"
        value={profile.username}
      />
      <ProfileInput
        autoCapitalize="none"
        keyboardType="email-address"
        label="Email"
        onChangeText={(value) => onChange('email', value)}
        placeholder="you@example.com"
        value={profile.email}
      />
      <ProfileInput
        label="Số điện thoại"
        onChangeText={(value) => onChange('phone', value)}
        placeholder="+84..."
        value={profile.phone}
      />
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Mật khẩu</Text>
        <TextInput
          editable={false}
          placeholder={isCloudSignedIn ? 'Dùng email khôi phục để đổi mật khẩu' : 'Cần phiên cloud'}
          placeholderTextColor="#94A3B8"
          secureTextEntry
          style={[styles.profileInput, styles.profileInputDisabled]}
          value=""
        />
        <Text style={styles.fieldHint}>Hồ sơ local vẫn tách khỏi danh tính cloud. Đổi mật khẩu sẽ dùng email khôi phục khi đăng nhập khả dụng.</Text>
      </View>
    </>
  );
}
