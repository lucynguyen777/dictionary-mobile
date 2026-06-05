import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const dashboardRows = [
  'Dictionary Core | 90%',
  'Library System | 95%',
  'Flashcards | 95%',
  'Reader | 78%',
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
  });
});
