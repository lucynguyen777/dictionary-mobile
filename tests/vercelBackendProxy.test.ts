import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { afterEach, describe, expect, it } from 'vitest';

import {
  createBackendProxyHandler,
  resolveBackendProxyRequestUrl,
} from '../api/backend-proxy';
import type { FeedbackStore } from '../backend/feedback';

const configuredEnv = {
  DEEPL_API_BASE_URL: 'https://api-free.deepl.com',
  DEEPL_API_KEY: 'test-deepl-key',
  OPENAI_API_KEY: 'test-openai-key',
  OPENAI_TEXT_MODEL: 'gpt-4.1-mini',
};

let server: Server | null = null;

afterEach(async () => {
  if (!server) return;

  await new Promise<void>((resolve) => server?.close(() => resolve()));
  server = null;
});

describe('Vercel backend proxy function', () => {
  it('rewrites the Vercel query path to the Express proxy route', () => {
    const url = resolveBackendProxyRequestUrl({
      query: { path: 'proxy/quota' },
      url: '/api/backend-proxy?path=proxy%2Fquota&debug=1',
    } as never);

    expect(url).toBe('/proxy/quota?debug=1');
  });

  it('returns 401 without a bearer token', async () => {
    const baseUrl = await startProxyServer();
    const response = await fetch(`${baseUrl}/api/backend-proxy?path=proxy/translate/text`, {
      method: 'POST',
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('unauthorized');
  });

  it('returns provider-unconfigured after auth passes but provider env is missing', async () => {
    const baseUrl = await startProxyServer({
      env: {
        ...configuredEnv,
        DEEPL_API_KEY: '',
        OPENAI_API_KEY: '',
      },
    });
    const response = await fetch(`${baseUrl}/api/backend-proxy?path=proxy/translate/text`, {
      headers: { Authorization: 'Bearer valid-token' },
      method: 'POST',
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe('provider_unconfigured');
  });

  it('serves quota through the rewritten backend-proxy route', async () => {
    const baseUrl = await startProxyServer();
    const response = await fetch(`${baseUrl}/api/backend-proxy?path=proxy/quota`, {
      headers: { Authorization: 'Bearer valid-token' },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.translation.daily).toBe(0);
    expect(body.aiChat.daily).toBe(0);
  });

  it('serves authenticated feedback through the rewritten route', async () => {
    const feedbackStore: FeedbackStore = {
      configured: true,
      countRecent: async () => 0,
      submit: async () => ({ id: 'feedback-id' }),
    };
    const baseUrl = await startProxyServer({ feedbackStore });
    const response = await fetch(`${baseUrl}/api/backend-proxy?path=proxy/feedback`, {
      body: JSON.stringify({ category: 'bug', message: 'This feedback message is long enough.' }),
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: 'feedback-id', status: 'received' });
  });
});

async function startProxyServer(options: { env?: Record<string, string>; feedbackStore?: FeedbackStore } = {}) {
  const http = await import('http');
  const handler = createBackendProxyHandler({
    env: options.env ?? configuredEnv,
    feedbackStore: options.feedbackStore,
    verifyAuth: async (token) => (token === 'valid-token' ? { userId: 'test-user-id' } : null),
  });

  return new Promise<string>((resolve) => {
    server = http.createServer((req, res) => handler(req, res));
    server.listen(0, () => {
      const addr = server?.address() as AddressInfo;
      resolve(`http://localhost:${addr.port}`);
    });
  });
}
