import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { calculateCorpusMeasurement } from '../data/languageCorpusMeasurement';
import { evaluateLanguagePromotion, frenchPromotionMeasurement, getActiveLanguagePromotionCandidate } from '../data/languagePromotionGate';

describe('language corpus measurement', () => {
  it('calculates bounded coverage without attributing unresolved probes', () => {
    expect(calculateCorpusMeasurement('fr', [
      { hasAttribution: true, hasExamples: true, hasRelatedWords: false, kind: 'headword', query: 'maison', resolved: true },
      { hasAttribution: true, hasExamples: false, hasRelatedWords: true, kind: 'inflected', query: 'maisons', resolved: true },
      { hasAttribution: false, hasExamples: false, hasRelatedWords: false, kind: 'inflected', query: 'missing', resolved: false },
    ], {
      measuredAt: '2026-06-11T00:00:00.000Z',
      sourceLicense: 'CC BY-SA/GFDL',
      sourceUrl: 'https://example.test/{word}',
    })).toMatchObject({
      attributedEntries: 2,
      exampleCoveragePercent: 50,
      exactLookupPassPercent: 67,
      morphologyPassPercent: 50,
      relatedWordsCoveragePercent: 50,
      representativeHeadwords: 3,
    });
  });

  it('freezes exactly 100 French probes and keeps French measured preview', () => {
    const input = readFileSync(resolve(process.cwd(), 'data/headword-lists/french-promotion-100.txt'), 'utf8');
    const probes = input.split(/\r?\n/).filter((line) => line && !line.startsWith('#'));
    const result = evaluateLanguagePromotion(frenchPromotionMeasurement, getActiveLanguagePromotionCandidate()!);

    expect(probes).toHaveLength(100);
    expect(probes.filter((line) => line.endsWith('|inflected'))).toHaveLength(20);
    expect(frenchPromotionMeasurement).toMatchObject({
      attributedEntries: 5_000,
      exactLookupPassPercent: 92,
      morphologyPassPercent: 85,
      relatedWordsCoveragePercent: 0,
      representativeHeadwords: 100,
    });
    expect(result.state).toBe('measured-preview');
    expect(result.blockers).toEqual(expect.arrayContaining([
      'exact-lookup', 'related-words', 'offline-pack-smoke',
    ]));
  });
});
