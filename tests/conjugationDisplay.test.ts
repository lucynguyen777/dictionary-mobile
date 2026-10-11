import { describe, expect, it } from 'vitest';

import { getLiveConjugation } from '../data/conjugationDisplay';

const source = { attribution: 'Source: fr Wiktionary via wiktapi.dev (CC-BY-SA-4.0/GFDL)', sourceName: 'fr Wiktionary via wiktapi.dev', sourceUrl: 'https://fr.wiktionary.org/wiki/aller' };

describe('live conjugation rows', () => {
  it('keeps real forms, drops Wiktextract bookkeeping rows and duplicates, and carries one attribution', () => {
    const result = getLiveConjugation([
      { ...source, features: ['table-tags'], form: 'fr-conj-3' },
      { ...source, features: ['inflection-template'], form: 'fr-conj' },
      { ...source, features: ['indicative', 'present', 'first-person', 'singular'], form: 'vais' },
      { ...source, features: ['indicative', 'present', 'first-person', 'singular'], form: 'vais' },
      { ...source, features: [], form: 'allé' },
    ]);
    expect(result).toEqual({
      attribution: source.attribution,
      rows: [
        { form: 'vais', tense: 'indicative · present · first-person · singular' },
        { form: 'allé', tense: 'Form' },
      ],
    });
  });

  it('is empty without usable forms', () => {
    expect(getLiveConjugation(undefined)).toBeNull();
    expect(getLiveConjugation([{ ...source, features: ['table-tags'], form: 'x' }])).toBeNull();
  });
});
