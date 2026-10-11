const platform = vi.hoisted(() => ({ OS: 'ios' }));
vi.mock('react-native', () => ({ Platform: platform }));
vi.mock('expo/fetch', () => ({ fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args) }));
const authClient = vi.hoisted(() => ({ accessToken: null as string | null }));
vi.mock('../data/supabaseAuthClient', () => ({
  getSharedSupabaseAuthClient: () => authClient.accessToken
    ? {
      client: { auth: { getSession: async () => ({ data: { session: { access_token: authClient.accessToken } } }) } },
      status: 'configured',
    }
    : { status: 'unconfigured' },
}));

import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveBackendProxyBaseUrl } from '../data/backendProxyClient';

afterEach(() => {
  authClient.accessToken = null;
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('resolveBackendProxyBaseUrl', () => {
  it.each([
    ['web', undefined, ''],
    ['web', 'https://other.example', ''],
    ['ios', undefined, null],
    ['android', '   ', null],
    ['ios', 'https://dictionaire-mobile.vercel.app/', 'https://dictionaire-mobile.vercel.app'],
    ['android', 'http://10.0.2.2:3001', 'http://10.0.2.2:3001'],
    ['ios', 'http://insecure.example', null],
    ['ios', 'javascript:alert(1)', null],
  ])('%s with %s resolves to %s', (os, url, expected) => {
    expect(resolveBackendProxyBaseUrl(os, url)).toBe(expected);
  });
});

describe('proxy requests on native', () => {
  it('fails fast with a clear code when no backend URL is configured', async () => {
    vi.stubEnv('EXPO_PUBLIC_BACKEND_PROXY_URL', '');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { getQuota } = await import('../data/backendProxyClient');

    await expect(getQuota()).rejects.toMatchObject({ code: 'backend_proxy_unconfigured', status: 503 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls the configured absolute URL', async () => {
    vi.stubEnv('EXPO_PUBLIC_BACKEND_PROXY_URL', 'https://api.example');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    const { getQuota } = await import('../data/backendProxyClient');

    await getQuota();
    expect(fetchSpy).toHaveBeenCalledWith('https://api.example/backend-proxy/proxy/quota', expect.anything());
  });
});

describe('submitFeedback', () => {
  it('posts the trimmed message to the feedback route', async () => {
    vi.stubEnv('EXPO_PUBLIC_BACKEND_PROXY_URL', 'https://api.example');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'f1', status: 'received' }), { status: 201 })
    );
    const { submitFeedback } = await import('../data/backendProxyClient');

    await expect(submitFeedback({ category: 'bug', context: 'app 1.7.0 · ios', message: '  Nút lưu không phản hồi  ' }))
      .resolves.toEqual({ id: 'f1', status: 'received' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.example/backend-proxy/proxy/feedback');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ category: 'bug', context: 'app 1.7.0 · ios', message: 'Nút lưu không phản hồi' });
  });

  it('surfaces the rate-limit code from the proxy', async () => {
    vi.stubEnv('EXPO_PUBLIC_BACKEND_PROXY_URL', 'https://api.example');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'feedback_rate_limited' } }), { status: 429 })
    );
    const { submitFeedback } = await import('../data/backendProxyClient');

    await expect(submitFeedback({ category: 'other', context: '', message: 'Một phản hồi đủ dài' }))
      .rejects.toMatchObject({ code: 'feedback_rate_limited', status: 429 });
  });
});

function sseResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  }), { headers: { 'content-type': 'text/event-stream; charset=utf-8' }, status: 200 });
}

const chatRequest = { goal: 'conversation' as const, learningLanguage: 'EN', messages: [{ content: 'Hi', role: 'user' as const }] };

