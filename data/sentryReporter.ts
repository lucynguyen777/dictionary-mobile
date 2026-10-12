import { redactErrorText, setErrorReporter, isErrorReportingEnabled, type ErrorContext } from '@/data/errorReporting';

// Sentry adapter for the provider-neutral reporter (owner decision D8: Sentry, opt-in).
// The SDK is only initialised after the learner turns on "Gửi báo cáo lỗi", and closed again when
// they turn it off, so no crash, session or device data leaves the device without consent.
// The DSN is a public client identifier (not a secret); it comes from EXPO_PUBLIC_SENTRY_DSN.

type SentryEvent = {
  exception?: { values?: { value?: string; type?: string }[] };
  message?: string;
  request?: unknown;
  user?: unknown;
  breadcrumbs?: unknown;
};

export type SentrySdk = {
  captureException: (error: unknown, hint?: { tags?: Record<string, string> }) => unknown;
  close: () => Promise<void> | void;
  init: (options: Record<string, unknown>) => void;
};

// Errors the SDK already catches through its own global handlers once it runs; forwarding them
// from our handlers as well would report each one twice.
const SDK_HANDLED_SOURCES = new Set<ErrorContext['source']>(['global', 'promise']);

export function scrubSentryEvent<T extends SentryEvent>(event: T): T | null {
  if (!isErrorReportingEnabled()) return null;
  const scrubbed: T = { ...event, breadcrumbs: undefined, request: undefined, user: undefined };
  if (scrubbed.message) scrubbed.message = redactErrorText(scrubbed.message);
  if (scrubbed.exception?.values) {
    scrubbed.exception = {
      ...scrubbed.exception,
      values: scrubbed.exception.values.map((value) => ({ ...value, value: value.value ? redactErrorText(value.value) : value.value })),
    };
  }
  return scrubbed;
}

export function installSentryReporter(dsn: string | undefined, sdk: SentrySdk, environment = 'production') {
  const trimmed = dsn?.trim();
  if (!trimmed) return false;
  let running = false;

  setErrorReporter({
    captureException(error, context) {
      if (!running || SDK_HANDLED_SOURCES.has(context.source)) return;
      const value = Object.assign(new Error(error.message), { name: error.name, stack: error.stack });
      sdk.captureException(value, { tags: { source: context.source } });
    },
    setEnabled(enabled) {
      if (enabled && !running) {
        sdk.init({
          beforeBreadcrumb: () => null,
          beforeSend: scrubSentryEvent,
          dsn: trimmed,
          enableAutoSessionTracking: false,
          environment,
          sendDefaultPii: false,
          tracesSampleRate: 0,
        });
        running = true;
      } else if (!enabled && running) {
        running = false;
        Promise.resolve(sdk.close()).catch(() => undefined);
      }
    },
  });
  return true;
}
