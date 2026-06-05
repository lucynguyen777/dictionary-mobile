import { describe, expect, it } from 'vitest';

import {
  getBilingualCoverageInventoryRows,
  getFutureSourceGateRows,
  getLanguageCoverageInventoryRows,
  getLanguageCoverageSummary,
} from '../data/languageCoverageInventory';
import { languageOptions } from '../data/languages';

describe('language coverage inventory', () => {
  it('covers every registered language exactly once', () => {
    const rows = getLanguageCoverageInventoryRows();

    expect(rows).toHaveLength(languageOptions.length);
    expect(new Set(rows.map((row) => row.code)).size).toBe(languageOptions.length);
    for (const language of languageOptions) {
      expect(rows).toEqual(expect.arrayContaining([expect.objectContaining({ code: language.code })]));
    }
  });

  it('keeps production parity limited to approved dictionary languages and pairs', () => {
    const rows = getLanguageCoverageInventoryRows();
    const pairs = getBilingualCoverageInventoryRows();

    expect(rows.filter((row) => row.status === 'production-parity').map((row) => row.code).sort()).toEqual([
      'en',
      'vi',
    ]);
    expect(pairs.filter((row) => row.status === 'production-parity').map((row) => row.pair).sort()).toEqual([
      'en->vi',
      'fr->vi',
      'vi->en',
    ]);
    expect(pairs.find((row) => row.pair === 'vi->fr')).toMatchObject({
      sourceKind: 'source-gated',
      status: 'source-gated',
    });
  });

  it('marks source-gated languages and future gates without fake adapters or entries', () => {
    const rows = getLanguageCoverageInventoryRows();
    const cantonese = rows.find((row) => row.code === 'yue');

    expect(cantonese).toMatchObject({
      adapterKey: null,
      hasRegisteredAdapter: false,
      localEntryCount: 0,
      sourceKind: 'source-gated',
      status: 'source-gated',
      testLevel: 'missing-source-gate',
    });
    expect(getFutureSourceGateRows()).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ug', status: 'source-gated' }),
      expect.objectContaining({ code: 'eu', status: 'source-gated' }),
      expect.objectContaining({ code: 'ain', status: 'source-gated' }),
    ]));
  });

  it('records preview coverage evidence without promoting fixtures to production', () => {
    const rows = getLanguageCoverageInventoryRows();
    const previewRows = rows.filter((row) => row.status === 'monolingual-preview');

    expect(previewRows.length).toBeGreaterThan(0);
    expect(previewRows.every((row) => row.status !== 'production-parity')).toBe(true);
    expect(previewRows.some((row) => row.sourceKind === 'preview-api')).toBe(true);
    expect(previewRows.some((row) => row.sourceKind === 'local-fixture')).toBe(true);
    expect(previewRows.some((row) => row.hasMorphology)).toBe(true);
    expect(previewRows.some((row) => row.localEntryCount > 0 && row.hasAttribution)).toBe(true);
  });

  it('summarizes coverage counts for the product dashboard', () => {
    const summary = getLanguageCoverageSummary();

    expect(summary.registeredLanguages).toBe(languageOptions.length);
    expect(summary.productionParity).toBe(5);
    expect(summary.monolingualPreview).toBeGreaterThan(20);
    expect(summary.sourceGated).toBeGreaterThanOrEqual(8);
    expect(summary.localEntryTotal).toBeGreaterThan(0);
    expect(summary.focusedTestLanguages).toBeGreaterThan(20);
  });
});
