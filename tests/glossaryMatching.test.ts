import { describe, expect, it } from 'vitest';

import { findGlossaryMatches, parseGlossaryText, selectAppliedGlossaryTerms } from '../data/glossaryMatching';

const medical = [
  { sourceTerm: 'CT', targetTerm: 'chụp cắt lớp' },
  { sourceTerm: 'CT scan', targetTerm: 'chụp cắt lớp vi tính' },
  { sourceTerm: 'MRI', targetTerm: 'cộng hưởng từ' },
];

describe('findGlossaryMatches', () => {
  it('prefers the longest term and never overlaps', () => {
    expect(findGlossaryMatches('A CT scan, then an MRI.', medical).map((match) => match.sourceTerm)).toEqual(['CT scan', 'MRI']);
  });

  it('respects word boundaries in spaced scripts', () => {
    expect(findGlossaryMatches('The act of CTRL-clicking', medical)).toEqual([]);
    expect(findGlossaryMatches('mri, CT.', medical).map((match) => [match.start, match.end])).toEqual([[0, 3], [5, 7]]);
  });

  it('matches inside unspaced scripts and non-Latin words with marks', () => {
    expect(findGlossaryMatches('患者は磁気共鳴画像を受けた', [{ sourceTerm: '磁気共鳴画像', targetTerm: 'MRI' }])).toHaveLength(1);
    expect(findGlossaryMatches('Bệnh nhân chụp cộng hưởng từ', [{ sourceTerm: 'cộng hưởng', targetTerm: 'resonance' }])).toHaveLength(1);
    expect(findGlossaryMatches('chụpcộng', [{ sourceTerm: 'cộng', targetTerm: 'x' }])).toEqual([]);
  });
});

describe('selectAppliedGlossaryTerms', () => {
  it('lists each occurring term once, in order of appearance', () => {
    expect(selectAppliedGlossaryTerms('MRI first, CT later, MRI again', medical)).toEqual([
      { sourceTerm: 'MRI', targetTerm: 'cộng hưởng từ' },
      { sourceTerm: 'CT', targetTerm: 'chụp cắt lớp' },
    ]);
  });

  it('caps the number of terms sent to the provider', () => {
    const terms = Array.from({ length: 5 }, (_, index) => ({ sourceTerm: `term${index}`, targetTerm: `t${index}` }));
    expect(selectAppliedGlossaryTerms('term0 term1 term2 term3 term4', terms, 3)).toHaveLength(3);
  });
});

describe('parseGlossaryText', () => {
  it('reads arrows and tab-separated rows, skipping comments and duplicates', () => {
    expect(parseGlossaryText('# medical\nMRI → cộng hưởng từ\nCT scan -> chụp cắt lớp\nECG\tđiện tâm đồ\nmri → trùng')).toEqual({
      invalidLines: [],
      terms: [
        { sourceTerm: 'MRI', targetTerm: 'cộng hưởng từ' },
        { sourceTerm: 'CT scan', targetTerm: 'chụp cắt lớp' },
        { sourceTerm: 'ECG', targetTerm: 'điện tâm đồ' },
      ],
    });
  });

  it('reports lines it cannot read instead of guessing', () => {
    expect(parseGlossaryText('MRI\nA → B → C\n → x\nok → fine').invalidLines).toEqual([1, 2, 3]);
  });
});
