import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Tagalog production readiness', () => {
  it('supports dictionary accents and the verified Baybayin fixture alias', async () => {
    expect(words('áso')).toContain('aso');
    expect(words('kaín')).toContain('kain');
    expect(words('basá')).toContain('basa');
    expect(words('ᜀᜐᜓ')).toContain('aso');

    await expect(fetchMonolingualMeaning('áso', 'tl')).resolves.toMatchObject({ word: 'aso' });
    await expect(fetchMonolingualMeaning('ᜀᜐᜓ', 'tl')).resolves.toMatchObject({ word: 'aso' });
  });

  it('records the native-source candidate without promoting English-definition data', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/tagalog-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable native-source candidate');
    expect(audit).toContain('ineligible for Tagalog monolingual production packaging');
    expect(audit).toContain('No production promotion is allowed');
  });
});

function words(input: string) {
  return getMorphologyCandidates('tl', input).map((candidate) => candidate.word);
}
