import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Javanese production readiness', () => {
  it('routes verified Aksara Jawa fixture forms through the existing lookup flow', async () => {
    expect(words('ꦮꦕ')).toContain('waca');
    expect(words('ꦩꦕ')).toContain('waca');
    expect(words('ꦠꦸꦭꦶꦱ꧀')).toContain('tulis');
    expect(words('ꦠꦸꦏꦸ')).toContain('tuku');
    expect(words('ꦠꦸꦩ꧀ꦧꦱ꧀')).toContain('tumbas');

    await expect(fetchMonolingualMeaning('ꦠꦸꦏꦸ', 'jv')).resolves.toMatchObject({ word: 'tuku' });
    await expect(fetchMonolingualMeaning('ꦠꦸꦩ꧀ꦧꦱ꧀', 'jv')).resolves.toMatchObject({ word: 'tumbas' });
  });

  it('records the native-source candidate without promoting English-definition data', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/javanese-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable native-source candidate');
    expect(audit).toContain('ineligible for Javanese monolingual production packaging');
    expect(audit).toContain('does not yet have a Javanese Wiktionary template extractor');
  });
});

function words(input: string) {
  return getMorphologyCandidates('jv', input).map((candidate) => candidate.word);
}
