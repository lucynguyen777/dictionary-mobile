import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning } from '../data/dictionaryApi';
import { getMorphologyCandidates } from '../data/morphology';

describe('Estonian production readiness', () => {
  it('normalizes Estonian Unicode and resolves conservative cases without ASCII folding', async () => {
    expect(words('ja\u0308a\u0308le')).toContain('jää');
    expect(words('jäält')).toContain('jää');
    expect(words('jääni')).toContain('jää');
    expect(words('o\u0308o\u0308ga')).toContain('öö');
    expect(words('ööni')).toContain('öö');

    await expect(fetchMonolingualMeaning('ja\u0308a\u0308le', 'et')).resolves.toMatchObject({ word: 'jää' });
    await expect(fetchMonolingualMeaning('o\u0308o\u0308ga', 'et')).resolves.toMatchObject({ word: 'öö' });
    await expect(fetchMonolingualMeaning('jaa', 'et')).rejects.toThrow('No Estonian Wiktionary meanings');
  });

  it('records the native-source candidate and optional official-source path', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/estonian-production-source-audit.md'), 'utf8');

    expect(audit).toContain('strong native-source candidate');
    expect(audit).toContain('more than 164,000 articles');
    expect(audit).toContain('Ekilex/Sõnaveeb remains a promising CC BY 4.0 official-source option');
  });
});

function words(input: string) {
  return getMorphologyCandidates('et', input).map((candidate) => candidate.word);
}
