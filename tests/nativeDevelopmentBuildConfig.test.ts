import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const appConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'app.json'), 'utf8')).expo;
const easConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'eas.json'), 'utf8'));
const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));

describe('native recognition development build configuration', () => {
  it('configures a development client and purpose-specific recognition permissions', () => {
    const plugins = appConfig.plugins;

    expect(plugins).toContain('expo-dev-client');
    expect(plugins).toEqual(expect.arrayContaining([
      expect.arrayContaining(['expo-camera', expect.objectContaining({ cameraPermission: expect.stringContaining('camera') })]),
      expect.arrayContaining([
        'expo-speech-recognition',
        expect.objectContaining({
          microphonePermission: expect.stringContaining('micro'),
          speechRecognitionPermission: expect.stringContaining('giọng nói'),
        }),
      ]),
    ]));
  });

  it('provides physical-device and simulator development build profiles', () => {
    expect(easConfig.build.development).toMatchObject({
      developmentClient: true,
      distribution: 'internal',
    });
    expect(easConfig.build['development-simulator']).toMatchObject({
      developmentClient: true,
      ios: { simulator: true },
    });
  });

  it('keeps Chandra separately hosted and documents the public endpoint boundary', () => {
    const docs = readFileSync(resolve(process.cwd(), 'docs/native-recognition-development-build.md'), 'utf8');

    expect(packageJson.dependencies['expo-dev-client']).toMatch(/^~6\./);
    expect(docs).toContain('Chandra is not bundled into the mobile app');
    expect(docs).toContain('EXPO_PUBLIC_CHANDRA_OCR_URL');
    expect(docs).toContain('Do not put provider credentials');
  });
});
