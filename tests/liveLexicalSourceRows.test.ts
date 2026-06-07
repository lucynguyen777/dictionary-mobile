import { describe, expect, it } from 'vitest';

import { extractWiktApiAttributedRows } from '../data/dictionaryApi';

describe('live attributed lexical source rows', () => {
  it('extracts etymology and forms with visible Wiktionary attribution', () => {
    const rows = extractWiktApiAttributedRows({
      entries: [{
        etymology_text: 'From Latin mānsiō.',
        forms: [{ form: 'maisons', tags: ['plural'] }],
      }],
    }, 'maison', 'fr');

    expect(rows.etymology).toMatchObject({
      text: 'From Latin mānsiō.',
      sourceUrl: 'https://fr.wiktionary.org/wiki/maison',
    });
    expect(rows.etymology?.attribution).toContain('CC-BY-SA-4.0/GFDL');
    expect(rows.forms?.[0]).toMatchObject({ features: ['plural'], form: 'maisons' });
    expect(rows.forms?.[0].attribution).toContain('fr Wiktionary');
  });

  it('returns no live rows when the source fields are missing', () => {
    const rows = extractWiktApiAttributedRows({ entries: [{ senses: [] }] }, 'maison', 'fr');

    expect(rows.etymology).toBeUndefined();
    expect(rows.forms).toEqual([]);
  });
});
