import { afterEach, describe, expect, it, vi } from 'vitest';

import { reportError, setErrorReporter, setErrorReportingConsent } from '@/data/errorReporting';
import { installSentryReporter, scrubSentryEvent } from '@/data/sentryReporter';

function fakeSdk() {
  return { captureException: vi.fn(), close: vi.fn(async () => undefined), init: vi.fn() };
}

afterEach(() => {
  setErrorReporter(null);
  setErrorReportingConsent(null);
});

describe('Sentry reporter (D8: opt-in)', () => {
  it('does nothing without a DSN', () => {
    const sdk = fakeSdk();
    expect(installSentryReporter('  ', sdk)).toBe(false);
    setErrorReportingConsent(true);
    expect(sdk.init).not.toHaveBeenCalled();
  });

  it('starts the SDK only after consent and stops it when consent is withdrawn', () => {
    const sdk = fakeSdk();
    installSentryReporter('https://key@o1.ingest.sentry.io/1', sdk);
    expect(sdk.init).not.toHaveBeenCalled();

    reportError(new Error('before consent'), { source: 'render' }, 1);
    expect(sdk.captureException).not.toHaveBeenCalled();

    setErrorReportingConsent(true);
    expect(sdk.init).toHaveBeenCalledTimes(1);
    expect(sdk.init.mock.calls[0][0]).toMatchObject({ enableAutoSessionTracking: false, sendDefaultPii: false, tracesSampleRate: 0 });

    reportError(new Error('render failed for a@b.co'), { source: 'render' }, 2);
    expect(sdk.captureException).toHaveBeenCalledTimes(1);
    expect((sdk.captureException.mock.calls[0][0] as Error).message).toBe('render failed for [email]');

    setErrorReportingConsent(false);
    expect(sdk.close).toHaveBeenCalledTimes(1);
    reportError(new Error('after withdrawal'), { source: 'render' }, 3);
    expect(sdk.captureException).toHaveBeenCalledTimes(1);
  });

  it('leaves global errors to the SDK handlers so they are not sent twice', () => {
    const sdk = fakeSdk();
    installSentryReporter('https://key@o1.ingest.sentry.io/1', sdk);
    setErrorReportingConsent(true);
    reportError(new Error('uncaught'), { source: 'global' }, 1);
    expect(sdk.captureException).not.toHaveBeenCalled();
  });

  it('drops events without consent and scrubs personal data otherwise', () => {
    const event = { exception: { values: [{ value: 'token Bearer abc.def' }] }, message: 'mail me at x@y.vn', request: { url: 'u' }, user: { id: '1' } };
    setErrorReportingConsent(false);
    expect(scrubSentryEvent(event)).toBeNull();
    setErrorReportingConsent(true);
    const scrubbed = scrubSentryEvent(event);
    expect(scrubbed?.message).toBe('mail me at [email]');
    expect(scrubbed?.exception?.values?.[0].value).toBe('token Bearer [token]');
    expect(scrubbed?.user).toBeUndefined();
    expect(scrubbed?.request).toBeUndefined();
  });
});
