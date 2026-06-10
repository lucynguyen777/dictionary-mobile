import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FeedbackStore } from '../backend/feedback';
import { createServer } from '../backend/server';

let server: Server | null = null;

afterEach(async () => {
  if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
  server = null;
});

async function start(feedbackStore?: FeedbackStore) {
  const { app } = createServer({
    env: {},
    feedbackStore,
    verifyAuth: async (token) => token === 'valid' ? { userId: 'user-a' } : null,
  });
  return new Promise<string>((resolve) => {
    server = app.listen(0, () => resolve(`http://localhost:${(server?.address() as AddressInfo).port}`));
  });
}

describe('feedback route', () => {
  it('requires auth and reports unconfigured storage explicitly', async () => {
    const baseUrl = await start();
    expect((await fetch(`${baseUrl}/proxy/feedback`, { method: 'POST' })).status).toBe(401);

    const response = await fetch(`${baseUrl}/proxy/feedback`, {
      body: JSON.stringify({ category: 'bug', message: 'This feedback message is long enough.' }),
      headers: { Authorization: 'Bearer valid', 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: 'feedback_storage_unconfigured' } });
  });

  it('accepts bounded feedback through the injected store', async () => {
    const feedbackStore: FeedbackStore = {
      configured: true,
      countRecent: vi.fn(async () => 0),
      submit: vi.fn(async () => ({ id: 'feedback-id' })),
    };
    const baseUrl = await start(feedbackStore);
    const response = await fetch(`${baseUrl}/proxy/feedback`, {
      body: JSON.stringify({ category: 'bug', context: '/reader', message: 'This feedback message is long enough.' }),
      headers: { Authorization: 'Bearer valid', 'Content-Type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: 'feedback-id', status: 'received' });
    expect(feedbackStore.submit).toHaveBeenCalledWith('user-a', expect.objectContaining({ category: 'bug' }));
  });
});
