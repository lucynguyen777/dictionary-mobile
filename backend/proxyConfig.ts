export const DEEPL_API_BASE_URLS = ['https://api.deepl.com', 'https://api-free.deepl.com'] as const;

export const REQUIRED_PROXY_ENV_KEYS = [
  'DEEPL_API_BASE_URL',
  'DEEPL_API_KEY',
  'OPENAI_API_KEY',
  'OPENAI_TEXT_MODEL',
] as const;

export type BackendProxyEnv = Partial<Record<string, string | undefined>>;

export type BackendProxyConfig =
  | {
      missingKeys: string[];
      status: 'unconfigured';
    }
  | {
      deeplApiBaseUrl: (typeof DEEPL_API_BASE_URLS)[number];
      deeplApiKey: string;
      limits: BackendProxyLimits;
      openaiApiKey: string;
      openaiTextModel: string;
      status: 'configured';
    };

export type BackendProxyLimits = {
  dailyAiRequestLimitPerUser: number;
  dailyTranslationCharacterLimitPerUser: number;
  maxGlossaryEntries: number;
  maxTextInputChars: number;
  monthlyCharacterLimitPerUser: number;
  proxyLogRetentionDays: number;
};

const DEFAULT_LIMITS: BackendProxyLimits = {
  dailyAiRequestLimitPerUser: 25,
  dailyTranslationCharacterLimitPerUser: 20_000,
  maxGlossaryEntries: 1_000,
  maxTextInputChars: 5_000,
  monthlyCharacterLimitPerUser: 200_000,
  proxyLogRetentionDays: 30,
};

const LIMIT_ENV_KEYS: Record<keyof BackendProxyLimits, string> = {
  dailyAiRequestLimitPerUser: 'PROXY_DAILY_AI_REQUEST_LIMIT_PER_USER',
  dailyTranslationCharacterLimitPerUser: 'PROXY_DAILY_TRANSLATION_CHARACTER_LIMIT_PER_USER',
  maxGlossaryEntries: 'PROXY_MAX_GLOSSARY_ENTRIES',
  maxTextInputChars: 'PROXY_MAX_TEXT_INPUT_CHARS',
  monthlyCharacterLimitPerUser: 'PROXY_MONTHLY_CHARACTER_LIMIT_PER_USER',
  proxyLogRetentionDays: 'PROXY_LOG_RETENTION_DAYS',
};

const SENSITIVE_LOG_KEYS = new Set([
  'authorization',
  'deeplApiKey',
  'DEEPL_API_KEY',
  'glossaryEntries',
  'messages',
  'openaiApiKey',
  'OPENAI_API_KEY',
  'prompt',
  'sourceText',
  'targetText',
  'transcript',
  'translatedText',
]);

export function readBackendProxyConfig(env: BackendProxyEnv): BackendProxyConfig {
  const missingKeys: string[] = REQUIRED_PROXY_ENV_KEYS.filter((key) => !readTrimmedEnv(env, key));
  const baseUrl = readTrimmedEnv(env, 'DEEPL_API_BASE_URL');

  if (baseUrl && !isAllowedDeepLBaseUrl(baseUrl)) {
    missingKeys.push('DEEPL_API_BASE_URL_ALLOWED_VALUE');
  }

  if (missingKeys.length > 0 || !baseUrl || !isAllowedDeepLBaseUrl(baseUrl)) {
    return {
      missingKeys,
      status: 'unconfigured',
    };
  }

  return {
    deeplApiBaseUrl: baseUrl,
    deeplApiKey: readTrimmedEnv(env, 'DEEPL_API_KEY') ?? '',
    limits: readProxyLimits(env),
    openaiApiKey: readTrimmedEnv(env, 'OPENAI_API_KEY') ?? '',
    openaiTextModel: readTrimmedEnv(env, 'OPENAI_TEXT_MODEL') ?? '',
    status: 'configured',
  };
}

export function getProviderUnconfiguredResponse(config: Extract<BackendProxyConfig, { status: 'unconfigured' }>) {
  return {
    error: {
      code: 'provider_unconfigured',
      message: 'Translation and AI providers are not configured.',
      missingKeys: config.missingKeys,
    },
    status: 503,
  } as const;
}

export function redactProxyLogPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactProxyLogPayload(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_LOG_KEYS.has(key) ? '[redacted]' : redactProxyLogPayload(item),
    ])
  );
}

function readProxyLimits(env: BackendProxyEnv): BackendProxyLimits {
  return {
    dailyAiRequestLimitPerUser: readPositiveInteger(env, 'dailyAiRequestLimitPerUser'),
    dailyTranslationCharacterLimitPerUser: readPositiveInteger(env, 'dailyTranslationCharacterLimitPerUser'),
    maxGlossaryEntries: readPositiveInteger(env, 'maxGlossaryEntries'),
    maxTextInputChars: readPositiveInteger(env, 'maxTextInputChars'),
    monthlyCharacterLimitPerUser: readPositiveInteger(env, 'monthlyCharacterLimitPerUser'),
    proxyLogRetentionDays: readPositiveInteger(env, 'proxyLogRetentionDays'),
  };
}

function readPositiveInteger(env: BackendProxyEnv, key: keyof BackendProxyLimits) {
  const raw = readTrimmedEnv(env, LIMIT_ENV_KEYS[key]);
  if (!raw) return DEFAULT_LIMITS[key];

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LIMITS[key];
}

function readTrimmedEnv(env: BackendProxyEnv, key: string) {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function isAllowedDeepLBaseUrl(value: string): value is (typeof DEEPL_API_BASE_URLS)[number] {
  return DEEPL_API_BASE_URLS.includes(value as (typeof DEEPL_API_BASE_URLS)[number]);
}
