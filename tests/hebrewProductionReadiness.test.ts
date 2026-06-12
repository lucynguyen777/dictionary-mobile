import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Hebrew production readiness', () => {
  it('preserves exact lookup first and resolves pointed/prefixed/plural fixture forms', async () => {
    expect(words('סֵפֶר')).toContain('ספר');
    expect(words('וּבַסֵּפֶר')).toContain('ספר');
    expect(words('הַסְּפָרִים')).toContain('ספר');

    await expect(fetchMonolingualMeaning('סֵפֶר', 'he')).resolves.toMatchObject({ word: 'ספר' });
    await expect(fetchMonolingualMeaning('וּבַסֵּפֶר', 'he')).resolves.toMatchObject({ word: 'ספר' });
    await expect(fetchMonolingualMeaning('הַסְּפָרִים', 'he')).resolves.toMatchObject({ word: 'ספר' });

    const relations = await fetchRelatedWords('וּבַסֵּפֶר', 'he');
    expect(relations.synonyms).toContain('חיבור');
  });

  it('records native-source constraints without enabling root guessing', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/hebrew-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable but corpus-size-constrained native-source candidate');
    expect(audit).toContain('about 25,100 articles');
    expect(audit).toContain('English definitions are ineligible for Hebrew monolingual production definitions');
    expect(audit).toContain('Kept shoresh/binyan extraction out of local fallback');
  });
});

function words(input: string) {
  return getMorphologyCandidates('he', input).map((candidate) => candidate.word);
}
