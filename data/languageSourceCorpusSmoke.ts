export type SourceCorpusSmokeDecision = 'expand-corpus-first' | 'keep-production-pair-grow' | 'blocked';

export type SourceCorpusSmokeProbe = {
  query: string;
  source: string;
  status: 'pass' | 'partial' | 'fail';
  evidence: string;
};

export type SourceCorpusSmokeRow = {
  id: 'es' | 'ms' | 'fr' | 'fr->vi';
  label: string;
  scope: 'monolingual' | 'bilingual';
  currentState: 'monolingual-preview' | 'production-pair';
  sourceCandidate: string;
  licenseStatus: string;
  attributionLabel: string;
  examplesStatus: 'present' | 'partial' | 'unknown';
  relatedWordsStatus: 'present' | 'partial' | 'unknown';
  morphologyStatus: 'baseline' | 'not-applicable';
  offlinePackViability: 'needs-packaging-plan' | 'not-ready';
  decision: SourceCorpusSmokeDecision;
  blocker: string;
  nextAction: string;
  probes: SourceCorpusSmokeProbe[];
};

const smokeRows: SourceCorpusSmokeRow[] = [
  {
    attributionLabel: 'wiktapi.dev / Spanish Wiktionary',
    blocker: 'Hosted WiktAPI returns useful common entries, but sampled diacritic/adjective behavior is not reliable enough for production parity.',
    currentState: 'monolingual-preview',
    decision: 'expand-corpus-first',
    examplesStatus: 'partial',
    id: 'es',
    label: 'Spanish monolingual',
    licenseStatus: 'Wiktionary-derived data; preserve CC BY-SA/GFDL attribution before any offline packaging.',
    morphologyStatus: 'baseline',
    nextAction: 'Keep Spanish preview, add a larger source/dump coverage audit, then improve accent and irregular-verb fallback before production promotion.',
    offlinePackViability: 'needs-packaging-plan',
    probes: [
      {
        evidence: 'Direct WiktAPI lookup returned entries for a common noun.',
        query: 'casa',
        source: 'WiktAPI Spanish word endpoint',
        status: 'pass',
      },
      {
        evidence: 'Direct WiktAPI lookup returned entries for a common verb.',
        query: 'correr',
        source: 'WiktAPI Spanish word endpoint',
        status: 'pass',
      },
      {
        evidence: 'Direct WiktAPI lookup returned 404 for sampled feminine adjective form with and without n-tilde spelling.',
        query: 'pequeña / pequena',
        source: 'WiktAPI Spanish word endpoint',
        status: 'fail',
      },
    ],
    relatedWordsStatus: 'partial',
    scope: 'monolingual',
    sourceCandidate: 'Hosted WiktAPI over Spanish Wiktionary plus future dump/offline packaging path.',
  },
  {
    attributionLabel: 'wiktapi.dev / Malay Wiktionary',
    blocker: 'Common headwords work, but meN-/peN- allomorphs, larger corpus size, and offline packaging remain unproven.',
    currentState: 'monolingual-preview',
    decision: 'expand-corpus-first',
    examplesStatus: 'partial',
    id: 'ms',
    label: 'Malay monolingual',
    licenseStatus: 'Wiktionary-derived data; preserve CC BY-SA/GFDL attribution before any offline packaging.',
    morphologyStatus: 'baseline',
    nextAction: 'Keep Malay preview, audit more affixed forms, and choose a packaged corpus or stemmer strategy before production promotion.',
    offlinePackViability: 'needs-packaging-plan',
    probes: [
      {
        evidence: 'Direct WiktAPI lookup returned an entry for a common noun.',
        query: 'rumah',
        source: 'WiktAPI Malay word endpoint',
        status: 'pass',
      },
      {
        evidence: 'Direct WiktAPI lookup returned entries for a common verb/food word.',
        query: 'makan',
        source: 'WiktAPI Malay word endpoint',
        status: 'pass',
      },
      {
        evidence: 'Direct WiktAPI lookup returned an entry for a common adjective.',
        query: 'baik',
        source: 'WiktAPI Malay word endpoint',
        status: 'pass',
      },
    ],
    relatedWordsStatus: 'partial',
    scope: 'monolingual',
    sourceCandidate: 'Hosted WiktAPI over Malay Wiktionary plus future dump/offline packaging path.',
  },
  {
    attributionLabel: 'wiktapi.dev / French Wiktionary',
    blocker: 'French lookup is healthy for common words, but monolingual French still lacks a measured corpus/offline pack path and broader UI smoke.',
    currentState: 'monolingual-preview',
    decision: 'expand-corpus-first',
    examplesStatus: 'partial',
    id: 'fr',
    label: 'French monolingual',
    licenseStatus: 'Wiktionary-derived data; preserve CC BY-SA/GFDL attribution before any offline packaging.',
    morphologyStatus: 'baseline',
    nextAction: 'Keep French monolingual preview while measuring dump/API coverage and packaging an attributed offline corpus candidate.',
    offlinePackViability: 'needs-packaging-plan',
    probes: [
      {
        evidence: 'Direct WiktAPI lookup returned entries for a common noun.',
        query: 'maison',
        source: 'WiktAPI French word endpoint',
        status: 'pass',
      },
      {
        evidence: 'Direct WiktAPI lookup returned entries for a common noun.',
        query: 'livre',
        source: 'WiktAPI French word endpoint',
        status: 'pass',
      },
      {
        evidence: 'Direct WiktAPI lookup returned an entry for a common verb.',
        query: 'chercher',
        source: 'WiktAPI French word endpoint',
        status: 'pass',
      },
    ],
    relatedWordsStatus: 'partial',
    scope: 'monolingual',
    sourceCandidate: 'Hosted WiktAPI over French Wiktionary plus future dump/offline packaging path.',
  },
  {
    attributionLabel: 'dict.minhqnd.com French-Vietnamese lexical data',
    blocker: 'The pair is supported in-app, but coverage size, source metadata, and offline packaging are not yet measured enough for 100% readiness.',
    currentState: 'production-pair',
    decision: 'keep-production-pair-grow',
    examplesStatus: 'partial',
    id: 'fr->vi',
    label: 'French to Vietnamese bilingual',
    licenseStatus: 'Existing app-approved lexical API path; keep attribution and do not infer missing entries with machine translation.',
    morphologyStatus: 'not-applicable',
    nextAction: 'Keep FR->VI production-pair status, then measure more headwords and define a legal offline packaging path.',
    offlinePackViability: 'needs-packaging-plan',
    probes: [
      {
        evidence: 'MinhQnd lookup returned exists=true and a French result.',
        query: 'maison',
        source: 'MinhQnd lookup with def_lang=vi',
        status: 'pass',
      },
      {
        evidence: 'MinhQnd lookup returned exists=true and a French result.',
        query: 'livre',
        source: 'MinhQnd lookup with def_lang=vi',
        status: 'pass',
      },
      {
        evidence: 'VI->FR remains separately source-gated; machine translation must not be used to fill dictionary gaps.',
        query: 'vi->fr',
        source: 'Language source gate policy',
        status: 'partial',
      },
    ],
    relatedWordsStatus: 'partial',
    scope: 'bilingual',
    sourceCandidate: 'Existing MinhQnd FR->VI lexical dictionary API plus future source-size/offline audit.',
  },
];

export function getLanguageSourceCorpusSmokeRows() {
  return smokeRows;
}

export function getLanguageSourceCorpusSmokeSummary() {
  return {
    blocked: smokeRows.filter((row) => row.decision === 'blocked').length,
    candidates: smokeRows.length,
    expandCorpusFirst: smokeRows.filter((row) => row.decision === 'expand-corpus-first').length,
    keepProductionPairGrow: smokeRows.filter((row) => row.decision === 'keep-production-pair-grow').length,
    probeCount: smokeRows.reduce((total, row) => total + row.probes.length, 0),
  };
}
