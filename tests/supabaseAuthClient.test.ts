import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('../data/authTokenStorage', () => ({
  AUTH_TOKEN_STORAGE_KIND: 'secure-store-native',
  authTokenStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('createSupabaseAuthClient', () => {
  it('stays unconfigured when public Supabase env is missing', () => {
    return import('../data/supabaseAuthClient').then(({ createSupabaseAuthClient }) => {
      const createClientImpl = vi.fn();

      const result = createSupabaseAuthClient({
        env: {},
        createClientImpl,
      });

      expect(result.status).toBe('unconfigured');
      expect(createClientImpl).not.toHaveBeenCalled();
    });
  });

  it('creates a Supabase client with persistent PKCE auth options', async () => {
    const { SUPABASE_AUTH_STORAGE_KEY, createSupabaseAuthClient } = await import('../data/supabaseAuthClient');
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const client = { auth: 'client' };
    const createClientImpl = vi.fn(() => client);

    const result = createSupabaseAuthClient({
      env: {
        EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
      },
      storage,
      createClientImpl,
    });

    expect(result).toMatchObject({
      status: 'configured',
      client,
      storageKind: 'secure-store-native',
    });
    expect(createClientImpl).toHaveBeenCalledWith('https://project.supabase.co', 'publishable-key', {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        persistSession: true,
        storage,
        storageKey: SUPABASE_AUTH_STORAGE_KEY,
      },
    });
  });
});
