import type { SupabaseClient } from '@supabase/supabase-js';

import {
  decryptUserProviderSecret,
  encryptUserProviderSecret,
  readUserProviderSecretEncryptionConfig,
  type UserProviderSecretEnv,
} from './userProviderSecrets';

const CONNECTION_ID = 'google-sheets';

export function createGoogleSheetsStore(client: SupabaseClient, env: UserProviderSecretEnv) {
  const encryption = readUserProviderSecretEncryptionConfig(env);

  return {
    configured: encryption.status === 'configured',
    async loadRefreshToken(userId: string) {
      if (encryption.status !== 'configured') throw new Error('google_token_storage_unconfigured');
      const { data, error } = await client.from('user_provider_secret_envelopes')
        .select('algorithm,ciphertext,key_version,nonce')
        .eq('user_id', userId).eq('connection_id', CONNECTION_ID).maybeSingle();
      if (error) throw new Error('google_token_load_failed');
      if (!data) return null;
      return decryptUserProviderSecret({
        algorithm: data.algorithm,
        ciphertext: data.ciphertext,
        keyVersion: `v${data.key_version}`,
        nonce: data.nonce,
      }, { provider: 'custom', purpose: 'translation', userId }, encryption);
    },
    async saveRefreshToken(userId: string, refreshToken: string) {
      if (encryption.status !== 'configured') throw new Error('google_token_storage_unconfigured');
      const now = new Date().toISOString();
      const envelope = await encryptUserProviderSecret(
        refreshToken,
        { provider: 'custom', purpose: 'translation', userId },
        encryption
      );
      const connection = await client.from('user_provider_connections').upsert({
        display_label: 'Google Sheets',
        id: CONNECTION_ID,
        key_version: 1,
        provider: 'google',
        purpose: 'sheets-export',
        revoked_at: null,
        status: 'active',
        updated_at: now,
        user_id: userId,
      });
      if (connection.error) throw new Error('google_connection_save_failed');
      const secret = await client.from('user_provider_secret_envelopes').upsert({
        algorithm: envelope.algorithm,
        ciphertext: envelope.ciphertext,
        connection_id: CONNECTION_ID,
        key_version: Number.parseInt(envelope.keyVersion.replace(/^v/, ''), 10) || 1,
        nonce: envelope.nonce,
        revoked_at: null,
        updated_at: now,
        user_id: userId,
      });
      if (secret.error) throw new Error('google_token_save_failed');
    },
    async revoke(userId: string) {
      await client.from('user_provider_secret_envelopes').delete().eq('user_id', userId).eq('connection_id', CONNECTION_ID);
      await client.from('user_provider_connections').delete().eq('user_id', userId).eq('id', CONNECTION_ID);
    },
  };
}

export type GoogleSheetsStore = ReturnType<typeof createGoogleSheetsStore>;
