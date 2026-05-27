import type { AuthSession, AuthUser } from '@supabase/supabase-js';

import {
  type AuthLastEvent,
  mapAuthErrorToSnapshot,
  mapSupabaseSessionToAuthSnapshot,
  mapSupabaseUserToAuthSnapshot,
  type AuthSessionSnapshot,
} from './authSession';
import { createSupabaseAuthClient, type SupabaseAuthClientResult } from './supabaseAuthClient';

export type AuthControllerClient = {
  auth: {
    getSession: () => Promise<{
      data: {
        session: AuthSession | null;
      };
      error: {
        message: string;
      } | null;
    }>;
    signOut: () => Promise<{
      error: {
        message: string;
      } | null;
    }>;
    signInWithPassword: (credentials: AuthCredentials) => Promise<{
      data: {
        session: AuthSession | null;
        user: AuthUser | null;
      };
      error: {
        message: string;
      } | null;
    }>;
    signUp: (credentials: AuthCredentials) => Promise<{
      data: {
        session: AuthSession | null;
        user: AuthUser | null;
      };
      error: {
        message: string;
      } | null;
    }>;
    resetPasswordForEmail: (
      email: string,
      options?: {
        redirectTo?: string;
      }
    ) => Promise<{
      data: unknown;
      error: {
        message: string;
      } | null;
    }>;
    exchangeCodeForSession: (code: string) => Promise<{
      data: {
        session: AuthSession | null;
      };
      error: {
        message: string;
      } | null;
    }>;
    onAuthStateChange?: (
      callback: (event: string, session: AuthSession | null) => void
    ) => {
      data: {
        subscription: {
          unsubscribe: () => void;
        };
      };
    };
    startAutoRefresh?: () => void;
    stopAutoRefresh?: () => void;
  };
};

export type CreateAuthControllerClient = () => SupabaseAuthClientResult<AuthControllerClient>;

export type AuthCredentials = {
  email: string;
  password: string;
};

export const AUTH_CALLBACK_URL = 'dictionairemobile://auth/callback';

export type AuthCallbackParams = {
  code?: string | string[];
  error?: string | string[];
  error_description?: string | string[];
};

function getFirstParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];

  return value;
}

export function mapSupabaseAuthEventToLastEvent(event: string): AuthLastEvent {
  switch (event) {
    case 'SIGNED_IN':
      return 'sign-in';
    case 'SIGNED_OUT':
      return 'sign-out';
    case 'TOKEN_REFRESHED':
      return 'token-refresh';
    case 'PASSWORD_RECOVERY':
      return 'recovery';
    case 'USER_UPDATED':
    case 'INITIAL_SESSION':
      return 'initial-session';
    default:
      return 'initial-session';
  }
}

export function mapUnconfiguredAuthSnapshot(missingKeys: string[]): AuthSessionSnapshot {
  return {
    status: 'unconfigured',
    userId: null,
    email: null,
    emailVerified: false,
    phone: null,
    lastAuthEvent: null,
    errorMessage: `Missing ${missingKeys.join(', ')}`,
  };
}

export async function loadCurrentAuthSession(
  createClient: CreateAuthControllerClient = createSupabaseAuthClient
): Promise<AuthSessionSnapshot> {
  const result = createClient();

  if (result.status === 'unconfigured') {
    return mapUnconfiguredAuthSnapshot(result.config.missingKeys);
  }

  const { data, error } = await result.client.auth.getSession();

  if (error) {
    return mapAuthErrorToSnapshot(error.message, 'initial-session');
  }

  return mapSupabaseSessionToAuthSnapshot(data.session, 'initial-session');
}

export async function signOutAuthSession(
  createClient: CreateAuthControllerClient = createSupabaseAuthClient
): Promise<AuthSessionSnapshot> {
  const result = createClient();

  if (result.status === 'unconfigured') {
    return mapUnconfiguredAuthSnapshot(result.config.missingKeys);
  }

  const { error } = await result.client.auth.signOut();

  if (error) {
    return mapAuthErrorToSnapshot(error.message, 'sign-out');
  }

  return mapSupabaseSessionToAuthSnapshot(null, 'sign-out');
}

