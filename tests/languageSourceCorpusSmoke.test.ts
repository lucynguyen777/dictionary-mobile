import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  getLanguageSourceCorpusSmokeRows,
  getLanguageSourceCorpusSmokeSummary,
} from '../data/languageSourceCorpusSmoke';

describe('language source corpus smoke', () => {
  it('covers the first v1.3.6 language parity candidates', () => {
    const rows = getLanguageSourceCorpusSmokeRows();

    expect(rows.map((row) => row.id).sort()).toEqual(['es', 'fr', 'fr->vi', 'ms']);
    expect(rows.every((row) => row.probes.length >= 3)).toBe(true);
    expect(rows.every((row) => row.offlinePackViability === 'needs-packaging-plan')).toBe(true);
  });

  it('keeps preview languages out of production promotion after smoke', () => {
    const rows = getLanguageSourceCorpusSmokeRows();

    expect(rows.filter((row) => row.currentState === 'monolingual-preview').map((row) => row.id).sort()).toEqual([
      'es',
      'fr',
      'ms',
    ]);
    expect(rows.filter((row) => row.currentState === 'monolingual-preview').every((row) => row.decision === 'expand-corpus-first')).toBe(true);
    expect(rows.find((row) => row.id === 'fr->vi')).toMatchObject({
      currentState: 'production-pair',
      decision: 'keep-production-pair-grow',
    });
  });

  it('records concrete blockers found during smoke', () => {
    const rows = getLanguageSourceCorpusSmokeRows();

    expect(rows.find((row) => row.id === 'es')?.probes).toEqual(expect.arrayContaining([
      expect.objectContaining({ query: 'pequeña / pequena', status: 'fail' }),
    ]));
    expect(rows.find((row) => row.id === 'ms')?.blocker).toContain('meN-/peN-');
    expect(rows.find((row) => row.id === 'fr')?.blocker).toContain('offline pack');
    expect(rows.find((row) => row.id === 'fr->vi')?.probes).toEqual(expect.arrayContaining([
      expect.objectContaining({ query: 'vi->fr', status: 'partial' }),
    ]));
  });

  it('documents smoke decisions in the source report', () => {
    const docs = readFileSync(resolve(process.cwd(), 'docs/language-source-corpus-smoke.md'), 'utf8');
    const summary = getLanguageSourceCorpusSmokeSummary();

    expect(summary).toMatchObject({
      blocked: 0,
      candidates: 4,
      expandCorpusFirst: 3,
      keepProductionPairGrow: 1,
    });
    expect(docs).toContain('# Language Source And Corpus Smoke');
    expect(docs).toContain('Do not promote `es`, `ms`, or monolingual `fr` to production parity in v1.3.6.');
    expect(docs).toContain('Keep `vi->fr` source-gated.');
    expect(docs).toContain('docs/source-attribution-packaging.md');
  });
});
