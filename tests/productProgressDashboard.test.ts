import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const dashboardRows = [
  'Dictionary Core | 90%',
  'Library System | 95%',
  'Flashcards | 95%',
  'Reader | 86%',
  'Import/Export | 90%',
  'Profile & Privacy | 85%',
  'SQLite Local-first Architecture | 95%',
  'Offline Dictionary | 85%',
  'Multilingual Architecture | 88%',
  'Supabase Auth | 75%',
  'Cloud Sync | 70%',
  'AI Infrastructure | 70%',
  'OCR Infrastructure | 65%',
  'Real OCR Engine | 20%',
  'Pronunciation Assessment | 10%',
];

const completionAuditRows = [
  'Dictionary Core | 90%',
  'Language Production Parity | 35%',
  'Google Sheets | 15%',
  'Feedback | 15%',
];

const nextModuleQueue = [
  'Language Source And Corpus Smoke',
  'Supabase Auth And Cloud Sync Production Smoke',
  'Reader OCR Production Wiring',
  'Provider Feature Gates',
  'Offline Pack Expansion',
];

const completionGapRows = [
  'Dictionary Core | Larger real corpus coverage',
  'Reader | Native PDF gate validation',
  'Cloud Sync | RLS probes',
  'Pronunciation | Azure backend upload/proxy',
];

const versionedModules = [
  'v1.3.6 - Language Source And Corpus Smoke',
  'v1.3.7 - Supabase Auth And Cloud Sync Production Smoke',
  'v1.3.8 - Reader OCR Production Wiring',
  'v1.3.9 - Provider Feature Gates',
  'v1.3.10 - Offline Pack Expansion',
];

describe('product progress dashboard', () => {
  it('documents readiness percent, status, blocker, and next module rows', () => {
    const progress = readFileSync(resolve(process.cwd(), 'docs/product-progress.md'), 'utf8');

    expect(progress).toContain('## Product Readiness Dashboard');
    expect(progress).toContain('| Hạng mục | Tiến độ | Production status | Top blocker | Next module |');
    for (const row of dashboardRows) {
      expect(progress).toContain(row);
    }
    expect(progress).toContain('## Language Parity Dashboard');
    expect(progress).toContain('docs/language-coverage-inventory.md');
    expect(progress).toContain('Machine translation must not be used as dictionary data.');
    expect(progress).toContain('## Feature Completion Audit');
    expect(progress).toContain('| Feature group | Completion | State | Completed evidence | Main blocker | Next module |');
    for (const row of completionAuditRows) {
      expect(progress).toContain(row);
    }
    expect(progress).toContain('### Completion Gaps Under 100%');
    expect(progress).toContain('| Area | Missing to reach 100% | Target version/module |');
    for (const row of completionGapRows) {
      expect(progress).toContain(row);
    }
    expect(progress).toContain('### Versioned Completion Roadmap');
    for (const moduleName of versionedModules) {
      expect(progress).toContain(moduleName);
    }
    expect(progress).toContain('v1.3.5 Completion Dashboard And Version Roadmap Sync');
    for (const moduleName of nextModuleQueue) {
      expect(progress).toContain(moduleName);
    }
  });
});
