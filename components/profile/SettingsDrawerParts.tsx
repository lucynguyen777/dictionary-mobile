import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';

import { useProfileStyles } from '@/components/profile/styles';
import { useToken } from '@/hooks/use-token';

export type SidebarSectionKey = 'account' | 'privacy' | 'support';

export const sidebarNavItems: { key: SidebarSectionKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'account', label: 'Tài khoản', icon: 'person-outline' },
  { key: 'privacy', label: 'Riêng tư', icon: 'shield-outline' },
  { key: 'support', label: 'Hỗ trợ', icon: 'help-circle-outline' },
];

export function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useProfileStyles();
  return (
    <View style={styles.sidebarSection}>
      <Text style={styles.sidebarSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function SidebarActionRow({
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
  const { colors } = useToken();
  const styles = useProfileStyles();
  const iconColor = destructive ? colors.statusErrorText : disabled ? colors.disabledText : colors.textSecondary;

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

export function NotificationPreferenceRow({
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
  const { colors } = useToken();
  const styles = useProfileStyles();
  return (
    <View style={styles.notificationRow}>
      <View style={styles.securityCopy}>
        <Text style={styles.securityTitle} numberOfLines={1}>{label}</Text>
        <Text style={styles.securityText} numberOfLines={2}>{description}</Text>
      </View>
      <Switch
        onValueChange={onValueChange}
        thumbColor={colors.textOnAccent}
        trackColor={{ false: colors.borderDefault, true: colors.accentPrimary }}
        value={value}
      />
    </View>
  );
}

export function ProfileInput({
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
  const { colors } = useToken();
  const styles = useProfileStyles();
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={styles.profileInput}
        value={value}
      />
    </View>
  );
}
