export const USER_PROVIDER_SECRET_ALGORITHM = 'AES-256-GCM' as const;
export const USER_PROVIDER_SECRET_ENV_KEY = 'USER_PROVIDER_SECRET_ENCRYPTION_KEY';
export const USER_PROVIDER_SECRET_KEY_BYTES = 32;

export type UserProviderSecretEnv = Partial<Record<string, string | undefined>>;

export type UserProviderSecretEncryptionConfig =
  | {
      missingKeys: string[];
      status: 'unconfigured';
    }
  | {
      keyBytes: Uint8Array;
      keyVersion: string;
      status: 'configured';
    };

export type UserProviderSecretScope = {
  provider: 'deepl' | 'openai' | 'azure-speech' | 'custom';
  purpose: 'translation' | 'ai-agent' | 'speech-scoring';
  userId: string;
};

export type EncryptedUserProviderSecret = {
  algorithm: typeof USER_PROVIDER_SECRET_ALGORITHM;
  ciphertext: string;
  keyVersion: string;
  nonce: string;
};

type EncryptSecretOptions = {
  nonceBytes?: Uint8Array;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function readUserProviderSecretEncryptionConfig(env: UserProviderSecretEnv): UserProviderSecretEncryptionConfig {
  const rawKey = env[USER_PROVIDER_SECRET_ENV_KEY]?.trim();

  if (!rawKey) {
    return {
      missingKeys: [USER_PROVIDER_SECRET_ENV_KEY],
      status: 'unconfigured',
    };
  }

  const keyBytes = safeDecodeBase64Url(rawKey);
  if (keyBytes.length !== USER_PROVIDER_SECRET_KEY_BYTES) {
    return {
      missingKeys: [`${USER_PROVIDER_SECRET_ENV_KEY}_32_BYTES`],
      status: 'unconfigured',
    };
  }

  return {
    keyBytes,
    keyVersion: env.USER_PROVIDER_SECRET_KEY_VERSION?.trim() || 'v1',
    status: 'configured',
  };
}

export async function encryptUserProviderSecret(
  secret: string,
  scope: UserProviderSecretScope,
  config: Extract<UserProviderSecretEncryptionConfig, { status: 'configured' }>,
  options: EncryptSecretOptions = {}
): Promise<EncryptedUserProviderSecret> {
  if (!secret) {
    throw new Error('user_provider_secret_empty');
  }

  const nonceBytes = options.nonceBytes ?? createNonce();
  const key = await importAesGcmKey(config.keyBytes);
  const encrypted = await globalThis.crypto.subtle.encrypt(
    {
      additionalData: buildScopeAdditionalData(scope, config.keyVersion),
      iv: copyBytes(nonceBytes),
      name: 'AES-GCM',
    },
    key,
    encoder.encode(secret)
  );

  return {
    algorithm: USER_PROVIDER_SECRET_ALGORITHM,
    ciphertext: encodeBase64Url(new Uint8Array(encrypted)),
    keyVersion: config.keyVersion,
    nonce: encodeBase64Url(nonceBytes),
  };
}

export async function decryptUserProviderSecret(
  encryptedSecret: EncryptedUserProviderSecret,
  scope: UserProviderSecretScope,
  config: Extract<UserProviderSecretEncryptionConfig, { status: 'configured' }>
): Promise<string> {
  if (encryptedSecret.algorithm !== USER_PROVIDER_SECRET_ALGORITHM) {
    throw new Error('user_provider_secret_algorithm_unsupported');
  }

  if (encryptedSecret.keyVersion !== config.keyVersion) {
    throw new Error('user_provider_secret_key_version_mismatch');
  }

  const key = await importAesGcmKey(config.keyBytes);
  const decrypted = await globalThis.crypto.subtle.decrypt(
    {
      additionalData: buildScopeAdditionalData(scope, config.keyVersion),
      iv: copyBytes(decodeBase64Url(encryptedSecret.nonce)),
      name: 'AES-GCM',
    },
    key,
    copyBytes(decodeBase64Url(encryptedSecret.ciphertext))
  );

  return decoder.decode(decrypted);
}

export function getUserProviderSecretUnconfiguredResponse(
  config: Extract<UserProviderSecretEncryptionConfig, { status: 'unconfigured' }>
) {
  return {
    error: {
      code: 'user_provider_secret_encryption_unconfigured',
      message: 'User provider secret encryption is not configured.',
      missingKeys: config.missingKeys,
    },
    status: 503,
  } as const;
}

function createNonce() {
  const nonce = new Uint8Array(12);
  globalThis.crypto.getRandomValues(nonce);
  return nonce;
}

function buildScopeAdditionalData(scope: UserProviderSecretScope, keyVersion: string) {
  return encoder.encode([scope.userId, scope.provider, scope.purpose, keyVersion].join(':'));
}

function importAesGcmKey(keyBytes: Uint8Array) {
  return globalThis.crypto.subtle.importKey('raw', copyBytes(keyBytes), { name: 'AES-GCM' }, false, [
    'decrypt',
    'encrypt',
  ]);
}

function copyBytes(bytes: Uint8Array) {
  return bytes.slice().buffer;
}

function encodeBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function safeDecodeBase64Url(value: string) {
  try {
    return decodeBase64Url(value);
  } catch {
    return new Uint8Array();
  }
}
