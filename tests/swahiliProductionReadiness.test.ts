import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Swahili production readiness', () => {
  it('resolves verified infinitive and common object-prefix chains', async () => {
    expect(words('kupenda')).toContain('penda');
    expect(words('ninakupenda')).toContain('penda');
    expect(words('ninampenda')).toContain('penda');
    expect(words('tunawapenda')).toContain('penda');

    await expect(fetchMonolingualMeaning('kupenda', 'sw')).resolves.toMatchObject({ word: 'penda' });
    await expect(fetchMonolingualMeaning('ninampenda', 'sw')).resolves.toMatchObject({ word: 'penda' });
  });

  it('records the native-source candidate without promoting English-definition data', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/swahili-production-source-audit.md'), 'utf8');

    expect(audit).toContain('strong native-source candidate');
    expect(audit).toContain('ineligible for Swahili monolingual production packaging');
    expect(audit).toContain('does not yet have a Swahili Wiktionary template extractor');
  });
});

function words(input: string) {
  return getMorphologyCandidates('sw', input).map((candidate) => candidate.word);
}
