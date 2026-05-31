/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, DesignSystem } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];
  const colors = DesignSystem[theme].colors;

  if (colorFromProps) {
    return colorFromProps;
  }

  const tokenFallbacks: Record<keyof typeof Colors.light & keyof typeof Colors.dark, string> = {
    background: colors.canvas,
    icon: colors.textSecondary,
    tabIconDefault: colors.textSecondary,
    tabIconSelected: colors.accentPrimary,
    text: colors.textPrimary,
    tint: colors.accentPrimary,
  };

  return tokenFallbacks[colorName] ?? Colors[theme][colorName];
}
