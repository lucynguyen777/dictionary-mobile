import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Zulu production readiness', () => {
  it('removes dictionary tone marks without changing noun-class or locative behavior', async () => {
    expect(words('umúntu')).toContain('umuntu');
    expect(words('īnja')).toContain('inja');
    expect(words('abántu')).toContain('abantu');

    await expect(fetchMonolingualMeaning('umúntu', 'zu')).resolves.toMatchObject({ word: 'umuntu' });
    await expect(fetchMonolingualMeaning('īnja', 'zu')).resolves.toMatchObject({ word: 'inja' });
    await expect(fetchMonolingualMeaning('abántu', 'zu')).resolves.toMatchObject({ word: 'umuntu' });
    await expect(fetchMonolingualMeaning('esiZulwini', 'zu')).resolves.toMatchObject({ word: 'isiZulu' });
  });

  it('records the measured corpus blocker without accepting English-definition data', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/zulu-production-source-audit.md'), 'utf8');

    expect(audit).toContain('production promotion corpus-blocked');
    expect(audit).toContain('about 1,242 articles');
    expect(audit).toContain('ineligible for Zulu monolingual production packaging');
  });
});

function words(input: string) {
  return getMorphologyCandidates('zu', input).map((candidate) => candidate.word);
}
