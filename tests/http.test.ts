import { afterEach, describe, expect, it, vi } from 'vitest';

import { FetchTimeoutError, fetchWithTimeout } from '../data/http';

// A fetch that only settles when its signal aborts, like a stalled connection.
function hangingFetch() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  }));
}

describe('fetchWithTimeout', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns the response when the server answers in time', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));
    await expect((await fetchWithTimeout('https://example.test', { timeoutMs: 50 })).text()).resolves.toBe('ok');
  });

  it('fails with FetchTimeoutError when the request stalls', async () => {
    vi.useFakeTimers();
    hangingFetch();
    const pending = fetchWithTimeout('https://example.test', { timeoutMs: 1_000 });
    const assertion = expect(pending).rejects.toMatchObject({ code: 'fetch_timeout', timeoutMs: 1_000 });
    await vi.advanceTimersByTimeAsync(1_000);
    await assertion;
    await expect(pending).rejects.toBeInstanceOf(FetchTimeoutError);
  });

  it("keeps the caller's own abort as a normal abort, not a timeout", async () => {
    hangingFetch();
    const controller = new AbortController();
    const pending = fetchWithTimeout('https://example.test', { signal: controller.signal, timeoutMs: 60_000 });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('passes method, headers and body through', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    await fetchWithTimeout('https://example.test', { body: 'x', headers: { A: 'b' }, method: 'POST' });
    expect(spy.mock.calls[0][1]).toMatchObject({ body: 'x', headers: { A: 'b' }, method: 'POST' });
    expect(spy.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
