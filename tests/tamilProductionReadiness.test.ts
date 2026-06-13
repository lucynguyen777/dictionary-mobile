import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Tamil production readiness', () => {
  it('resolves verified inflected meanings and related words', async () => {
    expect(words('புத்தகங்கள்')).toContain('புத்தகம்');
    expect(words('பூனைக்கு')).toContain('பூனை');

    await expect(fetchMonolingualMeaning('புத்தகங்களில்', 'ta')).resolves.toMatchObject({ word: 'புத்தகம்' });

    const bookRelations = await fetchRelatedWords('புத்தகங்கள்', 'ta');
    expect(bookRelations.synonyms).toContain('நூல்');

    const catRelations = await fetchRelatedWords('பூனைக்கு', 'ta');
    expect(catRelations.synonyms).toContain('மஞ்சரி');
  });

  it('records native-section and sandhi boundaries', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/tamil-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable but parser-sensitive native-edition source');
    expect(audit).toContain('cannot be treated as Tamil lemma coverage');
    expect(audit).toContain('English definitions are ineligible for Tamil monolingual production definitions');
    expect(audit).toContain('Kept broad sandhi reversal');
  });
});

function words(input: string) {
  return getMorphologyCandidates('ta', input).map((candidate) => candidate.word);
}
