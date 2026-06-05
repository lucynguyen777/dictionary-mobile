/**
 * Design system & tokens: Minimalism + Futuristic style
 * Organized by category: Colors (theme-aware), Typography, Spacing, Radius, Motion, Shadows
 * Usage: import { DesignSystem, Colors, Fonts } from '@/constants/theme'
 *        const token = DesignSystem.light.colors.accentNeo
 */

import { Platform } from 'react-native';

// ============================================================================
// LEGACY COLORS (backward compatibility; prefer DesignSystem.colors)
// ============================================================================
const tintColorLight = '#7c3aed';
const tintColorDark = '#a78bfa';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#6b7280',
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#101114',
    tint: tintColorDark,
    icon: '#a1a1aa',
    tabIconDefault: '#a1a1aa',
    tabIconSelected: tintColorDark,
  },
};

// ============================================================================
// FONTS (unchanged)
// ============================================================================
export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ============================================================================
// NEW DESIGN SYSTEM: Minimalism + Futuristic
// ============================================================================

/** Spacing tokens (8px base rhythm) */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Border radius tokens (minimal: 6-12px, full circle for badges/avatars) */
export const Radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

/** Typography scale (base: body 16px, adjusted for hierarchy) */
export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  captionSmall: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
} as const;

/** Motion/animation durations (milliseconds) */
export const Motion = {
  instant: 80,
  press: 120,
  fast: 160,
  normal: 240,
  entrance: 320,
  slow: 400,
  reduced: 0,
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0, 0, 0, 1)',
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  },
} as const;

/** Color palette (theme-aware) - Minimalism + Futuristic */
export const DesignSystem = {
  light: {
    colors: {
      // Canvas & backgrounds
      canvas: '#ffffff',
      canvasAlt: '#f8fafc',
      canvasElevated: '#ffffff',
      canvasOverlay: 'rgba(0, 0, 0, 0.05)',
      surface: '#ffffff',
      surfaceMuted: '#f8fafc',
      surfaceRaised: '#ffffff',
      surfaceGlass: 'rgba(255, 255, 255, 0.84)',
      surfaceHero: '#1F1B2E',
      surfaceHeroAlt: '#241B36',

      // Text hierarchy
      textPrimary: '#11181C',
      textSecondary: '#5f6673',
      textTertiary: '#8b92a1',
      textInverse: '#ffffff',
      textOnAccent: '#ffffff',
      textOnHero: '#ffffff',
      textOnHeroMuted: '#d7e3f1',

      // Accent colors (minimalist + futuristic)
      accentPrimary: '#7c3aed', // Electric purple for primary actions
      accentNeo: '#06b6d4', // Cyan signal for futuristic highlights
      accentSoft: '#f3e8ff',
      accentNeoSoft: '#ecfeff',
      accentSuccess: '#10b981',
      accentWarning: '#f59e0b',
      accentError: '#ef4444',
      accentInfo: '#0891b2',

      // Borders & dividers (subtle, minimal)
      borderDefault: '#e5e7eb',
      borderMuted: '#eef2f7',
      borderInverse: '#27272a',
      focusRing: '#a78bfa',
      shadowSoft: 'rgba(17, 24, 39, 0.08)',

      // Interactive states
      hoverOverlay: 'rgba(0, 0, 0, 0.04)',
      activeOverlay: 'rgba(0, 0, 0, 0.08)',
      pressedOverlay: 'rgba(124, 58, 237, 0.12)',
      focusOverlay: 'rgba(124, 58, 237, 0.14)',
      disabledText: '#a1a1aa',
      disabledBg: '#f4f4f5',

      // Status badges
      statusSuccess: '#d1fae5',
      statusWarning: '#fef3c7',
      statusError: '#fee2e2',
      statusInfo: '#cffafe',
    },
    shadows: {
      none: {
        boxShadow: 'none',
        elevation: 0,
        shadowOpacity: 0,
      },
      sm: {
        boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.06)',
        elevation: 2,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      md: {
        boxShadow: '0px 6px 14px rgba(15, 23, 42, 0.10)',
        elevation: 8,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
      },
      lg: {
        boxShadow: '0px 14px 28px rgba(15, 23, 42, 0.14)',
        elevation: 18,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
      },
      glow: {
        boxShadow: '0px 0px 0px 1px rgba(124, 58, 237, 0.22), 0px 10px 24px rgba(124, 58, 237, 0.16)',
        elevation: 10,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
      },
    },
    interactions: {
      pressScale: 0.97,
      hoverScale: 1.012,
      liftY: -2,
      reducedScale: 1,
    },
  },

  dark: {
    colors: {
      // Canvas & backgrounds
      canvas: '#101114',
      canvasAlt: '#18181b',
      canvasElevated: '#202026',
      canvasOverlay: 'rgba(255, 255, 255, 0.05)',
      surface: '#18181b',
      surfaceMuted: '#202026',
      surfaceRaised: '#24242c',
      surfaceGlass: 'rgba(24, 24, 27, 0.86)',
      surfaceHero: '#17131F',
      surfaceHeroAlt: '#20182D',

      // Text hierarchy
      textPrimary: '#ECEDEE',
      textSecondary: '#a1a1aa',
      textTertiary: '#71717a',
      textInverse: '#11181C',
      textOnAccent: '#ffffff',
      textOnHero: '#f8fafc',
      textOnHeroMuted: '#c7c7d1',

      // Accent colors
      accentPrimary: '#a78bfa',
      accentNeo: '#22d3ee',
      accentSoft: '#2e2447',
      accentNeoSoft: '#12353d',
      accentSuccess: '#6ee7b7',
      accentWarning: '#fcd34d',
      accentError: '#f87171',
      accentInfo: '#67e8f9',

      // Borders & dividers
      borderDefault: '#303038',
      borderMuted: '#27272f',
      borderInverse: '#e5e5e5',
      focusRing: '#c4b5fd',
      shadowSoft: 'rgba(0, 0, 0, 0.24)',

      // Interactive states
      hoverOverlay: 'rgba(255, 255, 255, 0.08)',
      activeOverlay: 'rgba(255, 255, 255, 0.12)',
      pressedOverlay: 'rgba(167, 139, 250, 0.18)',
      focusOverlay: 'rgba(167, 139, 250, 0.20)',
      disabledText: '#444444',
      disabledBg: '#262626',

      // Status badges
      statusSuccess: '#064e3b',
      statusWarning: '#78350f',
      statusError: '#7c2d12',
      statusInfo: '#164e63',
    },
    shadows: {
      none: {
        boxShadow: 'none',
        elevation: 0,
        shadowOpacity: 0,
      },
      sm: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.18)',
        elevation: 2,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 2,
      },
      md: {
        boxShadow: '0px 8px 18px rgba(0, 0, 0, 0.26)',
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.24,
        shadowRadius: 16,
      },
      lg: {
        boxShadow: '0px 18px 36px rgba(0, 0, 0, 0.34)',
        elevation: 18,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.30,
        shadowRadius: 28,
      },
      glow: {
        boxShadow: '0px 0px 0px 1px rgba(167, 139, 250, 0.24), 0px 12px 28px rgba(34, 211, 238, 0.12)',
        elevation: 10,
        shadowColor: '#22d3ee',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
      },
    },
    interactions: {
      pressScale: 0.97,
      hoverScale: 1.012,
      liftY: -2,
      reducedScale: 1,
    },
  },
} as const;
