import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const eas = JSON.parse(readFileSync('eas.json', 'utf8'));

describe('EAS Update readiness (plan 7.2)', () => {
  it('ties OTA updates to the app version so JS updates never reach an incompatible native build', () => {
    expect(app.runtimeVersion).toEqual({ policy: 'appVersion' });
    expect(app.updates).toMatchObject({ checkAutomatically: 'ON_LOAD', enabled: true, fallbackToCacheTimeout: 0 });
  });

  it('gives every build profile its own update channel', () => {
    expect(Object.fromEntries(Object.entries(eas.build).map(([name, profile]) => [name, (profile as { channel?: string }).channel]))).toEqual({
      development: 'development',
      'development-simulator': 'development',
      preview: 'preview',
      production: 'production',
    });
  });

  it('only turns on native recognition in development builds', () => {
    expect(eas.build.development.env.EXPO_PUBLIC_ENABLE_NATIVE_RECOGNITION).toBe('true');
    expect(eas.build.preview.env.EXPO_PUBLIC_ENABLE_NATIVE_RECOGNITION).toBeUndefined();
    expect(eas.build.production.env.EXPO_PUBLIC_ENABLE_NATIVE_RECOGNITION).toBeUndefined();
    expect(eas.build.development.env.EXPO_PUBLIC_READER_ENABLE_NATIVE_PDF).toBe('true');
    expect(eas.build.production.env.EXPO_PUBLIC_READER_ENABLE_NATIVE_PDF).toBeUndefined();
  });
});
