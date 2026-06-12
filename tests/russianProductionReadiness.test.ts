import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Russian production readiness', () => {
  it('normalizes stress/case and resolves relations from inflected fixture forms', async () => {
    expect(words('КНИ́ГАМИ')).toContain('книга');
    expect(words('СОБА́КЕ')).toContain('собака');

    await expect(fetchMonolingualMeaning('КНИ́ГАМИ', 'ru')).resolves.toMatchObject({ word: 'книга' });
    await expect(fetchMonolingualMeaning('СОБА́КЕ', 'ru')).resolves.toMatchObject({ word: 'собака' });

    const bookRelations = await fetchRelatedWords('КНИ́ГАМИ', 'ru');
    expect(bookRelations.synonyms).toContain('издание');

    const readingRelations = await fetchRelatedWords('ЧИТА́ЕТ', 'ru');
    expect(readingRelations.synonyms).toContain('просматривать');
  });

  it('records the native-source candidate without promoting English-definition data', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/russian-production-source-audit.md'), 'utf8');

    expect(audit).toContain('strong native-source candidate');
    expect(audit).toContain('more than 1,500,000 articles');
    expect(audit).toContain('English definitions are ineligible for Russian monolingual production definitions');
  });
});

function words(input: string) {
  return getMorphologyCandidates('ru', input).map((candidate) => candidate.word);
}
