import { describe, expect, it } from 'vitest';

import { getMorphologyCandidates } from '../data/morphology';

describe('Malay meN-/peN- morphology', () => {
  it('restores conservative roots for common allomorphs', () => {
    expect(words('mengambil')).toContain('ambil');
    expect(words('membaca')).toContain('baca');
    expect(words('menulis')).toContain('tulis');
    expect(words('mencari')).toContain('cari');
    expect(words('menyapu')).toContain('sapu');
  });

  it('restores conservative peN- agent roots', () => {
    expect(words('pengajar')).toContain('ajar');
    expect(words('pembaca')).toContain('baca');
    expect(words('penulis')).toContain('tulis');
    expect(words('pencari')).toContain('cari');
  });
});

function words(input: string) {
  return getMorphologyCandidates('ms', input).map((candidate) => candidate.word);
}
