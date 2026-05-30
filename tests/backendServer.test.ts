import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const DEFAULT_LIMITS = {
  dailyAiRequestLimitPerUser: 25,
  dailyTranslationCharacterLimitPerUser: 20_000,
  maxGlossaryEntries: 1_000,
  maxTextInputChars: 5_000,
  monthlyCharacterLimitPerUser: 200_000,
  proxyLogRetentionDays: 30,
};

function buildEnv(
  overrides: Record<string, string> = {}
): Record<string, string> {
  return {
    DEEPL_API_KEY: 'test-deepl-key',
    DEEPL_API_BASE_URL: 'https://api-free.deepl.com',
    OPENAI_API_KEY: 'test-openai-key',
    OPENAI_TEXT_MODEL: 'gpt-4.1-mini',
    ...overrides,
  };
}

function fakeVerifyAuth(token: string) {
  if (token === 'valid-token' || token === 'quota-user') {
    return Promise.resolve({ userId: token === 'quota-user' ? 'quota-user-id' : 'test-user-id' });
  }
  return Promise.resolve(null);
}

let server: Server | null = null;
let baseUrl: string = '';

async function startTestServer(env: Record<string, string>) {
  const { createServer } = await import('../backend/server');
  const { app } = createServer({
    env,
    verifyAuth: fakeVerifyAuth,
  });

  return new Promise<string>((resolve) => {
    server = app.listen(0, () => {
      const addr = server?.address() as AddressInfo;
      resolve(`http://localhost:${addr.port}`);
    });
  });
}

async function stopServer() {
  if (server) {
    await new Promise<void>((resolve) => server?.close(() => resolve()));
    server = null;
    baseUrl = '';
  }
}

