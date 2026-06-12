import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LANGUAGE_PROMOTION_THRESHOLDS } from '../data/languagePromotionGate';

describe('corpus definition-language gate', () => {
  it('requires explicit definition language and rejects non-monolingual candidates by default', () => {
    const extractor = readFileSync(resolve(process.cwd(), 'scripts/extract-kaikki-candidate.mjs'), 'utf8');

    expect(extractor).toContain("Missing --definition-lang");
    expect(extractor).toContain('Rejected non-monolingual candidate');
    expect(extractor).toContain("args.allowBilingual !== 'true'");
    expect(extractor).toContain('definitionLanguageCode');
  });

  it('does not lower production thresholds when an eligible corpus is unavailable', () => {
    expect(LANGUAGE_PROMOTION_THRESHOLDS.attributedEntries).toBe(5_000);
    expect(LANGUAGE_PROMOTION_THRESHOLDS.offlinePackEntryCount).toBe(5_000);
  });

  it('documents Hawaiian English-gloss data as ineligible for monolingual production', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/hawaiian-production-source-audit.md'), 'utf8');

    expect(audit).toContain('production promotion source-blocked');
    expect(audit).toContain('sampled definitions');
    expect(audit).toContain('English glosses');
    expect(audit).toContain('cannot satisfy');
  });
});
