// The learner's crash-report choice for this device (plan 7.1). Kept apart from the profile because
// it is a device setting and never syncs.
import { setErrorReportingConsent } from './errorReporting';
import { getStoredItem, setStoredItem } from './storageAdapter';

export const CRASH_REPORT_PREFERENCE_KEY = 'dictionary-mobile.crash-reports.v1';

export async function loadCrashReportPreference(): Promise<boolean | null> {
  const raw = await getStoredItem(CRASH_REPORT_PREFERENCE_KEY).catch(() => null);
  const choice = raw === 'on' ? true : raw === 'off' ? false : null;
  setErrorReportingConsent(choice);
  return choice;
}

export async function saveCrashReportPreference(enabled: boolean) {
  await setStoredItem(CRASH_REPORT_PREFERENCE_KEY, enabled ? 'on' : 'off');
  setErrorReportingConsent(enabled);
}
