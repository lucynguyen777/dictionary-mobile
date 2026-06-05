import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { APP_RELEASE } from '../constants/appRelease';

const releaseVersion = '1.3.4';

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8')) as T;
}

function readText(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('release consistency', () => {
  it('keeps app release metadata aligned', () => {
    const packageJson = readJson<{ version: string }>('package.json');
    const packageLockJson = readJson<{ version: string; packages: Record<string, { version?: string }> }>(
      'package-lock.json'
    );
    const appJson = readJson<{ expo: { version: string } }>('app.json');

    expect(APP_RELEASE.version).toBe(releaseVersion);
    expect(packageJson.version).toBe(releaseVersion);
    expect(packageLockJson.version).toBe(releaseVersion);
    expect(packageLockJson.packages[''].version).toBe(releaseVersion);
    expect(appJson.expo.version).toBe(releaseVersion);
  });

  it('keeps release docs pointing at the current deployable version', () => {
    expect(readText('README.md')).toContain(`current deployable release is v${releaseVersion}`);
    expect(readText('docs/deployment-options.md')).toContain(`ready to ship as v${releaseVersion}`);
    expect(readText('.ai/context/current-product-state.md')).toContain(`v${releaseVersion} product-readiness`);
  });

  it('keeps cloud sync smoke docs manual-only', () => {
    const smokeDocs = [
      readText('docs/supabase-cloud-sync-manual-smoke.md'),
      readText('docs/supabase-cloud-sync-manual-smoke-execution.md'),
    ].join('\n');

    expect(smokeDocs).toContain('Đồng bộ ngay');
    expect(smokeDocs).toContain('Sync now');
    expect(smokeDocs).not.toMatch(/foreground\/start sync/i);
    expect(smokeDocs).not.toMatch(/production UI toggle remains absent/i);
  });
});
