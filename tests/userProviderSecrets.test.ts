import { describe, expect, it } from 'vitest';

import {
  decryptUserProviderSecret,
  encryptUserProviderSecret,
  getUserProviderSecretUnconfiguredResponse,
  readUserProviderSecretEncryptionConfig,
} from '../backend/userProviderSecrets';

const encryptionKey = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8';
const nonce = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const scope = {
  provider: 'openai',
  purpose: 'ai-agent',
  userId: 'user-1',
} as const;

describe('user provider secret encryption', () => {
  it('returns an unconfigured response when the encryption key is missing', () => {
    const config = readUserProviderSecretEncryptionConfig({});

    expect(config).toEqual({
      missingKeys: ['USER_PROVIDER_SECRET_ENCRYPTION_KEY'],
      status: 'unconfigured',
    });
    if (config.status !== 'unconfigured') throw new Error('Expected unconfigured secret config');

    expect(getUserProviderSecretUnconfiguredResponse(config)).toEqual({
      error: {
        code: 'user_provider_secret_encryption_unconfigured',
        message: 'User provider secret encryption is not configured.',
        missingKeys: ['USER_PROVIDER_SECRET_ENCRYPTION_KEY'],
      },
      status: 503,
    });
  });

  it('requires a 32-byte base64url encryption key', () => {
    expect(
      readUserProviderSecretEncryptionConfig({
        USER_PROVIDER_SECRET_ENCRYPTION_KEY: 'short-key',
      })
    ).toEqual({
      missingKeys: ['USER_PROVIDER_SECRET_ENCRYPTION_KEY_32_BYTES'],
      status: 'unconfigured',
    });
  });

  it('encrypts user API secrets without storing plaintext in the envelope', async () => {
    const config = readUserProviderSecretEncryptionConfig({
      USER_PROVIDER_SECRET_ENCRYPTION_KEY: encryptionKey,
      USER_PROVIDER_SECRET_KEY_VERSION: 'v2',
    });
    if (config.status !== 'configured') throw new Error('Expected configured secret config');

    const encrypted = await encryptUserProviderSecret('sk-user-secret', scope, config, { nonceBytes: nonce });

    expect(encrypted).toEqual({
      algorithm: 'AES-256-GCM',
      ciphertext: expect.any(String),
      keyVersion: 'v2',
      nonce: 'AAECAwQFBgcICQoL',
    });
    expect(JSON.stringify(encrypted)).not.toContain('sk-user-secret');
    await expect(decryptUserProviderSecret(encrypted, scope, config)).resolves.toBe('sk-user-secret');
  });

  it('binds encrypted secrets to user, provider, purpose, and key version', async () => {
    const config = readUserProviderSecretEncryptionConfig({
      USER_PROVIDER_SECRET_ENCRYPTION_KEY: encryptionKey,
    });
    if (config.status !== 'configured') throw new Error('Expected configured secret config');

    const encrypted = await encryptUserProviderSecret('deepl-user-secret', scope, config, { nonceBytes: nonce });

    await expect(
      decryptUserProviderSecret(
        encrypted,
        {
          ...scope,
          userId: 'user-2',
        },
        config
      )
    ).rejects.toThrow();

    await expect(
      decryptUserProviderSecret(encrypted, scope, {
        ...config,
        keyVersion: 'rotated',
      })
    ).rejects.toThrow('user_provider_secret_key_version_mismatch');
  });

  it('rejects empty secrets before encryption', async () => {
    const config = readUserProviderSecretEncryptionConfig({
      USER_PROVIDER_SECRET_ENCRYPTION_KEY: encryptionKey,
    });
    if (config.status !== 'configured') throw new Error('Expected configured secret config');

    await expect(encryptUserProviderSecret('', scope, config, { nonceBytes: nonce })).rejects.toThrow(
      'user_provider_secret_empty'
    );
  });
});
