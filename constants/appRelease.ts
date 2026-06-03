export const APP_RELEASE = {
  cloudSyncMode: 'Manual beta sync',
  deployScope: 'Local-first + backend-gated AI/translation',
  label: 'Dictionary Mobile',
  version: '1.2.2',
} as const;

export function getAppReleaseSummary() {
  return `v${APP_RELEASE.version} · ${APP_RELEASE.cloudSyncMode}`;
}
