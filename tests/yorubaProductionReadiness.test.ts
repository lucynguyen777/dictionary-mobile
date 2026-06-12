import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { normalizeYorubaWord } from '../data/localLexicon';
import { getMorphologyCandidates } from '../data/morphology';

describe('Yoruba production readiness', () => {
  it('removes tone marks including macrons while preserving lexical underdots', async () => {
    expect(normalizeYorubaWord('īlé')).toBe('ile');
    expect(normalizeYorubaWord('ōlógbò')).toBe('ologbo');
    expect(normalizeYorubaWord('ọmọ')).toBe('ọmọ');
    expect(normalizeYorubaWord('ṣé')).toBe('ṣe');

    expect(words('īlé')).toContain('ile');
    await expect(fetchMonolingualMeaning('īlé', 'yo')).resolves.toMatchObject({ word: 'ilé' });
    await expect(fetchMonolingualMeaning('ōlógbò', 'yo')).resolves.toMatchObject({ word: 'ológbò' });
  });

  it('records the production source blocker without accepting English-definition data', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/yoruba-production-source-audit.md'), 'utf8');

    expect(audit).toContain('production promotion source-blocked');
    expect(audit).toContain('ineligible for Yoruba monolingual production packaging');
    expect(audit).toContain('zero articles');
  });
});

function words(input: string) {
  return getMorphologyCandidates('yo', input).map((candidate) => candidate.word);
}
