import { ReaderSettings } from '@/data/readerStore';
import { type ReaderBackgroundPresetId, type ReaderThemeMode } from '@/data/readerTheme';

export type VoiceProfile = 'female' | 'male' | 'child' | 'old';

export type ReaderSheet = 'settings' | 'toc' | null;

export type ReaderTocItem = {
  id: string;
  label: string;
  level: number;
  pct: number;
};

export type ReaderPreferences = {
  theme: ReaderThemeMode;
  backgroundPresetId: ReaderBackgroundPresetId;
  ttsVoice: VoiceProfile;
  ttsSpeed: number;
};

export const defaultPrefs: ReaderPreferences = {
  backgroundPresetId: 'auto',
  theme: 'system',
  ttsVoice: 'female',
  ttsSpeed: 1.0,
};

export const fontOptions: { label: string; value: ReaderSettings['fontFamily'] }[] = [
  { label: 'System', value: 'system' },
  { label: 'Serif (Classic)', value: 'serif' },
  { label: 'Mono (Clean)', value: 'mono' },
];

export const themeOptions: { label: string; value: ReaderThemeMode; name: string }[] = [
  { label: 'Theo hệ thống', value: 'system', name: 'phone-portrait-outline' },
  { label: 'Sáng', value: 'light', name: 'sunny-outline' },
  { label: 'Ấm', value: 'sepia', name: 'cafe-outline' },
  { label: 'Tối', value: 'dark', name: 'moon-outline' },
];

export const voiceProfiles: { label: string; value: VoiceProfile; desc: string }[] = [
  { label: 'Nữ 👩', value: 'female', desc: 'Cao, truyền cảm' },
  { label: 'Nam 👨', value: 'male', desc: 'Trầm, ấm áp' },
  { label: 'Trẻ em 👧', value: 'child', desc: 'Trong sáng, nhanh' },
  { label: 'Người già 👴', value: 'old', desc: 'Chậm rãi, từ tốn' },
];

export const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export type ReaderThemeColors = {
  bg: string;
  text: string;
  secondaryText: string;
  cardBg: string;
  border: string;
  accent: string;
  accentLight: string;
  accentText: string;
  highlightBg: string;
  highlightText: string;
  shadow: string;
};

export function buildReaderTocItems(content: string): ReaderTocItem[] {
  if (!content.trim()) return [];

  const lines = content.split(/\n+/);
  const totalLength = Math.max(1, content.length);
  let cursor = 0;
  const items: ReaderTocItem[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const headingMatch = /^(#{1,6})\s+(.{2,120})$/.exec(trimmedLine);
    const chapterMatch = /^(chapter|chương|phần|part|section)\s+[\w\dIVXLCDM.-]+[:.\-\s].{0,120}$/iu.exec(trimmedLine);
    const numberedHeadingMatch = /^\d+(\.\d+){0,3}\s+.{3,120}$/.exec(trimmedLine);
    const isAllCapsHeading =
      trimmedLine.length >= 6 &&
      trimmedLine.length <= 80 &&
      trimmedLine === trimmedLine.toLocaleUpperCase() &&
      /[A-ZÀ-Ỹ]/.test(trimmedLine);

    if (headingMatch || chapterMatch || numberedHeadingMatch || isAllCapsHeading) {
      const level = headingMatch ? Math.min(5, headingMatch[1].length - 1) : chapterMatch ? 0 : 1;
      const label = headingMatch ? headingMatch[2].trim() : trimmedLine.replace(/^#+\s*/, '');
      items.push({
        id: `toc-${index}-${cursor}`,
        label,
        level,
        pct: Math.min(100, Math.max(0, (cursor / totalLength) * 100)),
      });
    }

    cursor += line.length + 1;
  });

  return items.slice(0, 80);
}

export function getReaderTextStyle(settings: ReaderSettings) {
  return {
    fontFamily: getFontFamily(settings.fontFamily),
    fontSize: settings.fontSize,
    lineHeight: Math.round(settings.fontSize * 1.55),
  };
}

function getFontFamily(fontFamily: ReaderSettings['fontFamily']) {
  if (fontFamily === 'serif') return 'Georgia';
  if (fontFamily === 'mono') return 'Courier New';
  return undefined;
}
