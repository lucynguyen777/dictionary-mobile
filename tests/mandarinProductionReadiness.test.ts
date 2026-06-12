import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Mandarin production readiness', () => {
  it('creates directional script variants and resolves traditional related words', async () => {
    expect(words('讀书')).toEqual(expect.arrayContaining(['读书', '讀書']));
    expect(words('書')).toContain('书');
    expect(words('书')).toContain('書');

    await expect(fetchMonolingualMeaning('書', 'zh')).resolves.toMatchObject({ word: '书' });

    const relations = await fetchRelatedWords('讀', 'zh');
    expect(relations.synonyms).toContain('阅读');
    expect(relations.antonyms).toContain('写');
  });

  it('records native-source filtering and mapping boundaries', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/mandarin-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable large native-definition extraction source');
    expect(audit).toContain('more than 2.3 million entries');
    expect(audit).toContain('English definitions are ineligible for Mandarin monolingual production definitions');
    expect(audit).toContain('selects the Chinese-language section');
    expect(audit).toContain('local character map deliberately bounded');
  });
});

function words(input: string) {
  return getMorphologyCandidates('zh', input).map((candidate) => candidate.word);
}
