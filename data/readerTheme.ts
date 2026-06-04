export type ReaderThemeMode = 'system' | 'light' | 'dark' | 'sepia';
export type ReaderBackgroundPresetId =
  | 'auto'
  | 'white'
  | 'ivory'
  | 'sepia'
  | 'warm-amber'
  | 'paper-gray'
  | 'cool-mist'
  | 'charcoal'
  | 'black';

export type ReaderBackgroundPreset = {
  id: ReaderBackgroundPresetId;
  label: string;
  color: string;
  textColor: string;
  themeMode: ReaderThemeMode;
};

export const readerBackgroundPresets: ReaderBackgroundPreset[] = [
  { id: 'auto', label: 'Auto', color: '#F8FAFC', textColor: '#0F172A', themeMode: 'system' },
  { id: 'white', label: 'Trắng', color: '#FFFFFF', textColor: '#111827', themeMode: 'light' },
  { id: 'ivory', label: 'Ivory', color: '#FFFDF4', textColor: '#2F2A1F', themeMode: 'light' },
  { id: 'sepia', label: 'Sepia', color: '#F3E6C8', textColor: '#46331E', themeMode: 'sepia' },
  { id: 'warm-amber', label: 'Amber', color: '#FFE2A8', textColor: '#44270D', themeMode: 'sepia' },
  { id: 'paper-gray', label: 'Giấy xám', color: '#EEF1F4', textColor: '#1E293B', themeMode: 'light' },
  { id: 'cool-mist', label: 'Mát', color: '#E7F4F7', textColor: '#12343B', themeMode: 'light' },
  { id: 'charcoal', label: 'Than', color: '#24242B', textColor: '#E5E7EB', themeMode: 'dark' },
  { id: 'black', label: 'Đen', color: '#0A0A0D', textColor: '#F3F4F6', themeMode: 'dark' },
];

const legacyColorToPreset: Record<string, ReaderBackgroundPresetId> = {
  '#F8FAFC': 'auto',
  '#FFF7ED': 'sepia',
  '#ECFDF5': 'cool-mist',
  '#FDF6E3': 'ivory',
  '#F1F5F9': 'paper-gray',
  '#121016': 'black',
  '#1E1E24': 'charcoal',
};

export function getReaderBackgroundPreset(id: unknown, fallbackColor?: string): ReaderBackgroundPreset {
  const preset = readerBackgroundPresets.find((option) => option.id === id);
  if (preset) return preset;

  const fallbackPresetId = fallbackColor ? legacyColorToPreset[fallbackColor.toUpperCase()] : undefined;
  return readerBackgroundPresets.find((option) => option.id === fallbackPresetId) ?? readerBackgroundPresets[0];
}

export function normalizeReaderBackgroundPresetId(id: unknown, fallbackColor?: string): ReaderBackgroundPresetId {
  return getReaderBackgroundPreset(id, fallbackColor).id;
}

export function normalizeReaderThemeMode(value: unknown): ReaderThemeMode {
  return value === 'system' || value === 'light' || value === 'dark' || value === 'sepia' ? value : 'system';
}
