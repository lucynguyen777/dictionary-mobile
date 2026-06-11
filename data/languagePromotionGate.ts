export type LanguagePromotionMeasurement = {
  attributedEntries: number;
  exampleCoveragePercent: number;
  exactLookupPassPercent: number;
  languageCode: string;
  missingResultPass: boolean;
  morphologyPassPercent: number;
  offlinePackEntryCount: number;
  offlinePackSmokePassed: boolean;
  relatedWordsCoveragePercent: number;
  representativeHeadwords: number;
  uiSmokePassed: boolean;
};

export type LanguagePromotionCandidate = {
  active: boolean;
  languageCode: string;
  label: string;
  measurement: LanguagePromotionMeasurement;
  sourceDateRecorded: boolean;
  sourceLicenseRecorded: boolean;
};

export const LANGUAGE_PROMOTION_THRESHOLDS = {
  attributedEntries: 5_000,
  exampleCoveragePercent: 40,
  exactLookupPassPercent: 95,
  morphologyPassPercent: 85,
  offlinePackEntryCount: 5_000,
  relatedWordsCoveragePercent: 30,
  representativeHeadwords: 100,
} as const;

export const frenchPromotionMeasurement: LanguagePromotionMeasurement = {
  attributedEntries: 92,
  exampleCoveragePercent: 100,
  exactLookupPassPercent: 92,
  languageCode: 'fr',
  missingResultPass: true,
  morphologyPassPercent: 85,
  offlinePackEntryCount: 0,
  offlinePackSmokePassed: false,
  relatedWordsCoveragePercent: 0,
  representativeHeadwords: 100,
  uiSmokePassed: true,
};

export const languagePromotionCandidates: LanguagePromotionCandidate[] = [
  {
    active: true,
    label: 'French monolingual',
    languageCode: 'fr',
    measurement: frenchPromotionMeasurement,
    sourceDateRecorded: false,
    sourceLicenseRecorded: true,
  },
];

export function getActiveLanguagePromotionCandidate(candidates = languagePromotionCandidates) {
  const activeCandidates = candidates.filter((candidate) => candidate.active);

  if (activeCandidates.length > 1) {
    throw new Error('Only one language promotion candidate may be active at a time.');
  }

  return activeCandidates[0] ?? null;
}

export function evaluateLanguagePromotion(
  measurement: LanguagePromotionMeasurement,
  sourceEvidence: Pick<LanguagePromotionCandidate, 'sourceDateRecorded' | 'sourceLicenseRecorded'> = {
    sourceDateRecorded: true,
    sourceLicenseRecorded: true,
  },
) {
  const blockers = [
    !sourceEvidence.sourceLicenseRecorded && 'source-license',
    !sourceEvidence.sourceDateRecorded && 'source-date',
    measurement.representativeHeadwords < LANGUAGE_PROMOTION_THRESHOLDS.representativeHeadwords && 'representative-headwords',
    measurement.attributedEntries < LANGUAGE_PROMOTION_THRESHOLDS.attributedEntries && 'attributed-corpus-size',
    measurement.exactLookupPassPercent < LANGUAGE_PROMOTION_THRESHOLDS.exactLookupPassPercent && 'exact-lookup',
    measurement.morphologyPassPercent < LANGUAGE_PROMOTION_THRESHOLDS.morphologyPassPercent && 'morphology',
    measurement.exampleCoveragePercent < LANGUAGE_PROMOTION_THRESHOLDS.exampleCoveragePercent && 'examples',
    measurement.relatedWordsCoveragePercent < LANGUAGE_PROMOTION_THRESHOLDS.relatedWordsCoveragePercent && 'related-words',
    !measurement.missingResultPass && 'missing-result',
    measurement.offlinePackEntryCount < LANGUAGE_PROMOTION_THRESHOLDS.offlinePackEntryCount && 'offline-pack-size',
    !measurement.offlinePackSmokePassed && 'offline-pack-smoke',
    !measurement.uiSmokePassed && 'ui-smoke',
  ].filter((value): value is string => Boolean(value));

  return {
    blockers,
    canPromote: blockers.length === 0,
    state: blockers.length === 0 ? 'production-parity' as const : 'measured-preview' as const,
  };
}
