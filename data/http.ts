// Shared fetch with a timeout (plan 0.7). A request that hangs (captive portal, stalled provider)
// fails with FetchTimeoutError instead of leaving a spinner forever. A caller's own AbortSignal
// still works and wins over the timeout.
export const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

export class FetchTimeoutError extends Error {
  readonly code = 'fetch_timeout';

  constructor(readonly timeoutMs: number) {
    super(`Request timed out after ${timeoutMs} ms.`);
    this.name = 'FetchTimeoutError';
  }
}

export type FetchWithTimeoutInit = RequestInit & { timeoutMs?: number };

export async function fetchWithTimeout(input: string | URL, init: FetchWithTimeoutInit = {}): Promise<Response> {
  const { signal, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, ...rest } = init;
  const controller = new AbortController();
  const forwardAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) controller.abort(signal.reason);
  else signal?.addEventListener('abort', forwardAbort, { once: true });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } catch (error) {
    if (timedOut) throw new FetchTimeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