async function fetchJson(urlStr: string, options: RequestInit = {}) {
  const http = await import('http');
  return new Promise<{ body: any; status: number }>((resolve, reject) => {
    const url = new URL(urlStr);
    const req = http.request(
      url.toString(),
      {
        method: options.method || 'GET',
        headers: options.headers as any,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let body = null;
          try {
            body = JSON.parse(data);
          } catch {
            // ignore
          }
          resolve({ body, status: res.statusCode || 200 });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

describe('backend server', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
  });

  afterEach(async () => {
    await stopServer();
  });

  describe('health', () => {
    it('returns ok when configured', async () => {
      baseUrl = await startTestServer(buildEnv());
      const { body, status } = await fetchJson(`${baseUrl}/health`);
      expect(status).toBe(200);
      expect(body).toEqual({ configured: true, status: 'ok' });
    });

    it('returns ok when unconfigured', async () => {
      baseUrl = await startTestServer(buildEnv({ DEEPL_API_KEY: '', OPENAI_API_KEY: '' }));
      const { body, status } = await fetchJson(`${baseUrl}/health`);
      expect(status).toBe(200);
      expect(body).toEqual({ configured: false, status: 'ok' });
    });
  });

  describe('proxy auth guard', () => {
    it('returns 401 when no auth header', async () => {
      baseUrl = await startTestServer(buildEnv());
      const { body, status } = await fetchJson(`${baseUrl}/proxy/translate/text`, {
        method: 'POST',
      });
      expect(status).toBe(401);
      expect(body.error.code).toBe('unauthorized');
    });

    it('returns 401 when invalid token', async () => {
      baseUrl = await startTestServer(buildEnv());
      const { body, status } = await fetchJson(`${baseUrl}/proxy/translate/text`, {
        headers: { Authorization: 'Bearer invalid-token' },
        method: 'POST',
      });
      expect(status).toBe(401);
      expect(body.error.code).toBe('unauthorized');
    });

    it('returns 503 when providers unconfigured', async () => {
      baseUrl = await startTestServer(buildEnv({ DEEPL_API_KEY: '', OPENAI_API_KEY: '' }));
      const { body, status } = await fetchJson(`${baseUrl}/proxy/translate/text`, {
        headers: { Authorization: 'Bearer valid-token' },
        method: 'POST',
      });
      expect(status).toBe(503);
      expect(body.error.code).toBe('provider_unconfigured');
    });
  });

  describe('POST /proxy/translate/text', () => {
    it('returns validation error when source text missing', async () => {
      baseUrl = await startTestServer(buildEnv());
      const { body, status } = await fetchJson(`${baseUrl}/proxy/translate/text`, {
        body: JSON.stringify({ targetLang: 'DE' }),
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        method: 'POST',
      });
      expect(status).toBe(400);
      expect(body.error.code).toBe('text_too_large');
    });

    it('returns validation error when target language missing', async () => {
      baseUrl = await startTestServer(buildEnv());
      const { body, status } = await fetchJson(`${baseUrl}/proxy/translate/text`, {
        body: JSON.stringify({ sourceText: 'Hello' }),
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        method: 'POST',
      });
      expect(status).toBe(400);
      expect(body.error.code).toBe('unsupported_language_pair');
    });

    it('calls DeepL and returns translation', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        if (typeof url === 'string' && url.includes('api-free.deepl.com')) {
          return new Response(JSON.stringify({
            translations: [{ detected_source_language: 'EN', text: 'Hallo' }],
          }), {
            headers: { 'content-type': 'application/json', 'x-request-id': 'req-123' },
            status: 200,
          });
        }
        return new Response('Not Found', { status: 404 });
      });

      baseUrl = await startTestServer(buildEnv());
      const { body, status } = await fetchJson(`${baseUrl}/proxy/translate/text`, {
        body: JSON.stringify({ sourceText: 'Hello', targetLang: 'DE' }),
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        method: 'POST',
      });

      expect(status).toBe(200);
      expect(body).toEqual({
        characterCount: 5,
        detectedSourceLanguage: 'EN',
        glossaryApplied: false,
        provider: 'deepl',
        providerRequestId: 'req-123',
        translatedText: 'Hallo',
        warnings: [],
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('api-free.deepl.com/v2/translate');

      fetchMock.mockRestore();
    });

    it('returns 502 when DeepL API fails', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        if (typeof url === 'string' && url.includes('api-free.deepl.com')) {
          return new Response('Bad Request', { status: 400 });
        }
        return new Response('Not Found', { status: 404 });
      });

      baseUrl = await startTestServer(buildEnv());
      const { body, status } = await fetchJson(`${baseUrl}/proxy/translate/text`, {
        body: JSON.stringify({ sourceText: 'Hello', targetLang: 'DE' }),
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        method: 'POST',
      });

      expect(status).toBe(502);
      expect(body.error.code).toBe('provider_error');

      fetchMock.mockRestore();
    });

    it('returns 429 when daily quota exceeded', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        if (typeof url === 'string' && url.includes('api-free.deepl.com')) {
          return new Response(JSON.stringify({
            translations: [{ detected_source_language: 'EN', text: 'Hallo' }],
          }), {
            headers: { 'content-type': 'application/json', 'x-request-id': 'req-123' },
            status: 200,
          });
        }
        return new Response('Not Found', { status: 404 });
      });

      baseUrl = await startTestServer({
        ...buildEnv(),
        PROXY_DAILY_TRANSLATION_CHARACTER_LIMIT_PER_USER: '10',
      });

      const headers = { Authorization: 'Bearer quota-user', 'Content-Type': 'application/json' };

      // First request: 5 chars -> ok
      const r1 = await fetchJson(`${baseUrl}/proxy/translate/text`, {
        body: JSON.stringify({ sourceText: 'Hello', targetLang: 'DE' }),
        headers,
        method: 'POST',
      });
      expect(r1.status).toBe(200);

      // Second request: 6 chars -> exceeds limit (still allowed, pushes over 10)
      const r2 = await fetchJson(`${baseUrl}/proxy/translate/text`, {
        body: JSON.stringify({ sourceText: 'World!', targetLang: 'DE' }),
        headers,
        method: 'POST',
      });
      expect(r2.status).toBe(200);

      // Third request: blocked
      const r3 = await fetchJson(`${baseUrl}/proxy/translate/text`, {
        body: JSON.stringify({ sourceText: 'Blocked', targetLang: 'DE' }),
        headers,
        method: 'POST',
      });
      expect(r3.status).toBe(429);
      expect(r3.body.error.code).toBe('quota_exceeded');

      fetchMock.mockRestore();
    });
  });

  describe('POST /proxy/ai/chat', () => {
    it('returns validation error when messages empty', async () => {
      baseUrl = await startTestServer(buildEnv());
      const { body, status } = await fetchJson(`${baseUrl}/proxy/ai/chat`, {
        body: JSON.stringify({ messages: [] }),
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        method: 'POST',
      });
      expect(status).toBe(400);
      expect(body.error.code).toBe('ai_message_empty');
    });

    it('calls OpenAI and returns response', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        if (typeof url === 'string' && url.includes('api.openai.com')) {
          return new Response(JSON.stringify({
            choices: [{ message: { content: 'Hola, ¿cómo estás?' } }],
            usage: { total_tokens: 25 },
          }), {
            headers: { 'content-type': 'application/json' },
            status: 200,
          });
        }
        return new Response('Not Found', { status: 404 });
      });

      baseUrl = await startTestServer(buildEnv());
      const { body, status } = await fetchJson(`${baseUrl}/proxy/ai/chat`, {
        body: JSON.stringify({
          messages: [{ content: 'Hello', role: 'user' }],
          learningLanguage: 'ES',
          goal: 'conversation',
        }),
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        method: 'POST',
      });

      expect(status).toBe(200);
      expect(body.provider).toBe('openai');
      expect(body.content).toBe('Hola, ¿cómo estás?');
      expect(body.totalTokens).toBe(25);

      fetchMock.mockRestore();
    });

    it('returns 502 when OpenAI API fails', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        if (typeof url === 'string' && url.includes('api.openai.com')) {
          return new Response('Unauthorized', { status: 401 });
        }
        return new Response('Not Found', { status: 404 });
      });

      baseUrl = await startTestServer(buildEnv());
      const { body, status } = await fetchJson(`${baseUrl}/proxy/ai/chat`, {
        body: JSON.stringify({
          messages: [{ content: 'Hello', role: 'user' }],
          learningLanguage: 'ES',
        }),
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        method: 'POST',
      });

      expect(status).toBe(502);
      expect(body.error.code).toBe('provider_error');

      fetchMock.mockRestore();
    });
  });

  describe('GET /proxy/quota', () => {
    it('returns quota state for authenticated user', async () => {
      baseUrl = await startTestServer(buildEnv());
      const { body, status } = await fetchJson(`${baseUrl}/proxy/quota`, {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(status).toBe(200);
      expect(body).toHaveProperty('translation');
      expect(body).toHaveProperty('aiChat');
      expect(body.translation.daily).toBe(0);
      expect(body.translation.dailyLimit).toBe(DEFAULT_LIMITS.dailyTranslationCharacterLimitPerUser);
    });

    it('returns 503 when unconfigured', async () => {
      baseUrl = await startTestServer(buildEnv({ DEEPL_API_KEY: '', OPENAI_API_KEY: '' }));
      const { body, status } = await fetchJson(`${baseUrl}/proxy/quota`, {
        headers: { Authorization: 'Bearer valid-token' },
      });
      expect(status).toBe(503);
    });
  });
});