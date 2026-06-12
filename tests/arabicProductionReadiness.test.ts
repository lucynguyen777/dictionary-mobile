import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Arabic production readiness', () => {
  it('preserves exact lookup first and resolves vocalized/prefixed fixture forms', async () => {
    expect(words('كِتَابٌ')).toContain('كتاب');
    expect(words('وَبِالْكِتَابِ')).toContain('كتاب');
    expect(words('بِالْكُتُبِ')).toContain('كتاب');

    await expect(fetchMonolingualMeaning('كِتَابٌ', 'ar')).resolves.toMatchObject({ word: 'كتاب' });
    await expect(fetchMonolingualMeaning('وَبِالْكِتَابِ', 'ar')).resolves.toMatchObject({ word: 'كتاب' });
    await expect(fetchMonolingualMeaning('بِالْكُتُبِ', 'ar')).resolves.toMatchObject({ word: 'كتاب' });

    const relations = await fetchRelatedWords('وَبِالْكِتَابِ', 'ar');
    expect(relations.synonyms).toContain('مجلد');
  });

  it('records native-source constraints without enabling root guessing', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/arabic-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable but corpus-size-constrained native-source candidate');
    expect(audit).toContain('about 71,600 articles');
    expect(audit).toContain('English definitions are ineligible for Arabic monolingual production definitions');
    expect(audit).toContain('Kept root-pattern extraction out of local fallback');
  });
});

function words(input: string) {
  return getMorphologyCandidates('ar', input).map((candidate) => candidate.word);
}
