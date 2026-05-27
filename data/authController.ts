import type { AuthSession } from '@supabase/supabase-js';

import {
  mapAuthErrorToSnapshot,
  mapSupabaseSessionToAuthSnapshot,
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
  };
};

export type CreateAuthControllerClient = () => SupabaseAuthClientResult<AuthControllerClient>;

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

