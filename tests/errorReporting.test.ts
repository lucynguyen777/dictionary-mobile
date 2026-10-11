import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getRecentErrors, installGlobalErrorHandlers, redactErrorText, reportError, setErrorReporter, setErrorReportingConsent } from '../data/errorReporting';

// These tests cover forwarding itself, so the learner has opted in; consent has its own test below.
beforeEach(() => setErrorReportingConsent(true));
afterEach(() => {
  setErrorReporter(null);
  setErrorReportingConsent(null);
});

describe('error reporting', () => {
  it('redacts personal data and credentials before reporting', () => {
    expect(redactErrorText('sync failed for lan@example.com')).toBe('sync failed for [email]');
    expect(redactErrorText('Authorization: Bearer abc.def-123')).toBe('Authorization: Bearer [token]');
    expect(redactErrorText('GET /cb?code=4%2F0Ab&state=x')).toBe('GET /cb?code=[redacted]&state=x');
    expect(redactErrorText('token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N')).toBe('token [jwt]');
    expect(redactErrorText('key sb_publishable_abcdefgh123')).toBe('key [key]');
  });

  it('forwards redacted errors to the configured reporter once per window', () => {
    const captureException = vi.fn();
    setErrorReporter({ captureException });

    expect(reportError(new Error('lookup failed for me@x.io'), { source: 'manual' }, 1_000)).toBe(true);
    expect(reportError(new Error('lookup failed for me@x.io'), { source: 'manual' }, 5_000)).toBe(false);
    expect(reportError(new Error('lookup failed for me@x.io'), { source: 'manual' }, 20_000)).toBe(true);

    expect(captureException).toHaveBeenCalledTimes(2);
    expect(captureException.mock.calls[0][0]).toMatchObject({ message: 'lookup failed for [email]', name: 'Error' });
    expect(getRecentErrors()[0]).toMatchObject({ message: 'lookup failed for [email]' });
  });

  it('never throws when no reporter is set or the reporter itself fails', () => {
    expect(() => reportError('plain string failure', { source: 'manual' }, 100_000)).not.toThrow();
    setErrorReporter({ captureException: () => { throw new Error('reporter down'); } });
    expect(() => reportError({ odd: true }, { source: 'manual' }, 200_000)).not.toThrow();
  });

  it('chains the native global handler and listens for web errors and rejections', () => {
    const captureException = vi.fn();
    setErrorReporter({ captureException });
    const previous = vi.fn();
    let handler: ((error: unknown, isFatal?: boolean) => void) | null = null;
    const listeners = new Map<string, (event: unknown) => void>();
    const scope = {
      addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
      ErrorUtils: { getGlobalHandler: () => previous, setGlobalHandler: (next: typeof handler) => { handler = next; } },
      removeEventListener: (type: string) => listeners.delete(type),
    } as unknown as typeof globalThis;

    const uninstall = installGlobalErrorHandlers(scope);
    handler!(new Error('native crash A'), true);
    expect(previous).toHaveBeenCalledWith(expect.any(Error), true);
    listeners.get('unhandledrejection')!({ reason: new Error('rejected B') });
    listeners.get('error')!({ error: new Error('window C') });
    expect(captureException.mock.calls.map(([error, context]) => [error.message, context.source])).toEqual([
      ['native crash A', 'global'],
      ['rejected B', 'promise'],
      ['window C', 'global'],
    ]);

    uninstall();
    expect(handler).toBe(previous);
    expect(listeners.size).toBe(0);
  });
});

describe('crash report consent (D8)', () => {
  it('sends nothing until the learner opts in while the build default is opt-in', async () => {
    const { CRASH_REPORTS_DEFAULT_ON, reportError, setErrorReporter, setErrorReportingConsent } = await import('../data/errorReporting');
    const captureException = vi.fn();
    setErrorReporter({ captureException });

    setErrorReportingConsent(null);
    reportError(new Error('consent default'), { source: 'manual' }, 1_000_000);
    expect(captureException).toHaveBeenCalledTimes(CRASH_REPORTS_DEFAULT_ON ? 1 : 0);

    setErrorReportingConsent(true);
    reportError(new Error('consent on'), { source: 'manual' }, 1_000_000);
    expect(captureException).toHaveBeenCalledTimes(CRASH_REPORTS_DEFAULT_ON ? 2 : 1);

    setErrorReportingConsent(false);
    reportError(new Error('consent off'), { source: 'manual' }, 1_000_000);
    expect(captureException).toHaveBeenCalledTimes(CRASH_REPORTS_DEFAULT_ON ? 2 : 1);

    setErrorReporter(null);
    setErrorReportingConsent(null);
  });
});
