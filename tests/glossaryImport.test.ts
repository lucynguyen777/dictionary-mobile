import { describe, expect, it } from 'vitest';

import { glossaryLinesFromDelimitedText, mergeGlossaryText } from '../data/glossaryImport';

describe('glossaryLinesFromDelimitedText', () => {
  it('reads CSV with a header, quoted commas and a BOM', () => {
    expect(glossaryLinesFromDelimitedText('﻿term,translation\nMRI,cộng hưởng từ\n"CT, contrast","chụp CT có cản quang"\n')).toEqual({
      lines: ['MRI → cộng hưởng từ', 'CT, contrast → chụp CT có cản quang'],
      skippedRows: 0,
    });
  });

  it('reads TSV exported from a spreadsheet and skips incomplete rows', () => {
    expect(glossaryLinesFromDelimitedText('ECG\tđiện tâm đồ\nonly-term\t\nA -> B\tx\n')).toEqual({
      lines: ['ECG → điện tâm đồ'],
      skippedRows: 2,
    });
  });
});

describe('mergeGlossaryText', () => {
  it('appends new terms and keeps existing translations on duplicates', () => {
    expect(mergeGlossaryText('MRI → cộng hưởng từ\n', ['mri → khác', 'ECG → điện tâm đồ', 'ECG → trùng'])).toEqual({
      addedCount: 1,
      text: 'MRI → cộng hưởng từ\nECG → điện tâm đồ',
    });
  });

  it('fills an empty glossary', () => {
    expect(mergeGlossaryText('', ['ECG → điện tâm đồ'])).toEqual({ addedCount: 1, text: 'ECG → điện tâm đồ' });
  });
});
