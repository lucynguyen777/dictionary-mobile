export type CorpusProbeKind = 'headword' | 'inflected';

export type CorpusProbeResult = {
  hasAttribution: boolean;
  hasExamples: boolean;
  hasRelatedWords: boolean;
  kind: CorpusProbeKind;
  query: string;
  resolved: boolean;
};

export type CorpusMeasurementReport = {
  attributedEntries: number;
  exampleCoveragePercent: number;
  exactLookupPassPercent: number;
  languageCode: string;
  measuredAt: string;
  morphologyPassPercent: number;
  relatedWordsCoveragePercent: number;
  representativeHeadwords: number;
  sourceLicense: string;
  sourceUrl: string;
};

export function calculateCorpusMeasurement(
  languageCode: string,
  probes: CorpusProbeResult[],
  source: Pick<CorpusMeasurementReport, 'measuredAt' | 'sourceLicense' | 'sourceUrl'>,
): CorpusMeasurementReport {
  const resolved = probes.filter((probe) => probe.resolved);
  const inflected = probes.filter((probe) => probe.kind === 'inflected');

  return {
    attributedEntries: resolved.filter((probe) => probe.hasAttribution).length,
    exampleCoveragePercent: percent(resolved.filter((probe) => probe.hasExamples).length, resolved.length),
    exactLookupPassPercent: percent(resolved.length, probes.length),
    languageCode,
    measuredAt: source.measuredAt,
    morphologyPassPercent: percent(inflected.filter((probe) => probe.resolved).length, inflected.length),
    relatedWordsCoveragePercent: percent(resolved.filter((probe) => probe.hasRelatedWords).length, resolved.length),
    representativeHeadwords: probes.length,
    sourceLicense: source.sourceLicense,
    sourceUrl: source.sourceUrl,
  };
}

function percent(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
