import { describe, expect, it } from 'vitest';

import {
  evaluateLanguagePromotion,
  frenchPromotionMeasurement,
  getActiveLanguagePromotionCandidate,
  languagePromotionCandidates,
  LANGUAGE_PROMOTION_THRESHOLDS,
} from '../data/languagePromotionGate';

describe('one-language promotion gate', () => {
  it('keeps French preview until measured corpus and offline pack gates pass', () => {
    const candidate = getActiveLanguagePromotionCandidate();
    const result = evaluateLanguagePromotion(frenchPromotionMeasurement, candidate!);

    expect(candidate?.languageCode).toBe('fr');
    expect(result.state).toBe('measured-preview');
    expect(result.blockers).toContain('source-date');
    expect(result.blockers).toContain('attributed-corpus-size');
    expect(result.blockers).toContain('offline-pack-smoke');
  });

  it('allows only one active promotion candidate', () => {
    expect(languagePromotionCandidates.filter((candidate) => candidate.active)).toHaveLength(1);
    expect(() => getActiveLanguagePromotionCandidate([
      ...languagePromotionCandidates,
      { ...languagePromotionCandidates[0], languageCode: 'ms' },
    ])).toThrow('Only one language promotion candidate may be active at a time.');
  });

  it('promotes only when every measured gate passes', () => {
    expect(evaluateLanguagePromotion({
      attributedEntries: LANGUAGE_PROMOTION_THRESHOLDS.attributedEntries,
      exampleCoveragePercent: LANGUAGE_PROMOTION_THRESHOLDS.exampleCoveragePercent,
      exactLookupPassPercent: LANGUAGE_PROMOTION_THRESHOLDS.exactLookupPassPercent,
      languageCode: 'fr',
      missingResultPass: true,
      morphologyPassPercent: LANGUAGE_PROMOTION_THRESHOLDS.morphologyPassPercent,
      offlinePackEntryCount: LANGUAGE_PROMOTION_THRESHOLDS.offlinePackEntryCount,
      offlinePackSmokePassed: true,
      relatedWordsCoveragePercent: LANGUAGE_PROMOTION_THRESHOLDS.relatedWordsCoveragePercent,
      representativeHeadwords: LANGUAGE_PROMOTION_THRESHOLDS.representativeHeadwords,
      uiSmokePassed: true,
    })).toEqual({ blockers: [], canPromote: true, state: 'production-parity' });
  });
});
