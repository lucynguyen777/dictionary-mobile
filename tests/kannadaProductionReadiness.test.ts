import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Kannada production readiness', () => {
  it('resolves verified inflected meanings and related words', async () => {
    expect(words('ಪುಸ್ತಕಗಳು')).toContain('ಪುಸ್ತಕ');
    expect(words('ಪುಸ್ತಕಗಳಲ್ಲಿ')).toContain('ಪುಸ್ತಕ');
    expect(words('ಮನೆಯಲ್ಲಿ')).toContain('ಮನೆ');

    await expect(fetchMonolingualMeaning('ಪುಸ್ತಕಗಳಲ್ಲಿ', 'kn')).resolves.toMatchObject({ word: 'ಪುಸ್ತಕ' });

    const bookRelations = await fetchRelatedWords('ಪುಸ್ತಕಗಳಲ್ಲಿ', 'kn');
    expect(bookRelations.synonyms).toContain('ಗ್ರಂಥ');

    const houseRelations = await fetchRelatedWords('ಮನೆಯಲ್ಲಿ', 'kn');
    expect(houseRelations.synonyms).toContain('ಗೃಹ');
  });

  it('records native-section and glide/sandhi boundaries', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/kannada-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable but parser-sensitive native-edition source');
    expect(audit).toContain('cannot be treated as Kannada lemma coverage');
    expect(audit).toContain('English definitions are ineligible for Kannada monolingual production definitions');
    expect(audit).toContain('Kept broad glide/sandhi reversal');
  });
});

function words(input: string) {
  return getMorphologyCandidates('kn', input).map((candidate) => candidate.word);
}
