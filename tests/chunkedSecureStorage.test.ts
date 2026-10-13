import { describe, expect, it } from 'vitest';

import { createChunkedSecureStorage, type SecureStoreLike } from '../data/chunkedSecureStorage';

function fakeSecureStore() {
  const values = new Map<string, string>();
  const store: SecureStoreLike = {
    deleteItemAsync: async (key) => void values.delete(key),
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => {
      if (new TextEncoder().encode(value).length > 2048) throw new Error('Value larger than 2048 bytes');
      values.set(key, value);
    },
  };
  return { store, values };
}

const session = JSON.stringify({
  access_token: `eyJ${'a'.repeat(1200)}`,
  refresh_token: 'r'.repeat(40),
  user: { email: 'learner@example.com', user_metadata: { full_name: 'Nguyễn Thị Hồng Nhung '.repeat(60) } },
});

describe('chunked secure storage', () => {
  it('stores a session larger than one SecureStore entry and reads it back', async () => {
    const { store, values } = fakeSecureStore();
    const storage = createChunkedSecureStorage(store);
    expect(new TextEncoder().encode(session).length).toBeGreaterThan(2048);

    await storage.setItem('sb-auth-token', session);
    expect(await storage.getItem('sb-auth-token')).toBe(session);
    expect(Number(values.get('sb-auth-token.count'))).toBeGreaterThan(3);
  });

  it('removes leftover chunks when the value shrinks, and everything on remove', async () => {
    const { store, values } = fakeSecureStore();
    const storage = createChunkedSecureStorage(store);
    await storage.setItem('k', session);
    await storage.setItem('k', 'short');
    expect(await storage.getItem('k')).toBe('short');
    expect([...values.keys()].sort()).toEqual(['k.0', 'k.count']);

    await storage.removeItem('k');
    expect(values.size).toBe(0);
    expect(await storage.getItem('k')).toBeNull();
  });

  it('reads a session saved by the previous version under the plain key, then migrates it', async () => {
    const { store, values } = fakeSecureStore();
    values.set('k', '{"legacy":true}');
    const storage = createChunkedSecureStorage(store);
    expect(await storage.getItem('k')).toBe('{"legacy":true}');

    await storage.setItem('k', '{"fresh":true}');
    expect(values.has('k')).toBe(false);
    expect(await storage.getItem('k')).toBe('{"fresh":true}');
  });

  it('treats a missing chunk (interrupted write) as signed out', async () => {
    const { store, values } = fakeSecureStore();
    const storage = createChunkedSecureStorage(store);
    await storage.setItem('k', session);
    values.delete('k.1');
    expect(await storage.getItem('k')).toBeNull();
  });
});
