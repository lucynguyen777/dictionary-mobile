import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { normalizeIgboWord } from '../data/localLexicon';
import { getMorphologyCandidates } from '../data/morphology';

describe('Igbo production readiness', () => {
  it('normalizes canonical tone forms while preserving Ọnwụ letters', async () => {
    expect(normalizeIgboWord('Ụ́LỌ̀')).toBe('ụlọ');
    expect(normalizeIgboWord('ụ̄lọ')).toBe('ụlọ');
    expect(normalizeIgboWord('ṅ')).toBe('ṅ');
    expect(normalizeIgboWord('ọ')).not.toBe(normalizeIgboWord('o'));
    expect(normalizeIgboWord('ụ')).not.toBe(normalizeIgboWord('u'));

    expect(words('ụ̄lọ')).toContain('ụlọ');
    await expect(fetchMonolingualMeaning('ụ̄lọ', 'ig')).resolves.toMatchObject({ word: 'ụlọ' });
    await expect(fetchMonolingualMeaning('ulo', 'ig')).rejects.toThrow('No Igbo local fixture meanings');
  });

  it('records the production source blocker and non-production fixture boundary', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/igbo-production-source-audit.md'), 'utf8');

    expect(audit).toContain('production promotion source-blocked');
    expect(audit).toContain('about 640 articles');
    expect(audit).toContain('local educational fixtures explicitly non-production');
  });
});

function words(input: string) {
  return getMorphologyCandidates('ig', input).map((candidate) => candidate.word);
}
