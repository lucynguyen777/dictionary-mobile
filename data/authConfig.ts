export const SUPABASE_URL_ENV = 'EXPO_PUBLIC_SUPABASE_URL';
export const SUPABASE_PUBLISHABLE_KEY_ENV = 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY';

export type AuthEnv = Record<string, string | undefined>;

export type SupabaseAuthConfig =
  | {
      status: 'configured';
      url: string;
      publishableKey: string;
    }
  | {
      status: 'unconfigured';
      missingKeys: string[];
    };

function getDefaultEnv(): AuthEnv {
  if (typeof process === 'undefined') return {};

  // Expo replaces direct EXPO_PUBLIC_* access at bundle time. Dynamic
  // process.env[key] reads remain undefined in static web/native bundles.
  return {
    [SUPABASE_URL_ENV]: process.env.EXPO_PUBLIC_SUPABASE_URL,
    [SUPABASE_PUBLISHABLE_KEY_ENV]: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

function readEnvValue(env: AuthEnv, key: string) {
  return env[key]?.trim() ?? '';
}

export function readSupabaseAuthConfig(env: AuthEnv = getDefaultEnv()): SupabaseAuthConfig {
  const url = readEnvValue(env, SUPABASE_URL_ENV);
  const publishableKey = readEnvValue(env, SUPABASE_PUBLISHABLE_KEY_ENV);
  const missingKeys = [
    [SUPABASE_URL_ENV, url],
    [SUPABASE_PUBLISHABLE_KEY_ENV, publishableKey],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    return {
      status: 'unconfigured',
      missingKeys,
    };
  }

  return {
    status: 'configured',
    url,
    publishableKey,
  };
}
