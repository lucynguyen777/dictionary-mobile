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
            signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
            signUp: async () => ({ data: { session: null, user: null }, error: null }),
            resetPasswordForEmail: async () => ({ data: null, error: null }),
            exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
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
            signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
            signUp: async () => ({ data: { session: null, user: null }, error: null }),
            resetPasswordForEmail: async () => ({ data: null, error: null }),
            exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
          },
        },
      }))
    ).resolves.toMatchObject({
      status: 'unauthenticated',
      userId: null,
      lastAuthEvent: 'sign-out',
    });
  });

  it('signs in with email and password through the configured client', async () => {
    const { signInAuthSession } = await import('../data/authController');
    const credentials = {
      email: 'reader@example.com',
      password: 'correct-password',
    };
    const calls: unknown[] = [];

    await expect(
      signInAuthSession(credentials, () => ({
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
            signInWithPassword: async (nextCredentials) => {
              calls.push(nextCredentials);
              return {
                data: {
                  session: {
                    user: makeUser(),
                  } as AuthSession,
                  user: makeUser(),
                },
                error: null,
              };
            },
            signUp: async () => ({ data: { session: null, user: null }, error: null }),
            resetPasswordForEmail: async () => ({ data: null, error: null }),
            exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
          },
        },
      }))
    ).resolves.toMatchObject({
      status: 'authenticated',
      email: 'reader@example.com',
      lastAuthEvent: 'sign-in',
    });
    expect(calls).toEqual([credentials]);
  });

  it('maps sign-up without session to needs verification', async () => {
    const { signUpAuthSession } = await import('../data/authController');

    await expect(
      signUpAuthSession(
        {
          email: 'reader@example.com',
          password: 'new-password',
        },
        () => ({
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
              signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
              signUp: async () => ({
                data: {
                  session: null,
                  user: makeUser({
                    email_confirmed_at: undefined,
                    confirmed_at: undefined,
                  }),
                },
                error: null,
              }),
              resetPasswordForEmail: async () => ({ data: null, error: null }),
              exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
            },
          },
        })
      )
    ).resolves.toMatchObject({
      status: 'needs_verification',
      email: 'reader@example.com',
      lastAuthEvent: 'sign-up',
    });
  });

  it('sends password recovery email with the app callback URL', async () => {
    const { AUTH_CALLBACK_URL, sendPasswordRecoveryEmail } = await import('../data/authController');
    const calls: unknown[] = [];

    await expect(
      sendPasswordRecoveryEmail('reader@example.com', () => ({
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
            signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
            signUp: async () => ({ data: { session: null, user: null }, error: null }),
            resetPasswordForEmail: async (email, options) => {
              calls.push([email, options]);
              return { data: null, error: null };
            },
            exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
          },
        },
      }))
    ).resolves.toMatchObject({
      status: 'unauthenticated',
      email: 'reader@example.com',
      lastAuthEvent: 'recovery',
    });
    expect(calls).toEqual([['reader@example.com', { redirectTo: AUTH_CALLBACK_URL }]]);
  });

  it('maps callback provider errors without exchanging a code', async () => {
    const { completeAuthCallback } = await import('../data/authController');
    const calls: unknown[] = [];

    await expect(
      completeAuthCallback(
        {
          error_description: 'Expired link',
        },
        () => ({
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
              signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
              signUp: async () => ({ data: { session: null, user: null }, error: null }),
              resetPasswordForEmail: async () => ({ data: null, error: null }),
              exchangeCodeForSession: async (code) => {
                calls.push(code);
                return { data: { session: null }, error: null };
              },
            },
          },
        })
      )
    ).resolves.toMatchObject({
      status: 'error',
      errorMessage: 'Expired link',
      lastAuthEvent: 'recovery',
    });
    expect(calls).toEqual([]);
  });

  it('requires a callback code before exchanging a session', async () => {
    const { completeAuthCallback } = await import('../data/authController');

    await expect(
      completeAuthCallback(
        {},
        () => ({
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
              signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
              signUp: async () => ({ data: { session: null, user: null }, error: null }),
              resetPasswordForEmail: async () => ({ data: null, error: null }),
              exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
            },
          },
        })
      )
    ).resolves.toMatchObject({
      status: 'error',
      errorMessage: 'Missing auth callback code.',
      lastAuthEvent: 'recovery',
    });
  });

  it('exchanges callback code for a Supabase session', async () => {
    const { completeAuthCallback } = await import('../data/authController');
    const calls: unknown[] = [];

    await expect(
      completeAuthCallback(
        {
          code: ['auth-code'],
        },
        () => ({
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
              signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
              signUp: async () => ({ data: { session: null, user: null }, error: null }),
              resetPasswordForEmail: async () => ({ data: null, error: null }),
              exchangeCodeForSession: async (code) => {
                calls.push(code);
                return {
                  data: {
                    session: {
                      user: makeUser(),
                    } as AuthSession,
                  },
                  error: null,
                };
              },
            },
          },
        })
      )
    ).resolves.toMatchObject({
      status: 'authenticated',
      email: 'reader@example.com',
      lastAuthEvent: 'recovery',
    });
    expect(calls).toEqual(['auth-code']);
  });
});
