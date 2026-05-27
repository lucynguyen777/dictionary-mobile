import type { AuthSession, AuthUser } from '@supabase/supabase-js';
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

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-05-27T00:00:00.000Z',
    email: 'reader@example.com',
    email_confirmed_at: '2026-05-27T00:00:00.000Z',
    user_metadata: {},
    ...overrides,
  } as AuthUser;
}

describe('authController', () => {
  it('maps unconfigured Supabase client to local-first auth state', async () => {
    const { loadCurrentAuthSession } = await import('../data/authController');

    await expect(
      loadCurrentAuthSession(() => ({
        status: 'unconfigured',
        config: {
          status: 'unconfigured',
          missingKeys: ['EXPO_PUBLIC_SUPABASE_URL'],
        },
      }))
    ).resolves.toMatchObject({
      status: 'unconfigured',
      userId: null,
      emailVerified: false,
      errorMessage: 'Missing EXPO_PUBLIC_SUPABASE_URL',
    });
  });

  it('loads the current Supabase session without changing local profile data', async () => {
    const { loadCurrentAuthSession } = await import('../data/authController');

    await expect(
      loadCurrentAuthSession(() => ({
        status: 'configured',
        config: {
          status: 'configured',
          url: 'https://project.supabase.co',
          publishableKey: 'publishable-key',
        },
        storageKind: 'secure-store-native',
        client: {
          auth: {
            getSession: async () => ({
              data: {
                session: {
                  user: makeUser(),
                } as AuthSession,
              },
              error: null,
            }),
            signOut: async () => ({ error: null }),
          },
        },
      }))
    ).resolves.toMatchObject({
      status: 'authenticated',
      userId: 'user-1',
      email: 'reader@example.com',
      emailVerified: true,
      lastAuthEvent: 'initial-session',
    });
  });

  it('returns unauthenticated state after sign out succeeds', async () => {
    const { signOutAuthSession } = await import('../data/authController');

    await expect(
      signOutAuthSession(() => ({
        status: 'configured',
        config: {
          status: 'configured',
          url: 'https://project.supabase.co',
          publishableKey: 'publishable-key',
        },
        storageKind: 'secure-store-native',
        client: {
          auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            signOut: async () => ({ error: null }),
          },
        },
      }))
    ).resolves.toMatchObject({
      status: 'unauthenticated',
      userId: null,
      lastAuthEvent: 'sign-out',
    });
  });
});
