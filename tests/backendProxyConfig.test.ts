import { describe, expect, it } from 'vitest';

import {
  getProviderUnconfiguredResponse,
  readBackendProxyConfig,
  redactProxyLogPayload,
} from '../backend/proxyConfig';

describe('backend proxy config', () => {
  it('returns provider_unconfigured when required backend env is missing', () => {
    const config = readBackendProxyConfig({
      DEEPL_API_BASE_URL: 'https://api-free.deepl.com',
      OPENAI_TEXT_MODEL: 'gpt-4.1-mini',
    });

    expect(config).toEqual({
      missingKeys: ['DEEPL_API_KEY', 'OPENAI_API_KEY'],
      status: 'unconfigured',
    });
    if (config.status !== 'unconfigured') throw new Error('Expected unconfigured proxy config');

    expect(getProviderUnconfiguredResponse(config)).toEqual({
      error: {
        code: 'provider_unconfigured',
        message: 'Translation and AI providers are not configured.',
        missingKeys: ['DEEPL_API_KEY', 'OPENAI_API_KEY'],
      },
      status: 503,
    });
  });

  it('rejects unsupported DeepL base URLs', () => {
    expect(
      readBackendProxyConfig({
        DEEPL_API_BASE_URL: 'https://evil.example',
        DEEPL_API_KEY: 'deepl-key',
        OPENAI_API_KEY: 'openai-key',
        OPENAI_TEXT_MODEL: 'gpt-4.1-mini',
      })
    ).toEqual({
      missingKeys: ['DEEPL_API_BASE_URL_ALLOWED_VALUE'],
      status: 'unconfigured',
    });
  });

  it('reads configured env and positive numeric limits without exposing keys to clients', () => {
    expect(
      readBackendProxyConfig({
        DEEPL_API_BASE_URL: ' https://api.deepl.com ',
        DEEPL_API_KEY: ' deepl-key ',
        OPENAI_API_KEY: ' openai-key ',
        OPENAI_TEXT_MODEL: ' gpt-4.1-mini ',
        PROXY_DAILY_AI_REQUEST_LIMIT_PER_USER: '50',
        PROXY_MAX_TEXT_INPUT_CHARS: '12000',
        PROXY_MONTHLY_CHARACTER_LIMIT_PER_USER: 'bad-number',
      })
    ).toEqual({
      deeplApiBaseUrl: 'https://api.deepl.com',
      deeplApiKey: 'deepl-key',
      limits: {
        dailyAiRequestLimitPerUser: 50,
        dailyTranslationCharacterLimitPerUser: 20000,
        maxGlossaryEntries: 1000,
        maxTextInputChars: 12000,
        monthlyCharacterLimitPerUser: 200000,
        proxyLogRetentionDays: 30,
      },
      openaiApiKey: 'openai-key',
      openaiTextModel: 'gpt-4.1-mini',
      status: 'configured',
    });
  });

  it('redacts provider keys and user content from structured logs', () => {
    expect(
      redactProxyLogPayload({
        feature: 'translate',
        nested: {
          messages: [{ content: 'hello' }],
          sourceText: 'bonjour',
        },
        OPENAI_API_KEY: 'secret',
        transcript: 'spoken text',
      })
    ).toEqual({
      feature: 'translate',
      nested: {
        messages: '[redacted]',
        sourceText: '[redacted]',
      },
      OPENAI_API_KEY: '[redacted]',
      transcript: '[redacted]',
    });
  });
});
