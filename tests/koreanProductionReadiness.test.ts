import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Korean production readiness', () => {
  it('resolves bounded contracted forms and inflected related words', async () => {
    expect(words('먹었어요')).toContain('먹다');
    expect(words('먹을')).toContain('먹다');
    expect(words('사랑으로')).toContain('사랑');

    await expect(fetchMonolingualMeaning('먹었어요', 'ko')).resolves.toMatchObject({ word: '먹다' });

    const verbRelations = await fetchRelatedWords('먹었어요', 'ko');
    expect(verbRelations.synonyms).toContain('섭취하다');

    const nounRelations = await fetchRelatedWords('사랑으로', 'ko');
    expect(nounRelations.antonyms).toContain('미움');
  });

  it('records native-source pronunciation and fallback boundaries', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/korean-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable native-definition raw-dump source');
    expect(audit).toContain('English definitions are ineligible for Korean monolingual production definitions');
    expect(audit).toContain('does not provide a broad conjugation table');
    expect(audit).toContain('NIKL remains a separate possible source');
    expect(audit).toContain('Kept broad irregular-conjugation generation');
  });
});

function words(input: string) {
  return getMorphologyCandidates('ko', input).map((candidate) => candidate.word);
}
