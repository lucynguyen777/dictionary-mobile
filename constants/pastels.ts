// Soft pastel fills that stay light in both themes; put content on them with the
// `textOnPastel` theme token. Folder colors are user data (stored on each folder), so the
// selectable options live here rather than in the theme palettes.
export const Pastels = {
  blue: '#E8F0FF',
  green: '#EAF8F0',
  orange: '#FFF1E8',
  purple: '#F1ECFF',
  rose: '#FFEFF3',
  cyan: '#EAF7FA',
} as const;

/** Folder colors a user can pick, in picker order. */
export const FOLDER_COLOR_OPTIONS: readonly string[] = [
  Pastels.blue,
  Pastels.green,
  Pastels.orange,
  Pastels.purple,
  Pastels.rose,
  Pastels.cyan,
];

export const DEFAULT_FOLDER_COLOR = FOLDER_COLOR_OPTIONS[0];
