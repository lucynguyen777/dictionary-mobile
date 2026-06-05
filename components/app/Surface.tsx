import { PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { useToken } from '@/hooks/use-token';

type SurfaceElevation = 'none' | 'sm' | 'md' | 'lg' | 'glow';
type SurfaceVariant = 'default' | 'muted' | 'raised' | 'glass' | 'hero';

type SurfaceProps = PropsWithChildren<{
  elevation?: SurfaceElevation;
  padding?: keyof ReturnType<typeof useToken>['spacing'] | number;
  radius?: keyof ReturnType<typeof useToken>['radius'] | number;
  style?: StyleProp<ViewStyle>;
  variant?: SurfaceVariant;
  withBorder?: boolean;
}>;

export default function Surface({
  children,
  elevation = 'none',
  padding = 'lg',
  radius = 'md',
  style,
  variant = 'default',
  withBorder = true,
}: SurfaceProps) {
  const { colors, radius: radiusTokens, shadows, spacing } = useToken();
  const backgroundColor =
    variant === 'muted'
      ? colors.surfaceMuted
      : variant === 'raised'
        ? colors.surfaceRaised
        : variant === 'glass'
          ? colors.surfaceGlass
          : variant === 'hero'
            ? colors.surfaceHero
            : colors.surface;
  const resolvedPadding = typeof padding === 'number' ? padding : spacing[padding];
  const resolvedRadius = typeof radius === 'number' ? radius : radiusTokens[radius];

  return (
    <View
      style={[
        {
          backgroundColor,
          borderColor: withBorder ? colors.borderDefault : 'transparent',
          borderRadius: resolvedRadius,
          borderWidth: withBorder ? 1 : 0,
          padding: resolvedPadding,
        },
        elevation === 'none' ? null : shadows[elevation],
        style,
      ]}>
      {children}
    </View>
  );
}
