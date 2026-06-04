import { describe, expect, it } from 'vitest';

import {
  getReaderBackgroundPreset,
  normalizeReaderBackgroundPresetId,
  readerBackgroundPresets,
} from '../data/readerTheme';

describe('reader background presets', () => {
  it('uses distinct preset colors and labels', () => {
    const colors = new Set(readerBackgroundPresets.map((preset) => preset.color));
    const labels = new Set(readerBackgroundPresets.map((preset) => preset.label));

    expect(colors.size).toBe(readerBackgroundPresets.length);
    expect(labels.size).toBe(readerBackgroundPresets.length);
  });

  it('normalizes legacy reader colors to stable preset ids', () => {
    expect(normalizeReaderBackgroundPresetId(undefined, '#FFF7ED')).toBe('sepia');
    expect(normalizeReaderBackgroundPresetId(undefined, '#ECFDF5')).toBe('cool-mist');
    expect(getReaderBackgroundPreset('warm-amber').color).toBe('#FFE2A8');
  });
});
