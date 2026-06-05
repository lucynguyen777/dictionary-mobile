import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: {
    select: (options: Record<string, unknown>) => options.web ?? options.default,
  },
}));

import { DesignSystem, Motion, Radius, Spacing } from '../constants/theme';

describe('design system tokens', () => {
  it('keeps DESIGN.md as the app-specific design-system source of truth', () => {
    const designGuide = readFileSync(resolve(process.cwd(), 'DESIGN.md'), 'utf8');

    for (const phrase of [
      'Hick',
      'Fitts',
      '4px grid',
      'one primary CTA per section',
      'No inner shadows',
      'reduced motion',
      'Pattern Library',
      'Style Guide',
    ]) {
      expect(designGuide).toContain(phrase);
    }
  });

  it('keeps spacing and radius on the 4px grid', () => {
    for (const value of Object.values(Spacing)) {
      expect(value % 4).toBe(0);
    }

    for (const [key, value] of Object.entries(Radius)) {
      if (key === 'full') continue;
      expect(value % 2).toBe(0);
    }
  });

  it('defines semantic light and dark surfaces without falling back to raw white cards in dark mode', () => {
    expect(DesignSystem.light.colors.surface).toBeTruthy();
    expect(DesignSystem.light.colors.surfaceRaised).toBeTruthy();
    expect(DesignSystem.dark.colors.surface).not.toBe('#FFFFFF');
    expect(DesignSystem.dark.colors.surfaceRaised).not.toBe('#FFFFFF');
    expect(DesignSystem.dark.colors.textPrimary).not.toBe('#0F172A');
  });

  it('keeps functional motion within the 400ms response budget', () => {
    expect(Motion.press).toBeLessThanOrEqual(160);
    expect(Motion.fast).toBeLessThanOrEqual(200);
    expect(Motion.normal).toBeLessThanOrEqual(260);
    expect(Motion.entrance).toBeLessThanOrEqual(400);
    expect(Motion.slow).toBeLessThanOrEqual(400);
    expect(Motion.reduced).toBe(0);
  });

  it('defines neutral and accent glow shadows for both themes', () => {
    expect(DesignSystem.light.shadows.md.boxShadow).toContain('rgba');
    expect(DesignSystem.dark.shadows.md.boxShadow).toContain('rgba');
    expect(DesignSystem.light.shadows.glow.boxShadow).toContain('124, 58, 237');
    expect(DesignSystem.dark.shadows.glow.boxShadow).toContain('167, 139, 250');
  });
});
