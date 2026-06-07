import { describe, expect, it } from 'vitest';

import {
  createGoogleConsentUrl,
  readGoogleSheetsConfig,
  validateGoogleSheetRows,
  verifyGoogleOAuthState,
} from '../backend/googleSheetsOAuth';

const config = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  redirectUri: 'https://example.com/backend-proxy/oauth/google/callback',
  stateSecret: 'state-secret-with-enough-entropy',
  status: 'configured' as const,
};

describe('Google Sheets OAuth boundary', () => {
  it('requires client credentials and a state secret', () => {
    expect(readGoogleSheetsConfig({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret' })).toEqual({
      missingKeys: ['GOOGLE_OAUTH_STATE_SECRET'],
      status: 'unconfigured',
    });
  });

  it('creates a least-privilege consent URL and verifies bound state', () => {
    const url = new URL(createGoogleConsentUrl(config, 'user-1', {
      nonce: 'nonce-1',
      now: 1_000,
      returnTo: '/advanced',
    }));
    const state = verifyGoogleOAuthState(url.searchParams.get('state')!, config.stateSecret, 2_000);

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('scope')).toContain('drive.file');
    expect(url.searchParams.get('scope')).toContain('spreadsheets');
    expect(state).toMatchObject({ nonce: 'nonce-1', returnTo: '/advanced', userId: 'user-1' });
  });

  it('rejects expired or modified OAuth state', () => {
    const url = new URL(createGoogleConsentUrl(config, 'user-1', { nonce: 'nonce-1', now: 1_000 }));
    const state = url.searchParams.get('state')!;

    expect(() => verifyGoogleOAuthState(state, config.stateSecret, 700_000)).toThrow('oauth_state_expired');
    expect(() => verifyGoogleOAuthState(`${state}x`, config.stateSecret, 2_000)).toThrow('oauth_state_invalid');
  });

  it('bounds export rows and cell sizes', () => {
    expect(validateGoogleSheetRows([
      ['word', 'ipa', 'definition', 'note', 'folder', 'tags', 'createdAt'],
      ['hello', '', 'greeting', '', 'Basics', '', '2026-06-07'],
    ])).toHaveLength(2);
    expect(() => validateGoogleSheetRows([['bad']])).toThrow('google_export_rows_invalid');
  });
});
