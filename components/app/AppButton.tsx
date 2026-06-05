import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps, PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import MotionPressable from '@/components/app/MotionPressable';
import { useToken } from '@/hooks/use-token';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';

type AppButtonProps = PropsWithChildren<{
  accessibilityLabel?: string;
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  iconPosition?: 'left' | 'right';
  label?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: AppButtonVariant;
}>;

export default function AppButton({
  accessibilityLabel,
  children,
  disabled,
  icon,
  iconPosition = 'left',
  label,
  onPress,
  style,
  textStyle,
  variant = 'secondary',
}: AppButtonProps) {
  const { colors, radius, shadows, spacing, typography } = useToken();
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const isIcon = variant === 'icon';
  const foreground = isPrimary ? colors.textOnAccent : colors.textPrimary;
  const iconColor = disabled ? colors.disabledText : foreground;

  const content = (
    <>
      {icon && iconPosition === 'left' ? <Ionicons name={icon} size={isIcon ? 20 : 17} color={iconColor} /> : null}
      {label ? (
        <Text
          numberOfLines={1}
          style={[
            {
              color: disabled ? colors.disabledText : foreground,
              fontSize: typography.bodySm.fontSize,
              fontWeight: '800',
            },
            textStyle,
          ]}>
          {label}
        </Text>
      ) : null}
      {children}
      {icon && iconPosition === 'right' ? <Ionicons name={icon} size={17} color={iconColor} /> : null}
    </>
  );

  return (
    <MotionPressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      hoverStyle={!disabled && !isGhost ? shadows.glow : undefined}
      style={[
        styles.base,
        {
          backgroundColor: disabled
            ? colors.disabledBg
            : isPrimary
              ? colors.accentPrimary
              : isGhost
                ? 'transparent'
                : colors.surfaceMuted,
          borderColor: disabled
            ? colors.borderMuted
            : isPrimary
              ? colors.accentPrimary
              : isGhost
                ? 'transparent'
                : colors.borderDefault,
          borderRadius: isIcon ? radius.full : radius.md,
          gap: spacing.sm,
          minHeight: isIcon ? 40 : 40,
          minWidth: isIcon ? 40 : undefined,
          paddingHorizontal: isIcon ? 0 : spacing.md,
          paddingVertical: isIcon ? 0 : spacing.sm,
        },
        isPrimary && shadows.sm,
        style,
      ]}>
      <View style={styles.content}>{content}</View>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
