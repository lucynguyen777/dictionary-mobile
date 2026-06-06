import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  readSupabaseAuthConfig,
  SUPABASE_PUBLISHABLE_KEY_ENV,
  SUPABASE_URL_ENV,
} from '../data/authConfig';

describe('readSupabaseAuthConfig', () => {
  it('returns missing env keys without throwing', () => {
    expect(readSupabaseAuthConfig({})).toEqual({
      status: 'unconfigured',
      missingKeys: [SUPABASE_URL_ENV, SUPABASE_PUBLISHABLE_KEY_ENV],
    });
  });

  it('trims and returns configured Supabase auth env', () => {
    expect(
      readSupabaseAuthConfig({
        [SUPABASE_URL_ENV]: ' https://project.supabase.co ',
        [SUPABASE_PUBLISHABLE_KEY_ENV]: ' publishable-key ',
      })
    ).toEqual({
      status: 'configured',
      url: 'https://project.supabase.co',
      publishableKey: 'publishable-key',
    });
  });

  it('uses direct Expo public env access so static bundles receive Supabase config', () => {
    const source = readFileSync(resolve(process.cwd(), 'data/authConfig.ts'), 'utf8');

    expect(source).toContain('process.env.EXPO_PUBLIC_SUPABASE_URL');
    expect(source).toContain('process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  });
});