export async function signInAuthSession(
  credentials: AuthCredentials,
  createClient: CreateAuthControllerClient = createSupabaseAuthClient
): Promise<AuthSessionSnapshot> {
  const result = createClient();

  if (result.status === 'unconfigured') {
    return mapUnconfiguredAuthSnapshot(result.config.missingKeys);
  }

  const { data, error } = await result.client.auth.signInWithPassword(credentials);

  if (error) {
    return mapAuthErrorToSnapshot(error.message, 'sign-in');
  }

  return mapSupabaseSessionToAuthSnapshot(data.session, 'sign-in');
}

export async function signUpAuthSession(
  credentials: AuthCredentials,
  createClient: CreateAuthControllerClient = createSupabaseAuthClient
): Promise<AuthSessionSnapshot> {
  const result = createClient();

  if (result.status === 'unconfigured') {
    return mapUnconfiguredAuthSnapshot(result.config.missingKeys);
  }

  const { data, error } = await result.client.auth.signUp(credentials);

  if (error) {
    return mapAuthErrorToSnapshot(error.message, 'sign-up');
  }

  if (data.session) {
    return mapSupabaseSessionToAuthSnapshot(data.session, 'sign-up');
  }

  return mapSupabaseUserToAuthSnapshot(data.user, 'sign-up');
}

export async function sendPasswordRecoveryEmail(
  email: string,
  createClient: CreateAuthControllerClient = createSupabaseAuthClient
): Promise<AuthSessionSnapshot> {
  const result = createClient();

  if (result.status === 'unconfigured') {
    return mapUnconfiguredAuthSnapshot(result.config.missingKeys);
  }

  const { error } = await result.client.auth.resetPasswordForEmail(email, {
    redirectTo: AUTH_CALLBACK_URL,
  });

  if (error) {
    return mapAuthErrorToSnapshot(error.message, 'recovery');
  }

  return {
    status: 'unauthenticated',
    userId: null,
    email,
    emailVerified: false,
    phone: null,
    lastAuthEvent: 'recovery',
  };
}

export async function completeAuthCallback(
  params: AuthCallbackParams,
  createClient: CreateAuthControllerClient = createSupabaseAuthClient
): Promise<AuthSessionSnapshot> {
  const result = createClient();

  if (result.status === 'unconfigured') {
    return mapUnconfiguredAuthSnapshot(result.config.missingKeys);
  }

  const callbackError = getFirstParamValue(params.error_description) ?? getFirstParamValue(params.error);

  if (callbackError) {
    return mapAuthErrorToSnapshot(callbackError, 'recovery');
  }

  const code = getFirstParamValue(params.code);

  if (!code) {
    return mapAuthErrorToSnapshot('Missing auth callback code.', 'recovery');
  }

  const { data, error } = await result.client.auth.exchangeCodeForSession(code);

  if (error) {
    return mapAuthErrorToSnapshot(error.message, 'recovery');
  }

  return mapSupabaseSessionToAuthSnapshot(data.session, 'recovery');
}

export function subscribeToAuthSessionChanges(
  onChange: (snapshot: AuthSessionSnapshot) => void,
  createClient: CreateAuthControllerClient = createSupabaseAuthClient
): () => void {
  const result = createClient();

  if (result.status === 'unconfigured') {
    onChange(mapUnconfiguredAuthSnapshot(result.config.missingKeys));
    return () => undefined;
  }

  if (!result.client.auth.onAuthStateChange) {
    return () => undefined;
  }

  const { data } = result.client.auth.onAuthStateChange((event, session) => {
    onChange(mapSupabaseSessionToAuthSnapshot(session, mapSupabaseAuthEventToLastEvent(event)));
  });

  return () => data.subscription.unsubscribe();
}

export function syncAuthAutoRefreshForAppState(
  appState: string,
  createClient: CreateAuthControllerClient = createSupabaseAuthClient
): AuthSessionSnapshot | null {
  const result = createClient();

  if (result.status === 'unconfigured') {
    return mapUnconfiguredAuthSnapshot(result.config.missingKeys);
  }

  if (appState === 'active') {
    result.client.auth.startAutoRefresh?.();
  } else {
    result.client.auth.stopAutoRefresh?.();
  }

  return null;
}
