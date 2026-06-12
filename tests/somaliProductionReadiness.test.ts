import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { getMorphologyCandidates } from '../data/morphology';

describe('Somali production readiness', () => {
  it('covers extended articles and fixture-backed irregular plurals', () => {
    expect(words('buuggaas')).toContain('buug');
    expect(words('buuggii')).toContain('buug');
    expect(words('bisaddii')).toContain('bisad');
    expect(words('buugaag')).toContain('buug');
    expect(words('guryo')).toContain('guri');
  });

  it('keeps Somali production source-blocked until Somali definitions exist', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/somali-production-source-audit.md'), 'utf8');

    expect(audit).toContain('production promotion source-blocked');
    expect(audit).toContain('English definitions');
    expect(audit).toContain('Somali-language definitions');
  });
});

function words(input: string) {
  return getMorphologyCandidates('so', input).map((candidate) => candidate.word);
}
