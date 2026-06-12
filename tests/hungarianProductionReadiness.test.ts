import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Hungarian production readiness', () => {
  it('normalizes Hungarian Unicode and resolves verified plural-plus-case forms', async () => {
    expect(words('ha\u0301zakban')).toContain('ház');
    expect(words('erdo\u030Bkben')).toContain('erdő');
    expect(words('kutya\u0301khoz')).toContain('kutya');
    expect(words('házzal')).toContain('ház');
    expect(words('hazakban')).not.toContain('ház');

    await expect(fetchMonolingualMeaning('ha\u0301zakban', 'hu')).resolves.toMatchObject({ word: 'ház' });
    await expect(fetchMonolingualMeaning('erdo\u030Bkben', 'hu')).resolves.toMatchObject({ word: 'erdő' });
    await expect(fetchMonolingualMeaning('házzal', 'hu')).resolves.toMatchObject({ word: 'ház' });
  });

  it('records the native-source candidate without promoting English-definition data', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/hungarian-production-source-audit.md'), 'utf8');

    expect(audit).toContain('strong native-source candidate');
    expect(audit).toContain('more than 555,000 articles');
    expect(audit).toContain('ineligible for Hungarian monolingual production definitions');
  });
});

function words(input: string) {
  return getMorphologyCandidates('hu', input).map((candidate) => candidate.word);
}
