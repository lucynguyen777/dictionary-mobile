import { languageOptions, type LanguageCode } from './languages';
import { getLocalDictionaryEntries } from './localLexicon';
import { supportsMorphology } from './morphology';

export type LanguageCoverageStatus = 'production-parity' | 'monolingual-preview' | 'source-gated';
export type LanguageCoverageSourceKind = 'production-api' | 'preview-api' | 'local-fixture' | 'source-gated';
export type LanguageCoverageTestLevel = 'focused' | 'registry' | 'missing-source-gate';

export type LanguageCoverageInventoryRow = {
  code: LanguageCode;
  label: string;
  family: string;
  script: string;
  writingDirection: string;
  status: LanguageCoverageStatus;
  sourceKind: LanguageCoverageSourceKind;
  adapterKey: string | null;
  hasRegisteredAdapter: boolean;
  localEntryCount: number;
  definitionCount: number;
  exampleCount: number;
  relatedWordCount: number;
  attributedEntryCount: number;
  hasMorphology: boolean;
  hasExamples: boolean;
  hasRelatedWords: boolean;
  hasAttribution: boolean;
  testLevel: LanguageCoverageTestLevel;
  topGap: string;
  nextAction: string;
};

export type BilingualCoverageInventoryRow = {
  pair: string;
  label: string;
  status: 'production-parity' | 'source-gated';
  sourceKind: 'production-api' | 'source-gated';
  topGap: string;
  nextAction: string;
};

export type FutureSourceGateRow = {
  code: string;
  label: string;
  status: 'source-gated';
  topGap: string;
  nextAction: string;
};

const productionParityLanguages = new Set<string>(['en', 'vi']);
const previewApiLanguages = new Set<string>(['fr', 'es', 'ms']);
const focusedTestLanguages = new Set<string>([
  'ar',
  'bo',
  'et',
  'fi',
  'haw',
  'he',
  'hi',
  'hu',
  'ig',
  'ja',
  'jv',
  'kk',
  'kn',
  'ko',
  'ml',
  'my',
  'ru',
  'so',
  'sw',
  'ta',
  'te',
  'tl',
  'tr',
  'uz',
  'yo',
  'zh',
  'zu',
]);

const futureSourceGateRows: FutureSourceGateRow[] = [
  {
    code: 'ug',
    label: 'Uyghur',
    status: 'source-gated',
    topGap: 'Current approved samples are not representative enough for noun/adjective/verb fixtures.',
    nextAction: 'Find a larger approved Uyghur-definition source or a non-placeholder Wiktionary candidate set.',
  },
  {
    code: 'eu',
    label: 'Basque',
    status: 'source-gated',
    topGap: 'No production source gate has been completed for Basque yet.',
    nextAction: 'Run source/license research before adding registry metadata or fixtures.',
  },
  {
    code: 'ain',
    label: 'Ainu',
    status: 'source-gated',
    topGap: 'Source availability and licensing are not proven.',
    nextAction: 'Research legal dictionary sources and script/romanization expectations first.',
  },
  {
    code: 'qu',
    label: 'Quechua',
    status: 'source-gated',
    topGap: 'Amerind/proposed-family candidates require per-language source validation.',
    nextAction: 'Choose a specific Quechua variety and verify a legal lexical source.',
  },
  {
    code: 'nah',
    label: 'Nahuatl',
    status: 'source-gated',
    topGap: 'No approved source, variety scope, or attribution path has been selected.',
    nextAction: 'Research variety scope and compatible dictionary data before registry work.',
  },
  {
    code: 'gn',
    label: 'Guarani',
    status: 'source-gated',
    topGap: 'No approved production lexical source is selected.',
    nextAction: 'Run source/license smoke and define morphology/orthography expectations.',
  },
];

function countDefinitions(entries: ReturnType<typeof getLocalDictionaryEntries>) {
  return entries.reduce((total, entry) => total + entry.definitions.length, 0);
}

function countExamples(entries: ReturnType<typeof getLocalDictionaryEntries>) {
  return entries.reduce(
    (total, entry) => total + entry.definitions.reduce((sum, definition) => sum + definition.examples.length, 0),
    0
  );
}

function countRelatedWords(entries: ReturnType<typeof getLocalDictionaryEntries>) {
  return entries.reduce(
    (total, entry) =>
      total + entry.synonyms.length + entry.antonyms.length + entry.collocations.length + entry.idioms.length,
    0
  );
}

function countAttributedEntries(entries: ReturnType<typeof getLocalDictionaryEntries>) {
  return entries.filter((entry) => entry.etymology.trim().length > 0).length;
}

function getSourceKind(languageCode: string, unavailable: boolean): LanguageCoverageSourceKind {
  if (unavailable) return 'source-gated';
  if (productionParityLanguages.has(languageCode)) return 'production-api';
  if (previewApiLanguages.has(languageCode)) return 'preview-api';
  return 'local-fixture';
}

function getStatus(languageCode: string, unavailable: boolean): LanguageCoverageStatus {
  if (unavailable) return 'source-gated';
  if (productionParityLanguages.has(languageCode)) return 'production-parity';
  return 'monolingual-preview';
}

function getTestLevel(languageCode: string, status: LanguageCoverageStatus): LanguageCoverageTestLevel {
  if (status === 'source-gated') return 'missing-source-gate';
  if (focusedTestLanguages.has(languageCode)) return 'focused';
  return 'registry';
}

