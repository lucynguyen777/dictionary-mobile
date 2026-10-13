// Provider-neutral error reporting (plan 7.1). Owner decision D8: Sentry, opt-in. The Sentry adapter
// (data/sentryReporter.ts) plugs in with setErrorReporter() when a DSN is configured; without one,
// errors are only kept in memory for this session and logged in development.

export type ErrorContext = { source: 'render' | 'global' | 'promise' | 'manual'; [key: string]: unknown };

export type ErrorReporter = {
  captureException: (error: { message: string; name: string; stack?: string }, context: ErrorContext) => void;
  // Told whenever reporting turns on or off, so the provider SDK only runs after consent.
  setEnabled?: (enabled: boolean) => void;
};

export type RecordedError = { at: string; context: ErrorContext; message: string; name: string };

const MAX_RECENT = 20;
const SAME_ERROR_WINDOW_MS = 10_000;

// Owner decision D8: opt-in. Nothing is sent until the learner turns on "Gửi báo cáo lỗi".
export const CRASH_REPORTS_DEFAULT_ON = false;

let reporter: ErrorReporter | null = null;
let consent: boolean | null = null;
const recent: RecordedError[] = [];
const lastSeen = new Map<string, number>();

function notifyEnabled() {
  try {
    reporter?.setEnabled?.(isErrorReportingEnabled());
  } catch {
    // A failing reporter must never crash the app it is reporting on.
  }
}

export function setErrorReporter(next: ErrorReporter | null) {
  reporter = next;
  notifyEnabled();
}

export function hasErrorReporter() {
  return reporter !== null;
}

// The learner's choice from Profile (null = not chosen yet, CRASH_REPORTS_DEFAULT_ON applies).
export function setErrorReportingConsent(choice: boolean | null) {
  consent = choice;
  notifyEnabled();
}

export function isErrorReportingEnabled() {
  return consent ?? CRASH_REPORTS_DEFAULT_ON;
}

export function getRecentErrors(): readonly RecordedError[] {
  return recent;
}

// Error text can carry user data (emails, tokens in URLs, looked-up words in messages). Strip the
// obvious identifiers before anything leaves the device.
export function redactErrorText(text: string) {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\b(Bearer|bearer)\s+[\w.~+/=-]+/g, '$1 [token]')
    .replace(/([?&](?:access_token|refresh_token|token|code|key|apikey|api_key)=)[^&\s"']+/gi, '$1[redacted]')
    .replace(/\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{5,}\b/g, '[jwt]')
    .replace(/\b(sk|pk|sb)_[A-Za-z0-9_-]{8,}\b/g, '[key]');
}

function normalize(error: unknown) {
  if (error instanceof Error) {
    return { message: redactErrorText(error.message), name: error.name || 'Error', stack: error.stack ? redactErrorText(error.stack) : undefined };
  }
  return { message: redactErrorText(typeof error === 'string' ? error : JSON.stringify(error) ?? String(error)), name: 'NonError' };
}

export function reportError(error: unknown, context: ErrorContext = { source: 'manual' }, now = Date.now()) {
  const normalized = normalize(error);
  // The same error repeating (e.g. a render loop) is reported once per window.
  const key = `${context.source}:${normalized.name}:${normalized.message}`;
  const previous = lastSeen.get(key);
  if (previous !== undefined && now - previous < SAME_ERROR_WINDOW_MS) return false;
  lastSeen.set(key, now);

  recent.unshift({ at: new Date(now).toISOString(), context, message: normalized.message, name: normalized.name });
  recent.length = Math.min(recent.length, MAX_RECENT);

  if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn(`[error:${context.source}]`, normalized.message);
  try {
    if (isErrorReportingEnabled()) reporter?.captureException(normalized, context);
  } catch {
    // A failing reporter must never crash the app it is reporting on.
  }
  return true;
}

type GlobalErrorUtils = {
  getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler: (handler: (error: unknown, isFatal?: boolean) => void) => void;
};

// Catches errors outside React rendering: native global handler, web window errors, and
// unhandled promise rejections. Returns an uninstall function.
export function installGlobalErrorHandlers(scope: typeof globalThis = globalThis) {
  const cleanups: (() => void)[] = [];
  const errorUtils = (scope as unknown as { ErrorUtils?: GlobalErrorUtils }).ErrorUtils;
  if (errorUtils) {
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      reportError(error, { isFatal: Boolean(isFatal), source: 'global' });
      previous(error, isFatal);
    });
    cleanups.push(() => errorUtils.setGlobalHandler(previous));
  }
  const target = scope as unknown as {
    addEventListener?: (type: string, listener: (event: any) => void) => void;
    removeEventListener?: (type: string, listener: (event: any) => void) => void;
  };
  if (typeof target.addEventListener === 'function') {
    const onError = (event: { error?: unknown; message?: string }) => reportError(event.error ?? event.message, { source: 'global' });
    const onRejection = (event: { reason?: unknown }) => reportError(event.reason, { source: 'promise' });
    target.addEventListener('error', onError);
    target.addEventListener('unhandledrejection', onRejection);
    cleanups.push(() => {
      target.removeEventListener?.('error', onError);
      target.removeEventListener?.('unhandledrejection', onRejection);
    });
  }
  return () => cleanups.forEach((cleanup) => cleanup());
}
