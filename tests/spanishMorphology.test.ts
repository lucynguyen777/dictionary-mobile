import { describe, expect, it } from 'vitest';

import { getMorphologyCandidates } from '../data/morphology';

describe('Spanish irregular morphology', () => {
  it('restores common irregular verb infinitives', () => {
    expect(words('tengo')).toContain('tener');
    expect(words('hace')).toContain('hacer');
    expect(words('voy')).toContain('ir');
    expect(words('viene')).toContain('venir');
    expect(words('fueron')).toEqual(expect.arrayContaining(['ir', 'ser']));
  });

  it('does not globally strip meaningful accents', () => {
    expect(words('sí')).not.toContain('si');
    expect(words('él')).not.toContain('el');
  });
});

function words(input: string) {
  return getMorphologyCandidates('es', input).map((candidate) => candidate.word);
}