function getTopGap(row: {
  status: LanguageCoverageStatus;
  sourceKind: LanguageCoverageSourceKind;
  localEntryCount: number;
  hasExamples: boolean;
  hasRelatedWords: boolean;
}) {
  if (row.status === 'source-gated') {
    return 'Needs approved legal dictionary source and representative samples.';
  }

  if (row.status === 'production-parity') {
    return 'Needs ongoing corpus growth, offline packaging, and parity smoke as coverage expands.';
  }

  if (row.sourceKind === 'preview-api') {
    return 'Hosted API preview still needs coverage audit, offline packaging path, and UI smoke before production parity.';
  }

  if (row.localEntryCount < 100) {
    return 'Tiny local fixture corpus; not enough headword coverage for production parity.';
  }

  if (!row.hasExamples || !row.hasRelatedWords) {
    return 'Needs examples and related-word coverage before parity promotion.';
  }

  return 'Needs production corpus size, source metadata, and offline packaging proof.';
}

function getNextAction(status: LanguageCoverageStatus, sourceKind: LanguageCoverageSourceKind) {
  if (status === 'source-gated') {
    return 'Resolve source/license gate before adding or enabling production dictionary data.';
  }

  if (status === 'production-parity') {
    return 'Grow corpus/offline packs and keep Word/Reader/Library smoke tests green.';
  }

  if (sourceKind === 'preview-api') {
    return 'Run coverage inventory against the upstream API or dump, then define a packaged corpus path.';
  }

  return 'Replace tiny fixtures with an approved larger corpus and keep morphology/example/related-word tests.';
}

export function getLanguageCoverageInventoryRows(): LanguageCoverageInventoryRow[] {
  return languageOptions.map((language) => {
    const entries = getLocalDictionaryEntries(language.code);
    const unavailable = language.dictionaryStatus === 'unavailable';
    const sourceKind = getSourceKind(language.code, unavailable);
    const status = getStatus(language.code, unavailable);
    const adapterKey = language.adapterKey ?? null;
    const hasRegisteredAdapter = Boolean(adapterKey && !unavailable);
    const definitionCount = countDefinitions(entries);
    const exampleCount = countExamples(entries);
    const relatedWordCount = countRelatedWords(entries);
    const attributedEntryCount = countAttributedEntries(entries);
    const hasExamples = exampleCount > 0;
    const hasRelatedWords = relatedWordCount > 0;

    return {
      adapterKey,
      attributedEntryCount,
      code: language.code,
      definitionCount,
      exampleCount,
      family: language.family,
      hasAttribution: attributedEntryCount === entries.length && entries.length > 0,
      hasExamples,
      hasMorphology: supportsMorphology(language.code),
      hasRegisteredAdapter,
      hasRelatedWords,
      label: language.label,
      localEntryCount: entries.length,
      nextAction: getNextAction(status, sourceKind),
      relatedWordCount,
      script: language.script,
      sourceKind,
      status,
      testLevel: getTestLevel(language.code, status),
      topGap: getTopGap({
        hasExamples,
        hasRelatedWords,
        localEntryCount: entries.length,
        sourceKind,
        status,
      }),
      writingDirection: language.writingDirection,
    };
  });
}

export function getBilingualCoverageInventoryRows(): BilingualCoverageInventoryRow[] {
  return [
    {
      label: 'English to Vietnamese',
      nextAction: 'Keep dictionary-source smoke and expand offline packaging.',
      pair: 'en->vi',
      sourceKind: 'production-api',
      status: 'production-parity',
      topGap: 'Needs ongoing corpus/offline-pack growth.',
    },
    {
      label: 'Vietnamese to English',
      nextAction: 'Keep dictionary-source smoke and expand offline packaging.',
      pair: 'vi->en',
      sourceKind: 'production-api',
      status: 'production-parity',
      topGap: 'Needs ongoing corpus/offline-pack growth.',
    },
    {
      label: 'French to Vietnamese',
      nextAction: 'Grow coverage and define an offline packaging path.',
      pair: 'fr->vi',
      sourceKind: 'production-api',
      status: 'production-parity',
      topGap: 'Supported by lexical dictionary data but still needs larger coverage.',
    },
    {
      label: 'Vietnamese to French',
      nextAction: 'Select DBnary/Wiktionary-derived lexical source before enabling the pair.',
      pair: 'vi->fr',
      sourceKind: 'source-gated',
      status: 'source-gated',
      topGap: 'No approved VI-to-FR lexical dictionary source; machine translation is not dictionary data.',
    },
  ];
}

export function getFutureSourceGateRows(): FutureSourceGateRow[] {
  return futureSourceGateRows;
}

export function getLanguageCoverageSummary() {
  const languageRows = getLanguageCoverageInventoryRows();
  const pairRows = getBilingualCoverageInventoryRows();
  const futureGateRows = getFutureSourceGateRows();
  const allRows = [...languageRows, ...pairRows, ...futureGateRows];

  return {
    focusedTestLanguages: languageRows.filter((row) => row.testLevel === 'focused').length,
    localEntryTotal: languageRows.reduce((total, row) => total + row.localEntryCount, 0),
    monolingualPreview: allRows.filter((row) => row.status === 'monolingual-preview').length,
    productionParity: allRows.filter((row) => row.status === 'production-parity').length,
    registeredLanguages: languageRows.length,
    sourceGated: allRows.filter((row) => row.status === 'source-gated').length,
  };
}
