import type { AuthSession, AuthUser } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import {
  mapAuthErrorToSnapshot,
  mapSupabaseSessionToAuthSnapshot,
  mapSupabaseUserToAuthSnapshot,
} from '../data/authSession';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-05-27T00:00:00.000Z',
    user_metadata: {},
    ...overrides,
  } as AuthUser;
}

describe('auth session mapping', () => {
  it('maps missing Supabase session to unauthenticated local-safe state', () => {
    expect(mapSupabaseSessionToAuthSnapshot(null)).toEqual({
      status: 'unauthenticated',
      userId: null,
      email: null,
      emailVerified: false,
      phone: null,
      lastAuthEvent: 'initial-session',
    });
  });

  it('maps a Supabase session to authenticated identity fields', () => {
    const user = makeUser({
      email: 'reader@example.com',
      email_confirmed_at: '2026-05-27T00:00:00.000Z',
      phone: '+15551234567',
    });

    expect(mapSupabaseSessionToAuthSnapshot({ user } as AuthSession, 'sign-in')).toEqual({
      status: 'authenticated',
      userId: 'user-1',
      email: 'reader@example.com',
      emailVerified: true,
      phone: '+15551234567',
      lastAuthEvent: 'sign-in',
    });
  });

  it('maps sign-up user without confirmed email to needs verification', () => {
    expect(
      mapSupabaseUserToAuthSnapshot(
        makeUser({
          email: 'reader@example.com',
          email_confirmed_at: undefined,
          confirmed_at: undefined,
        })
      )
    ).toEqual({
      status: 'needs_verification',
      userId: 'user-1',
      email: 'reader@example.com',
      emailVerified: false,
      phone: null,
      lastAuthEvent: 'sign-up',
    });
  });

  it('maps auth errors without leaking session identity', () => {
    expect(mapAuthErrorToSnapshot('Invalid credentials')).toEqual({
      status: 'error',
      userId: null,
      email: null,
      emailVerified: false,
      phone: null,
      lastAuthEvent: 'error',
      errorMessage: 'Invalid credentials',
    });
  });
});
