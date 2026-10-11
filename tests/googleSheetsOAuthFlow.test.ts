import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGoogleConsentUrl, normalizeReturnTo, readGoogleSheetsConfig } from '../backend/googleSheetsOAuth';
import { createServer } from '../backend/server';
import type { GoogleSheetsStore } from '../backend/googleSheetsStore';

const env = {
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  GOOGLE_OAUTH_REDIRECT_URI: 'https://example.com/backend-proxy/oauth/google/callback',
  GOOGLE_OAUTH_STATE_SECRET: 'state-secret',
};
const config = readGoogleSheetsConfig(env);
if (config.status !== 'configured') throw new Error('test config must be configured');

const sessions: Record<string, string> = { 'alice-token': 'alice', 'mallory-token': 'mallory' };

function createStore() {
  const saved = new Map<string, string>();
  const store: GoogleSheetsStore = {
    configured: true,
    loadRefreshToken: vi.fn(async (userId: string) => saved.get(userId) ?? null),
    revoke: vi.fn(async (userId: string) => { saved.delete(userId); }),
    saveRefreshToken: vi.fn(async (userId: string, token: string) => { saved.set(userId, token); }),
  };
  return { saved, store };
}

let server: Server | null = null;

async function start(store: GoogleSheetsStore) {
  const { app } = createServer({
    env,
    googleSheetsStore: store,
    verifyAuth: async (token) => (sessions[token] ? { userId: sessions[token] } : null),
  });
  return new Promise<string>((resolve) => {
    server = app.listen(0, () => resolve(`http://127.0.0.1:${(server!.address() as AddressInfo).port}`));
  });
}

function stateFor(userId: string, returnTo?: string) {
  const url = new URL(createGoogleConsentUrl(config as Extract<typeof config, { status: 'configured' }>, userId, {
    nonce: 'nonce',
    returnTo,
  }));
  return url.searchParams.get('state')!;
}

function mockGoogle() {
  const realFetch = globalThis.fetch;
  const calls: string[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      calls.push('token');
      return new Response(JSON.stringify({ access_token: 'at', expires_in: 3600, refresh_token: 'rt-from-google' }));
    }
    if (url.startsWith('https://oauth2.googleapis.com/revoke')) {
      calls.push(`revoke:${new URLSearchParams(String(init?.body)).get('token')}`);
      return new Response('', { status: 200 });
    }
    return realFetch(input, init);
  });
  return calls;
}

afterEach(async () => {
  vi.restoreAllMocks();
  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
  server = null;
});

describe('normalizeReturnTo', () => {
  it.each([
    ['/advanced', '/advanced'],
    ['/folder/abc-1', '/folder/abc-1'],
    ['//evil.example', '/advanced'],
    ['/\\evil.example', '/advanced'],
    ['https://evil.example', '/advanced'],
    ['/advanced?x=1', '/advanced'],
    ['/a/../b', '/advanced'],
    [undefined, '/advanced'],
  ])('maps %s to %s', (input, expected) => {
    expect(normalizeReturnTo(input)).toBe(expected);
  });
});

describe('Google OAuth callback', () => {
  it('does not store tokens and hands code plus state back to the app', async () => {
    const { store } = createStore();
    const calls = mockGoogle();
    const baseUrl = await start(store);
    const state = stateFor('alice');

    const response = await fetch(`${baseUrl}/oauth/google/callback?code=abc&state=${state}`, { redirect: 'manual' });

    expect(response.status).toBe(302);
    const location = new URL(response.headers.get('location')!, 'https://app.example');
    expect(location.pathname).toBe('/advanced');
    expect(location.searchParams.get('googleSheetsCode')).toBe('abc');
    expect(location.searchParams.get('googleSheetsState')).toBe(state);
    expect(store.saveRefreshToken).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it('never redirects off-site even with a forged-looking returnTo', async () => {
    const baseUrl = await start(createStore().store);
    const response = await fetch(
      `${baseUrl}/oauth/google/callback?code=abc&state=${stateFor('alice', '//evil.example')}`,
      { redirect: 'manual' }
    );
    expect(response.headers.get('location')).toMatch(/^\/advanced\?/);
  });

  it('reports consent denial without leaking error details', async () => {
    const baseUrl = await start(createStore().store);
    const response = await fetch(
      `${baseUrl}/oauth/google/callback?error=access_denied&state=${stateFor('alice')}`,
      { redirect: 'manual' }
    );
    expect(response.headers.get('location')).toBe('/advanced?googleSheets=denied');
  });

  it('rejects tampered state', async () => {
    const baseUrl = await start(createStore().store);
    const response = await fetch(`${baseUrl}/oauth/google/callback?code=abc&state=${stateFor('alice')}x`);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: 'oauth_state_invalid' } });
  });
});

describe('POST /proxy/google-sheets/complete', () => {
  async function complete(baseUrl: string, token: string, state: string) {
    return fetch(`${baseUrl}/proxy/google-sheets/complete`, {
      body: JSON.stringify({ code: 'abc', state }),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      method: 'POST',
    });
  }

  it('stores the refresh token for the user who started the flow', async () => {
    const { saved, store } = createStore();
    mockGoogle();
    const baseUrl = await start(store);

    const response = await complete(baseUrl, 'alice-token', stateFor('alice'));

    expect(response.status).toBe(200);
    expect(saved.get('alice')).toBe('rt-from-google');
  });

  it('refuses to link a victim Google account to the attacker who created the consent URL', async () => {
    const { saved, store } = createStore();
    const calls = mockGoogle();
    const baseUrl = await start(store);

    // Mallory sends Alice a consent URL carrying Mallory's state; Alice's app session completes it.
    const response = await complete(baseUrl, 'alice-token', stateFor('mallory'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: 'oauth_state_user_mismatch' } });
    expect(saved.size).toBe(0);
    expect(calls).toEqual([]);
  });
});

describe('POST /proxy/google-sheets/revoke', () => {
  it('revokes the token at Google before deleting it', async () => {
    const { saved, store } = createStore();
    saved.set('alice', 'stored-rt');
    const calls = mockGoogle();
    const baseUrl = await start(store);

    const response = await fetch(`${baseUrl}/proxy/google-sheets/revoke`, {
      headers: { Authorization: 'Bearer alice-token' },
      method: 'POST',
    });

    expect(response.status).toBe(200);
    expect(calls).toEqual(['revoke:stored-rt']);
    expect(saved.has('alice')).toBe(false);
  });
});
