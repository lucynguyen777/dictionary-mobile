import { describe, expect, it } from 'vitest';

import { getBilingualCoverageInventoryRows, getFutureSourceGateRows } from '../data/languageCoverageInventory';
import { getHelperSourceGate, LANGUAGE_PRODUCTION_SHARED_GATES, languageProductionRoadmap } from '../data/languageProductionRoadmap';
import { languageOptions } from '../data/languages';

describe('language production roadmap', () => {
  it('covers every registered language, bilingual pair, and future source gate exactly once', () => {
    const expected = [
      ...languageOptions.map((language) => language.code),
      ...getBilingualCoverageInventoryRows().map((row) => row.pair),
      ...getFutureSourceGateRows().map((row) => row.code),
    ];
    const actual = languageProductionRoadmap.map((target) => target.code);

    expect(new Set(actual).size).toBe(actual.length);
    expect(actual.sort()).toEqual(expected.sort());
  });

  it('orders preview promotions before source-gated work and keeps one-language gates explicit', () => {
    const previewBatches = languageProductionRoadmap.filter((target) => target.state === 'preview-promotion').map((target) => target.batch);
    const sourceGateBatches = languageProductionRoadmap.filter((target) => target.state === 'source-gated').map((target) => target.batch);

    expect(Math.max(...previewBatches)).toBeLessThan(Math.min(...sourceGateBatches));
    expect(languageProductionRoadmap.filter((target) => target.batch === 1).map((target) => target.code)).toEqual(['fr', 'ms', 'es']);
    expect(LANGUAGE_PRODUCTION_SHARED_GATES).toEqual(expect.arrayContaining([
      'representative-100-headword-measurement',
      'attributed-corpus-minimum-5000',
      'offline-pack-import-delete-lookup-smoke',
    ]));
  });

  it('moves VI->FR from source-gated to an approved source with pack hosting still pending (D13)', () => {
    const viFr = languageProductionRoadmap.find((target) => target.code === 'vi->fr');
    expect(viFr).toMatchObject({ state: 'preview-promotion' });
    expect(viFr?.sourcePlan).toContain('D13');
    expect(viFr?.sourcePlan).toContain('pack host (D9) and UI smoke pending');
    expect(viFr?.specialWork).toContain('never substitute machine translation');
    expect(getHelperSourceGate('vi->fr', 'related-words')).toMatchObject({ passesNatively: false, passesWithHelper: true });
    expect(getHelperSourceGate('vi->fr', 'examples')).toBeNull();
  });
});
