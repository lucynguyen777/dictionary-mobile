import type { AuthSession, AuthUser } from '@supabase/supabase-js';

import {
  type AuthLastEvent,
  mapAuthErrorToSnapshot,
  mapSupabaseSessionToAuthSnapshot,
  mapSupabaseUserToAuthSnapshot,
  type AuthSessionSnapshot,
} from './authSession';
import { getSharedSupabaseAuthClient, type SupabaseAuthClientResult } from './supabaseAuthClient';

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
    signUp: (credentials: AuthSignUpCredentials) => Promise<{
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
    updateUser?: (attributes: { password: string }) => Promise<{
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
    verifyOtp?: (params: { token_hash: string; type: 'email' | 'recovery' | 'signup' }) => Promise<{
      data: {
        session: AuthSession | null;
        user: AuthUser | null;
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

export type AuthSignUpCredentials = AuthCredentials & {
  options?: {
    emailRedirectTo?: string;
  };
};

export const AUTH_CALLBACK_URL = 'dictionairemobile://auth/callback';

export function getAuthCallbackUrl(webOrigin?: string) {
  const origin = webOrigin ?? (typeof window !== 'undefined' ? window.location?.origin : undefined);
  if (origin) {
    return `${origin.replace(/\/+$/, '')}/auth/callback`;
  }

  return AUTH_CALLBACK_URL;
}

export type AuthCallbackParams = {
  code?: string | string[];
  // Set on password-reset links we send, so the callback can ask for a new password.
  flow?: string | string[];
  error?: string | string[];
  error_description?: string | string[];
  token_hash?: string | string[];
  type?: string | string[];
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
  createClient: CreateAuthControllerClient = getSharedSupabaseAuthClient
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
  createClient: CreateAuthControllerClient = getSharedSupabaseAuthClient
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
  createClient: CreateAuthControllerClient = getSharedSupabaseAuthClient
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
  createClient: CreateAuthControllerClient = getSharedSupabaseAuthClient
): Promise<AuthSessionSnapshot> {
  const result = createClient();

  if (result.status === 'unconfigured') {
    return mapUnconfiguredAuthSnapshot(result.config.missingKeys);
  }

  const { data, error } = await result.client.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
    },
  });

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
  createClient: CreateAuthControllerClient = getSharedSupabaseAuthClient
): Promise<AuthSessionSnapshot> {
  const result = createClient();

  if (result.status === 'unconfigured') {
    return mapUnconfiguredAuthSnapshot(result.config.missingKeys);
  }

  const { error } = await result.client.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAuthCallbackUrl()}?flow=recovery`,
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
  createClient: CreateAuthControllerClient = getSharedSupabaseAuthClient
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
  const tokenHash = getFirstParamValue(params.token_hash);
  const callbackType = getFirstParamValue(params.type);
  const sessionEvent = callbackType === 'recovery' || getFirstParamValue(params.flow) === 'recovery'
    ? 'password-recovery'
    : 'recovery';

  if (tokenHash && result.client.auth.verifyOtp) {
    const type = callbackType === 'recovery' || callbackType === 'email' ? callbackType : 'signup';
    const { data, error } = await result.client.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return mapAuthErrorToSnapshot(error.message, 'recovery');
    if (data.session) return mapSupabaseSessionToAuthSnapshot(data.session, sessionEvent);
    return mapSupabaseUserToAuthSnapshot(data.user, 'recovery');
  }

  if (!code) {
    return {
      status: 'unauthenticated',
      userId: null,
      email: null,
      emailVerified: true,
      phone: null,
      lastAuthEvent: 'recovery',
    };
  }

  const { data, error } = await result.client.auth.exchangeCodeForSession(code);

  if (error) {
    return mapAuthErrorToSnapshot(error.message, 'recovery');
  }

  return mapSupabaseSessionToAuthSnapshot(data.session, sessionEvent);
}

export const MIN_PASSWORD_LENGTH = 8;
// bcrypt, which Supabase Auth uses, ignores bytes past 72.
export const MAX_PASSWORD_LENGTH = 72;

export function validateNewPassword(password: string, confirmation: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_LENGTH) return 'Mật khẩu quá dài (tối đa 72 byte).';
  if (password !== confirmation) return 'Hai mật khẩu chưa khớp.';
  return null;
}

export type UpdatePasswordResult = { ok: true } | { ok: false; message: string };

// Changes the signed-in user's password (also used after opening a password-reset link).
export async function updateAuthPassword(
  password: string,
  confirmation: string,
  createClient: CreateAuthControllerClient = getSharedSupabaseAuthClient
): Promise<UpdatePasswordResult> {
  const validationError = validateNewPassword(password, confirmation);
  if (validationError) return { ok: false, message: validationError };

  const result = createClient();
  if (result.status === 'unconfigured' || !result.client.auth.updateUser) {
    return { ok: false, message: 'Đăng nhập cloud chưa được cấu hình trên bản cài đặt này.' };
  }

  const { data: sessionData } = await result.client.auth.getSession();
  if (!sessionData.session) {
    return { ok: false, message: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại hoặc mở lại liên kết đặt lại mật khẩu.' };
  }

  const { error } = await result.client.auth.updateUser({ password });
  if (error) return { ok: false, message: describePasswordUpdateError(error.message) };
  return { ok: true };
}

function describePasswordUpdateError(message: string) {
  if (/same.*password|different from the old/i.test(message)) return 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  if (/weak|strength|characters/i.test(message)) return 'Mật khẩu chưa đủ mạnh theo yêu cầu của máy chủ.';
  if (/reauthenticat|recent/i.test(message)) return 'Vì an toàn, hãy đăng nhập lại rồi đổi mật khẩu.';
  return 'Không thể đổi mật khẩu lúc này. Thử lại sau.';
}

export function subscribeToAuthSessionChanges(
  onChange: (snapshot: AuthSessionSnapshot) => void,
  createClient: CreateAuthControllerClient = getSharedSupabaseAuthClient
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
  createClient: CreateAuthControllerClient = getSharedSupabaseAuthClient
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
