import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Spanish corpus promotion candidate', () => {
  it('keeps a balanced 100-probe sample with accents and irregular verbs', () => {
    const input = readFileSync(resolve(process.cwd(), 'data/headword-lists/spanish-promotion-100.txt'), 'utf8');
    const probes = input.split(/\r?\n/).filter((line) => line && !line.startsWith('#'));
    const inflected = probes.filter((line) => line.endsWith('|inflected'));

    expect(probes).toHaveLength(100);
    expect(inflected).toHaveLength(20);
    expect(probes).toEqual(expect.arrayContaining([
      'avión|noun|headword',
      'pequeña|adjective|inflected',
      'tengo|verb|inflected',
      'fueron|verb|inflected',
    ]));
  });

  it('documents the measured preview decision instead of promoting the candidate', () => {
    const report = readFileSync(resolve(process.cwd(), 'docs/spanish-100-headword-measurement.md'), 'utf8');

    expect(report).toContain('Live WiktAPI resolved 84/100 probes');
    expect(report).toContain('contained only 38/100 representative probes');
    expect(report).toContain('English definitions');
    expect(report).toContain('Spanish remains preview');
  });
});
