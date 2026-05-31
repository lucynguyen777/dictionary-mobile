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
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
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
  fast: 100,
  normal: 250,
  slow: 400,
} as const;

/** Color palette (theme-aware) - Minimalism + Futuristic */
export const DesignSystem = {
  light: {
    colors: {
      // Canvas & backgrounds
      canvas: '#ffffff',
      canvasAlt: '#f8f8f8',
      canvasOverlay: 'rgba(0, 0, 0, 0.05)',

      // Text hierarchy
      textPrimary: '#11181C',
      textSecondary: '#687076',
      textTertiary: '#999999',
      textInverse: '#ffffff',

      // Accent colors (minimalist + futuristic)
      accentPrimary: '#0a7ea4', // Cool blue (current tint)
      accentNeo: '#7c3aed', // Electric purple (futuristic CTA)
      accentSuccess: '#10b981',
      accentWarning: '#f59e0b',
      accentError: '#ef4444',
      accentInfo: '#3b82f6',

      // Borders & dividers (subtle, minimal)
      borderDefault: '#e5e5e5',
      borderMuted: '#f0f0f0',
      borderInverse: '#333333',

      // Interactive states
      hoverOverlay: 'rgba(0, 0, 0, 0.04)',
      activeOverlay: 'rgba(0, 0, 0, 0.08)',
      disabledText: '#cccccc',
      disabledBg: '#f5f5f5',

      // Status badges
      statusSuccess: '#d1fae5',
      statusWarning: '#fef3c7',
      statusError: '#fee2e2',
      statusInfo: '#dbeafe',
    },
  },

  dark: {
    colors: {
      // Canvas & backgrounds
      canvas: '#151718',
      canvasAlt: '#1f2023',
      canvasOverlay: 'rgba(255, 255, 255, 0.05)',

      // Text hierarchy
      textPrimary: '#ECEDEE',
      textSecondary: '#9BA1A6',
      textTertiary: '#666666',
      textInverse: '#11181C',

      // Accent colors
      accentPrimary: '#ffffff', // Keep bright for contrast
      accentNeo: '#a78bfa', // Light purple for dark mode
      accentSuccess: '#6ee7b7',
      accentWarning: '#fcd34d',
      accentError: '#f87171',
      accentInfo: '#60a5fa',

      // Borders & dividers
      borderDefault: '#333333',
      borderMuted: '#2d2d2d',
      borderInverse: '#e5e5e5',

      // Interactive states
      hoverOverlay: 'rgba(255, 255, 255, 0.08)',
      activeOverlay: 'rgba(255, 255, 255, 0.12)',
      disabledText: '#444444',
      disabledBg: '#262626',

      // Status badges
      statusSuccess: '#064e3b',
      statusWarning: '#78350f',
      statusError: '#7c2d12',
      statusInfo: '#0c2d48',
    },
  },
} as const;
