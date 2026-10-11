const platform = vi.hoisted(() => ({ OS: 'ios' }));
vi.mock('react-native', () => ({ Platform: platform }));
vi.mock('../data/supabaseAuthClient', () => ({
  getSharedSupabaseAuthClient: () => ({ status: 'unconfigured' }),
}));

import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveBackendProxyBaseUrl } from '../data/backendProxyClient';

afterEach(() => {
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
