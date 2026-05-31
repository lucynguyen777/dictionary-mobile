/**
 * Hook to access design system tokens (spacing, radius, typography, motion, colors)
 * Usage: const { spacing, radius, colors } = useToken()
 *        Then use: spacing.md, radius.sm, colors.accentNeo, etc.
 */

import {
    DesignSystem,
    Motion,
    Radius,
    Spacing,
    Typography,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useToken() {
  const theme = useColorScheme() ?? 'light';

  return {
    spacing: Spacing,
    radius: Radius,
    typography: Typography,
    motion: Motion,
    colors: DesignSystem[theme].colors,
    theme,
  };
}
