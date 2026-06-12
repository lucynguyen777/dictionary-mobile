import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Turkish production readiness', () => {
  it('normalizes Turkish Unicode and resolves verified plural-plus-case forms', async () => {
    expect(words('evlerde')).toContain('ev');
    expect(words('evlerden')).toContain('ev');
    expect(words('ıs\u0327ıklarda')).toContain('ışık');
    expect(words("I\u0307stanbul'da")).toContain('İstanbul');
    expect(words('isiklarda')).not.toContain('ışık');

    await expect(fetchMonolingualMeaning('evlerde', 'tr')).resolves.toMatchObject({ word: 'ev' });
    await expect(fetchMonolingualMeaning('evlerden', 'tr')).resolves.toMatchObject({ word: 'ev' });
    await expect(fetchMonolingualMeaning('ıs\u0327ıklarda', 'tr')).resolves.toMatchObject({ word: 'ışık' });
    await expect(fetchMonolingualMeaning("I\u0307stanbul'da", 'tr')).resolves.toMatchObject({ word: 'İstanbul' });
  });

  it('records the native-source candidate without promoting English-definition data', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/turkish-production-source-audit.md'), 'utf8');

    expect(audit).toContain('strong native-source candidate');
    expect(audit).toContain('more than 1,350,000 articles');
    expect(audit).toContain('ineligible for Turkish monolingual production definitions');
  });
});

function words(input: string) {
  return getMorphologyCandidates('tr', input).map((candidate) => candidate.word);
}
