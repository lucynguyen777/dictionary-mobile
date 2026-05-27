import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

import { authTokenStorage, AUTH_TOKEN_STORAGE_KIND, type AuthTokenStorage } from './authTokenStorage';
import { readSupabaseAuthConfig, type AuthEnv, type SupabaseAuthConfig } from './authConfig';

export const SUPABASE_AUTH_STORAGE_KEY = 'dictionary-mobile.supabase.auth.v1';

export type SupabaseAuthClientFactory<TClient> = (
  url: string,
  publishableKey: string,
  options: SupabaseClientOptions<'public'>
) => TClient;

export type SupabaseAuthClientResult<TClient = SupabaseClient> =
  | {
      status: 'unconfigured';
      config: Extract<SupabaseAuthConfig, { status: 'unconfigured' }>;
    }
  | {
      status: 'configured';
      config: Extract<SupabaseAuthConfig, { status: 'configured' }>;
      client: TClient;
      storageKind: string;
    };

export type CreateSupabaseAuthClientOptions<TClient = SupabaseClient> = {
  env?: AuthEnv;
  storage?: AuthTokenStorage;
  createClientImpl?: SupabaseAuthClientFactory<TClient>;
};

const defaultCreateClient: SupabaseAuthClientFactory<SupabaseClient> = (url, publishableKey, options) =>
  createClient(url, publishableKey, options);

export function createSupabaseAuthClient<TClient = SupabaseClient>({
  env,
  storage = authTokenStorage,
  createClientImpl = defaultCreateClient as SupabaseAuthClientFactory<TClient>,
}: CreateSupabaseAuthClientOptions<TClient> = {}): SupabaseAuthClientResult<TClient> {
  const config = readSupabaseAuthConfig(env);

  if (config.status === 'unconfigured') {
    return {
      status: 'unconfigured',
      config,
    };
  }

  const client = createClientImpl(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      persistSession: true,
      storage,
      storageKey: SUPABASE_AUTH_STORAGE_KEY,
    },
  });

  return {
    status: 'configured',
    config,
    client,
    storageKind: AUTH_TOKEN_STORAGE_KIND,
  };
}