describe('aiChatStream', () => {
  it('emits deltas as they arrive and resolves with the full reply', async () => {
    vi.stubEnv('EXPO_PUBLIC_BACKEND_PROXY_URL', 'https://api.example');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse([
      'data: {"delta":"Hel"}\n\ndata: {"del',
      'ta":"lo!"}\n\n',
      'data: {"done":true,"provider":"openai","totalTokens":12}\n\n',
    ]));
    const { aiChatStream } = await import('../data/backendProxyClient');
    const deltas: string[] = [];

    await expect(aiChatStream(chatRequest, { onDelta: (text) => deltas.push(text) }))
      .resolves.toEqual({ content: 'Hello!', provider: 'openai', totalTokens: 12 });
    expect(deltas).toEqual(['Hel', 'lo!']);
    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({ stream: true });
    expect((init?.headers as Record<string, string>).Accept).toBe('text/event-stream');
  });

  it('rejects with the provider error sent mid-stream', async () => {
    vi.stubEnv('EXPO_PUBLIC_BACKEND_PROXY_URL', 'https://api.example');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse([
      'data: {"delta":"Par"}\n\n',
      'data: {"error":{"code":"provider_error","message":"AI provider is unavailable."}}\n\n',
    ]));
    const { aiChatStream } = await import('../data/backendProxyClient');

    await expect(aiChatStream(chatRequest, { onDelta: () => undefined }))
      .rejects.toMatchObject({ code: 'provider_error', status: 502 });
  });

  it('treats a stream without a done event as interrupted', async () => {
    vi.stubEnv('EXPO_PUBLIC_BACKEND_PROXY_URL', 'https://api.example');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse(['data: {"delta":"Par"}\n\n']));
    const { aiChatStream } = await import('../data/backendProxyClient');

    await expect(aiChatStream(chatRequest, { onDelta: () => undefined }))
      .rejects.toMatchObject({ code: 'ai_stream_interrupted' });
  });

  it('falls back to a JSON reply from a proxy that does not stream', async () => {
    vi.stubEnv('EXPO_PUBLIC_BACKEND_PROXY_URL', 'https://api.example');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ content: 'Whole reply', provider: 'openai', totalTokens: 9 }),
      { headers: { 'content-type': 'application/json' }, status: 200 },
    ));
    const { aiChatStream } = await import('../data/backendProxyClient');
    const deltas: string[] = [];

    await expect(aiChatStream(chatRequest, { onDelta: (text) => deltas.push(text) }))
      .resolves.toMatchObject({ content: 'Whole reply' });
    expect(deltas).toEqual(['Whole reply']);
  });

  it('maps quota errors before the stream starts', async () => {
    vi.stubEnv('EXPO_PUBLIC_BACKEND_PROXY_URL', 'https://api.example');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ error: { code: 'quota_exceeded', message: 'Daily AI limit reached.' } }),
      { status: 429 },
    ));
    const { aiChatStream } = await import('../data/backendProxyClient');

    await expect(aiChatStream(chatRequest, { onDelta: () => undefined }))
      .rejects.toMatchObject({ code: 'quota_exceeded', status: 429 });
  });
});

describe('getQuota', () => {
  it('reads the usage shape the proxy actually returns', async () => {
    const { createServer } = await import('../backend/server');
    const { app } = createServer({
      env: { DEEPL_API_BASE_URL: 'https://api-free.deepl.com', DEEPL_API_KEY: 'k', OPENAI_API_KEY: 'k', OPENAI_TEXT_MODEL: 'gpt-4.1-mini' },
      verifyAuth: async () => ({ userId: 'u1' }),
    });
    // Same path layout as the Vercel rewrite: /backend-proxy/<route>.
    const { default: express } = await import('express');
    const host = express().use('/backend-proxy', app);
    const server = await new Promise<import('http').Server>((resolve) => {
      const listening = host.listen(0, () => resolve(listening));
    });
    const { port } = server.address() as import('net').AddressInfo;
    vi.stubEnv('EXPO_PUBLIC_BACKEND_PROXY_URL', `http://localhost:${port}`);
    authClient.accessToken = 'session-token';
    try {
      const { getQuota } = await import('../data/backendProxyClient');
      const quota = await getQuota();
      expect(quota.aiChat).toEqual({ daily: 0, dailyLimit: expect.any(Number), monthly: 0, monthlyLimit: expect.any(Number) });
      expect(quota.translation?.dailyLimit).toBeGreaterThan(0);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
