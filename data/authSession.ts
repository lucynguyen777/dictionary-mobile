import type { AuthSession, AuthUser } from '@supabase/supabase-js';

export type AuthSessionStatus =
  | 'unconfigured'
  | 'loading'
  | 'unauthenticated'
  | 'authenticated'
  | 'needs_verification'
  | 'error';

export type AuthLastEvent =
  | 'initial-session'
  | 'sign-in'
  | 'sign-up'
  | 'token-refresh'
  | 'sign-out'
  | 'recovery'
  | 'error';

export type AuthSessionSnapshot = {
  status: AuthSessionStatus;
  userId: string | null;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  lastAuthEvent: AuthLastEvent | null;
  errorMessage?: string;
};

export const unauthenticatedAuthSession: AuthSessionSnapshot = {
  status: 'unauthenticated',
  userId: null,
  email: null,
  emailVerified: false,
  phone: null,
  lastAuthEvent: null,
};

function isEmailVerified(user: Pick<AuthUser, 'confirmed_at' | 'email_confirmed_at'>) {
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

function mapUserFields(user: Pick<AuthUser, 'id' | 'email' | 'phone' | 'confirmed_at' | 'email_confirmed_at'>) {
  return {
    userId: user.id,
    email: user.email ?? null,
    emailVerified: isEmailVerified(user),
    phone: user.phone ?? null,
  };
}

export function mapSupabaseSessionToAuthSnapshot(
  session: AuthSession | null,
  lastAuthEvent: AuthLastEvent = 'initial-session'
): AuthSessionSnapshot {
  if (!session) {
    return {
      ...unauthenticatedAuthSession,
      lastAuthEvent,
    };
  }

  return {
    status: 'authenticated',
    ...mapUserFields(session.user),
    lastAuthEvent,
  };
}

export function mapSupabaseUserToAuthSnapshot(
  user: AuthUser | null,
  lastAuthEvent: AuthLastEvent = 'sign-up'
): AuthSessionSnapshot {
  if (!user) {
    return {
      ...unauthenticatedAuthSession,
      lastAuthEvent,
    };
  }

  const userFields = mapUserFields(user);

  if (userFields.email && !userFields.emailVerified) {
    return {
      status: 'needs_verification',
      ...userFields,
      lastAuthEvent,
    };
  }

  return {
    ...unauthenticatedAuthSession,
    ...userFields,
    lastAuthEvent,
  };
}

export function mapAuthErrorToSnapshot(message: string, lastAuthEvent: AuthLastEvent = 'error'): AuthSessionSnapshot {
  return {
    status: 'error',
    userId: null,
    email: null,
    emailVerified: false,
    phone: null,
    lastAuthEvent,
    errorMessage: message,
  };
}

