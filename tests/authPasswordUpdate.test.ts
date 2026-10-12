import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('../data/authTokenStorage', () => ({
  AUTH_TOKEN_STORAGE_KIND: 'memory',
  authTokenStorage: { getItem: vi.fn(), removeItem: vi.fn(), setItem: vi.fn() },
}));

import {
  completeAuthCallback,
  sendPasswordRecoveryEmail,
  updateAuthPassword,
  validateNewPassword,
  type AuthControllerClient,
} from '../data/authController';

const session = {
  access_token: 'token',
  user: { email: 'lan@example.com', email_confirmed_at: '2026-10-01T00:00:00.000Z', id: 'user-1' },
};

function createClient(overrides: Partial<AuthControllerClient['auth']> = {}, hasSession = true) {
  const auth = {
    exchangeCodeForSession: vi.fn(async () => ({ data: { session }, error: null })),
    getSession: vi.fn(async () => ({ data: { session: hasSession ? session : null }, error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    updateUser: vi.fn(async () => ({ data: {}, error: null })),
    ...overrides,
  };
  const factory = () => ({
    client: { auth } as unknown as AuthControllerClient,
    config: { publishableKey: 'key', status: 'configured' as const, url: 'https://example.supabase.co' },
    status: 'configured' as const,
    storageKind: 'memory',
  });
  return { auth, factory };
}

describe('validateNewPassword', () => {
  it.each([
    ['short', 'short', 'Mật khẩu cần ít nhất 8 ký tự.'],
    ['long-enough-1', 'different-1', 'Hai mật khẩu chưa khớp.'],
    ['x'.repeat(73), 'x'.repeat(73), 'Mật khẩu quá dài (tối đa 72 byte).'],
    ['long-enough-1', 'long-enough-1', null],
  ])('%s', (password, confirmation, expected) => {
    expect(validateNewPassword(password, confirmation)).toBe(expected);
  });
});

describe('updateAuthPassword', () => {
  it('updates the password for the signed-in user', async () => {
    const { auth, factory } = createClient();
    await expect(updateAuthPassword('new-password-1', 'new-password-1', factory)).resolves.toEqual({ ok: true });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-password-1' });
  });

  it('rejects invalid input before calling Supabase', async () => {
    const { auth, factory } = createClient();
    await expect(updateAuthPassword('short', 'short', factory)).resolves.toMatchObject({ ok: false });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('requires a session', async () => {
    const { auth, factory } = createClient({}, false);
    const result = await updateAuthPassword('new-password-1', 'new-password-1', factory);
    expect(result).toMatchObject({ ok: false });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('translates Supabase errors without leaking raw messages', async () => {
    const { factory } = createClient({
      updateUser: vi.fn(async () => ({ data: {}, error: { message: 'New password should be different from the old password.' } })),
    });
    await expect(updateAuthPassword('new-password-1', 'new-password-1', factory)).resolves.toEqual({
      message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
      ok: false,
    });
  });
});

describe('password recovery flow', () => {
  it('marks reset links so the callback can ask for a new password', async () => {
    const { auth, factory } = createClient();
    await sendPasswordRecoveryEmail('lan@example.com', factory);
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('lan@example.com', {
      redirectTo: expect.stringMatching(/\/auth\/callback\?flow=recovery$/),
    });

    await expect(completeAuthCallback({ code: 'abc', flow: 'recovery' }, factory)).resolves.toMatchObject({
      lastAuthEvent: 'password-recovery',
      status: 'authenticated',
    });
    await expect(completeAuthCallback({ code: 'abc' }, factory)).resolves.toMatchObject({ lastAuthEvent: 'recovery' });
  });
});
