import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Malay corpus promotion candidate', () => {
  it('keeps a balanced 100-probe sample with explicit complex morphology coverage', () => {
    const input = readFileSync(resolve(process.cwd(), 'data/headword-lists/malay-promotion-100.txt'), 'utf8');
    const probes = input.split(/\r?\n/).filter((line) => line && !line.startsWith('#'));
    const inflected = probes.filter((line) => line.endsWith('|inflected'));

    expect(probes).toHaveLength(100);
    expect(inflected).toHaveLength(20);
    expect(inflected).toEqual(expect.arrayContaining([
      'buku-buku|noun|inflected',
      'mengambil|verb|inflected',
      'membaca|verb|inflected',
      'pengajar|noun|inflected',
    ]));
  });
});
