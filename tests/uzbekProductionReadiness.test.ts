import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Uzbek production readiness', () => {
  it('connects Cyrillic transliteration to suffix analysis and normalizes apostrophe variants', async () => {
    expect(words('китобларда')).toContain('kitob');
    expect(words('китоблардан')).toContain('kitob');
    expect(words('қилдим')).toContain('qilmoq');
    expect(words('oʼzbeklar')).toContain('oʻzbek');
    expect(words('oꞌzbeklar')).toContain('oʻzbek');

    await expect(fetchMonolingualMeaning('китобларда', 'uz')).resolves.toMatchObject({ word: 'kitob' });
    await expect(fetchMonolingualMeaning('китоблардан', 'uz')).resolves.toMatchObject({ word: 'kitob' });
    await expect(fetchMonolingualMeaning('қилдим', 'uz')).resolves.toMatchObject({ word: 'qilmoq' });
    await expect(fetchMonolingualMeaning('oʼzbeklar', 'uz')).resolves.toMatchObject({ word: 'oʻzbek' });
  });

  it('records native-source viability without promoting gated sources', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/uzbek-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable native-source candidate');
    expect(audit).toContain('more than 119,000 articles');
    expect(audit).toContain('Izoh.uz remains a promising larger explanatory-dictionary candidate');
    expect(audit).toContain('English definitions are ineligible for Uzbek monolingual production definitions');
  });
});

function words(input: string) {
  return getMorphologyCandidates('uz', input).map((candidate) => candidate.word);
}
