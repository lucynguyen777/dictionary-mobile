import type { ReaderThemeColors } from '@/components/reader/readerOptions';

// Reading themes for the Reader page (content colors, chosen by the reader, independent of the app
// theme). Kept here, not in screens, per DESIGN.md.
export const READER_THEME_COLORS: Record<'dark' | 'light' | 'sepia', ReaderThemeColors> = {
  dark: {
    bg: '#0F0E17',
    text: '#E2E8F7',
    secondaryText: '#94A3B8',
    cardBg: '#1C1A27',
    border: '#2A273F',
    accent: '#A998F4',
    accentLight: '#2C254A',
    accentText: '#C5BAFF',
    highlightBg: '#3B2F5C',
    highlightText: '#FFD0FF',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  sepia: {
    bg: '#FDF6E3',
    text: '#5C4033',
    secondaryText: '#8D6E63',
    cardBg: '#F5EBD0',
    border: '#E5D8B6',
    accent: '#8B5A2B',
    accentLight: '#F3E5AB',
    accentText: '#5C4033',
    highlightBg: '#F5DEB3',
    highlightText: '#8B4513',
    shadow: 'rgba(92, 64, 51, 0.08)',
  },
  light: {
    bg: '#F8FAFC',
    text: '#0F172A',
    secondaryText: '#64748B',
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    accent: '#7C3AED',
    accentLight: '#F5F3FF',
    accentText: '#7C3AED',
    highlightBg: '#FEF3C7',
    highlightText: '#92400E',
    shadow: 'rgba(15, 23, 42, 0.05)',
  },
};

// Reader colors shared by every reading theme: text on the accent color, the tapped-phrase
// selection and the saved confirmation.
export const READER_FIXED_COLORS = {
  danger: '#DC2626',
  onAccent: '#FFFFFF',
  onAccentMuted: '#E2E8F0',
  savedText: '#166534',
  selectionBg: '#FEF3C7',
  selectionText: '#1F2937',
};
