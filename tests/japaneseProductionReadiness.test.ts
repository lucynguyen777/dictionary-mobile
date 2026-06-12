import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Japanese production readiness', () => {
  it('resolves bounded verified ichidan forms and inflected related words', async () => {
    expect(words('食べました')).toContain('食べる');
    expect(words('食べません')).toContain('食べる');
    expect(words('たべれば')).toContain('たべる');

    await expect(fetchMonolingualMeaning('食べました', 'ja')).resolves.toMatchObject({ word: '食べる' });

    const relations = await fetchRelatedWords('食べた', 'ja');
    expect(relations.synonyms).toContain('食す');
  });

  it('records native-source form-of and fallback boundaries', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/japanese-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable native-definition raw-dump source');
    expect(audit).toContain('English definitions are ineligible for Japanese monolingual production definitions');
    expect(audit).toContain('form-of relationships');
    expect(audit).toContain('Kept broad godan conjugation expansion');
  });
});

function words(input: string) {
  return getMorphologyCandidates('ja', input).map((candidate) => candidate.word);
}
