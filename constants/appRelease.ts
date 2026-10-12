export const APP_RELEASE = {
  cloudSyncMode: 'Auto cloud sync (beta)',
  deployScope: 'Local-first + backend-gated AI/translation',
  label: 'Dictionary Mobile',
  version: '1.3.8',
} as const;

export function getAppReleaseSummary() {
  return `v${APP_RELEASE.version} · ${APP_RELEASE.cloudSyncMode}`;
}
