import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AccountDeletionStore } from '../backend/accountDeletion';
import { createServer } from '../backend/server';

let server: Server | null = null;

afterEach(async () => {
  if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
  server = null;
});

function fakeStore(): AccountDeletionStore & { scheduled: Map<string, string> } {
  const scheduled = new Map<string, string>();
  return {
    cancelScheduled: vi.fn(async (userId: string) => void scheduled.delete(userId)),
    deleteNow: vi.fn(async () => undefined),
    getScheduled: vi.fn(async (userId: string) => (scheduled.has(userId) ? { purgeAfter: scheduled.get(userId)! } : null)),
    purgeDue: vi.fn(async () => 2),
    schedule: vi.fn(async (userId: string, purgeAfter: string) => void scheduled.set(userId, purgeAfter)),
    scheduled,
  };
}

async function start(env: Record<string, string>, accountDeletionStore?: AccountDeletionStore) {
  const { app } = createServer({
    accountDeletionStore,
    env,
    verifyAuth: async (token) => (token === 'valid' ? { userId: 'user-a' } : null),
  });
  return new Promise<string>((resolve) => {
    server = app.listen(0, () => resolve(`http://localhost:${(server?.address() as AddressInfo).port}`));
  });
}

const auth = { Authorization: 'Bearer valid', 'Content-Type': 'application/json' };
const request = (baseUrl: string, method: string, body?: unknown) =>
  fetch(`${baseUrl}/proxy/account/deletion`, { body: body ? JSON.stringify(body) : undefined, headers: auth, method });

describe('account deletion route', () => {
  it('defaults to scheduled deletion with a 30-day grace period (D3)', async () => {
    const baseUrl = await start({}, fakeStore());
    expect(await (await request(baseUrl, 'GET')).json()).toEqual({ graceDays: 30, mode: 'scheduled', scheduled: null });
  });

  it('can be turned off', async () => {
    const store = fakeStore();
    const baseUrl = await start({ ACCOUNT_DELETION_MODE: 'off' }, store);
    expect(await (await request(baseUrl, 'GET')).json()).toEqual({ graceDays: 30, mode: null, scheduled: null });
    const response = await request(baseUrl, 'POST', { confirm: 'DELETE' });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: 'account_deletion_unconfigured' } });
    expect(store.deleteNow).not.toHaveBeenCalled();
  });

  it('requires sign-in and an explicit confirmation', async () => {
    const store = fakeStore();
    const baseUrl = await start({ ACCOUNT_DELETION_MODE: 'immediate' }, store);
    expect((await fetch(`${baseUrl}/proxy/account/deletion`, { method: 'POST' })).status).toBe(401);
    const response = await request(baseUrl, 'POST', { confirm: 'yes' });
    expect(response.status).toBe(400);
    expect(store.deleteNow).not.toHaveBeenCalled();
  });

  it('immediate mode deletes the signed-in user only', async () => {
    const store = fakeStore();
    const baseUrl = await start({ ACCOUNT_DELETION_MODE: 'immediate' }, store);
    const response = await request(baseUrl, 'POST', { confirm: 'DELETE' });
    expect(await response.json()).toEqual({ status: 'deleted' });
    expect(store.deleteNow).toHaveBeenCalledWith('user-a');
  });

  it('scheduled mode records a grace period that can be cancelled', async () => {
    const store = fakeStore();
    const baseUrl = await start({ ACCOUNT_DELETION_GRACE_DAYS: '14', ACCOUNT_DELETION_MODE: 'scheduled' }, store);
    const before = Date.now();
    const scheduled = await (await request(baseUrl, 'POST', { confirm: 'DELETE' })).json();
    expect(scheduled.status).toBe('scheduled');
    const days = (Date.parse(scheduled.purgeAfter) - before) / 86_400_000;
    expect(days).toBeGreaterThan(13.99);
    expect(days).toBeLessThan(14.01);
    expect(store.deleteNow).not.toHaveBeenCalled();

    // Asking again keeps the original date.
    expect((await (await request(baseUrl, 'POST', { confirm: 'DELETE' })).json()).purgeAfter).toBe(scheduled.purgeAfter);
    expect(await (await request(baseUrl, 'GET')).json()).toEqual({ graceDays: 14, mode: 'scheduled', scheduled: { purgeAfter: scheduled.purgeAfter } });

    expect(await (await request(baseUrl, 'DELETE')).json()).toEqual({ scheduled: null });
    expect((await (await request(baseUrl, 'GET')).json()).scheduled).toBeNull();
  });

  it('purges due deletions only with the scheduler secret', async () => {
    const store = fakeStore();
    const baseUrl = await start({ ACCOUNT_DELETION_MODE: 'scheduled', CRON_SECRET: 'cron-secret' }, store);
    const purge = (secret?: string) =>
      fetch(`${baseUrl}/admin/purge-account-deletions`, { headers: secret ? { Authorization: `Bearer ${secret}` } : {}, method: 'POST' });
    expect((await purge()).status).toBe(401);
    // Vercel cron jobs call with GET.
    const cron = await fetch(`${baseUrl}/admin/purge-account-deletions`, { headers: { Authorization: 'Bearer cron-secret' } });
    expect(cron.status).toBe(200);
    expect((await purge('valid')).status).toBe(401);
    const response = await purge('cron-secret');
    expect(await response.json()).toEqual({ purged: 2 });
  });
});
