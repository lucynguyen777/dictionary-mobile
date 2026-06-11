import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { getLanguageCoverageInventoryRows } from '../data/languageCoverageInventory';

const reconciledPlans = [
  ['am', 'amharic-language-plan.md'], ['ml', 'malayalam-language-plan.md'],
  ['ru', 'russian-language-plan.md'], ['so', 'somali-language-plan.md'],
  ['sw', 'swahili-language-plan.md'], ['zh', 'mandarin-language-plan.md'],
] as const;

describe('language plan truth reconciliation', () => {
  it('keeps implemented preview plans aligned with generated inventory', () => {
    const inventory = getLanguageCoverageInventoryRows();
    for (const [code, file] of reconciledPlans) {
      const plan = readFileSync(resolve(process.cwd(), 'docs', file), 'utf8');
      expect(inventory.find((item) => item.code === code)).toMatchObject({
        hasRegisteredAdapter: true,
        status: 'monolingual-preview',
      });
      expect(plan).toContain('**State**: Implemented monolingual preview.');
      expect(plan).toContain('Production gap');
    }
  });
});
