import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Hindi production readiness', () => {
  it('resolves verified postposition and fixture-backed future/polite forms', async () => {
    expect(words('किताबों में')).toContain('किताब');
    expect(words('घरों से')).toContain('घर');
    expect(words('करूँगा')).toContain('करना');
    expect(words('करेंगे')).toContain('करना');
    expect(words('कीजिए')).toContain('करना');

    await expect(fetchMonolingualMeaning('किताबों में', 'hi')).resolves.toMatchObject({ word: 'किताब' });
    await expect(fetchMonolingualMeaning('करूँगा', 'hi')).resolves.toMatchObject({ word: 'करना' });
    await expect(fetchMonolingualMeaning('कीजिए', 'hi')).resolves.toMatchObject({ word: 'करना' });

    const relations = await fetchRelatedWords('घरों से', 'hi');
    expect(relations.synonyms).toContain('मकान');
  });

  it('records native-source viability without enabling transliteration or English definitions', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/hindi-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable native-source candidate');
    expect(audit).toContain('about 185,000 articles');
    expect(audit).toContain('English definitions are ineligible for Hindi monolingual production definitions');
    expect(audit).toContain('Kept Latin transliteration out of canonical lookup');
  });
});

function words(input: string) {
  return getMorphologyCandidates('hi', input).map((candidate) => candidate.word);
}
