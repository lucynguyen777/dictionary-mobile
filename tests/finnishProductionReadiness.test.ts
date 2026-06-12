import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Finnish production readiness', () => {
  it('normalizes Finnish Unicode and restores the verified käsi gradation stem across cases', async () => {
    expect(words('ka\u0308dessa\u0308')).toContain('käsi');
    expect(words('kädestä')).toContain('käsi');
    expect(words('kädellä')).toContain('käsi');
    expect(words('kädeltä')).toContain('käsi');
    expect(words('kädelle')).toContain('käsi');

    await expect(fetchMonolingualMeaning('ka\u0308dessa\u0308', 'fi')).resolves.toMatchObject({ word: 'käsi' });
    await expect(fetchMonolingualMeaning('kädeltä', 'fi')).resolves.toMatchObject({ word: 'käsi' });
  });

  it('records the native-source candidate without promoting English-definition data', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/finnish-production-source-audit.md'), 'utf8');

    expect(audit).toContain('strong native-source candidate');
    expect(audit).toContain('more than 710,000 articles');
    expect(audit).toContain('ineligible for Finnish monolingual production definitions');
  });
});

function words(input: string) {
  return getMorphologyCandidates('fi', input).map((candidate) => candidate.word);
}
