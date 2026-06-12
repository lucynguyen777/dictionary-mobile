import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Kazakh production readiness', () => {
  it('preserves Kazakh Cyrillic and resolves verified negative/comparative forms', async () => {
    expect(words('КІТАПТАРДА')).toContain('кітап');
    expect(words('айтпады')).toContain('айту');
    expect(words('жақсырақ')).toContain('жақсы');
    expect(words('китаптарда')).not.toContain('кітап');

    await expect(fetchMonolingualMeaning('КІТАПТАРДА', 'kk')).resolves.toMatchObject({ word: 'кітап' });
    await expect(fetchMonolingualMeaning('айтпады', 'kk')).resolves.toMatchObject({ word: 'айту' });
    await expect(fetchMonolingualMeaning('жақсырақ', 'kk')).resolves.toMatchObject({ word: 'жақсы' });
  });

  it('records the native-source corpus constraint without promoting gated sources', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/kazakh-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable but corpus-size-constrained native-source candidate');
    expect(audit).toContain('about 14,400 articles');
    expect(audit).toContain('English definitions are ineligible for Kazakh monolingual production definitions');
    expect(audit).toContain('Sozdik.kz and official/state dictionaries remain blocked');
  });
});

function words(input: string) {
  return getMorphologyCandidates('kk', input).map((candidate) => candidate.word);
}
