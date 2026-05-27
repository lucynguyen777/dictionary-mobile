import { describe, expect, it, vi } from 'vitest';

const secureStoreState = new Map<string, string>();

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn((key: string) => Promise.resolve(secureStoreState.get(key) ?? null)),
  setItemAsync: vi.fn((key: string, value: string) => {
    secureStoreState.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: vi.fn((key: string) => {
    secureStoreState.delete(key);
    return Promise.resolve();
  }),
}));

describe('authTokenStorage', () => {
  it('uses SecureStore semantics for native auth tokens', async () => {
    const { AUTH_TOKEN_STORAGE_KIND, authTokenStorage } = await import('../data/authTokenStorage');

    expect(AUTH_TOKEN_STORAGE_KIND).toBe('secure-store-native');

    await authTokenStorage.setItem('supabase.session', 'token-value');
    await expect(authTokenStorage.getItem('supabase.session')).resolves.toBe('token-value');

    await authTokenStorage.removeItem('supabase.session');
    await expect(authTokenStorage.getItem('supabase.session')).resolves.toBeNull();
  });
});

