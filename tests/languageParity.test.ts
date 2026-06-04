import { describe, expect, it } from 'vitest';

import { getLanguageParityRows } from '../data/languageParity';

describe('language parity dashboard data', () => {
  it('classifies production parity, preview, and source-gated rows', () => {
    const rows = getLanguageParityRows();

    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'en', status: 'production-parity' }),
      expect.objectContaining({ code: 'vi', status: 'production-parity' }),
      expect.objectContaining({ code: 'fr->vi', status: 'production-parity' }),
      expect.objectContaining({ code: 'vi->fr', status: 'source-gated' }),
    ]));
    expect(rows.some((row) => row.status === 'monolingual-preview')).toBe(true);
    expect(rows.some((row) => row.status === 'source-gated')).toBe(true);
  });
});
