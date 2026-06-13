import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Telugu production readiness', () => {
  it('resolves verified inflected meanings and related words', async () => {
    expect(words('పుస్తకాలు')).toContain('పుస్తకము');
    expect(words('పిల్లికి')).toContain('పిల్లి');
    expect(words('ఇంటిలో')).toContain('ఇల్లు');

    await expect(fetchMonolingualMeaning('పుస్తకాలలో', 'te')).resolves.toMatchObject({ word: 'పుస్తకము' });

    const catRelations = await fetchRelatedWords('పిల్లికి', 'te');
    expect(catRelations.synonyms).toContain('మార్జాలము');

    const houseRelations = await fetchRelatedWords('ఇంటిలో', 'te');
    expect(houseRelations.synonyms).toContain('గృహము');
  });

  it('records native-section and suffix-chain boundaries', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/telugu-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable but parser-sensitive native-edition source');
    expect(audit).toContain('cannot be treated as Telugu lemma coverage');
    expect(audit).toContain('English definitions are ineligible for Telugu monolingual production definitions');
    expect(audit).toContain('Kept broad sandhi reversal');
  });
});

function words(input: string) {
  return getMorphologyCandidates('te', input).map((candidate) => candidate.word);
}
