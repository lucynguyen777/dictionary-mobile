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

describe('glossary import from documents', () => {
  it('reads arrow lines and table rows, ignoring prose', async () => {
    const { glossaryLinesFromDocumentText } = await import('../data/glossaryImport');
    expect(glossaryLinesFromDocumentText('Medical glossary\nterm | translation\nMRI | cộng hưởng từ\nECG -> điện tâm đồ\nPlain sentence about medicine.\nA | B | C')).toEqual({
      lines: ['MRI → cộng hưởng từ', 'ECG → điện tâm đồ'],
      skippedRows: 1,
    });
  });

  it('reads a two-column table from a real DOCX file', async () => {
    const { default: JSZip } = await import('jszip');
    const { glossaryLinesFromFile } = await import('../data/glossaryImport');
    const cell = (text: string) => `<w:tc><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
    const row = (a: string, b: string) => `<w:tr>${cell(a)}${cell(b)}</w:tr>`;
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Legal terms</w:t></w:r></w:p><w:tbl>${row('Term', 'Translation')}${row('plaintiff', 'nguyên đơn')}${row('defendant', 'bị đơn')}</w:tbl></w:body></w:document>`);
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    const result = await glossaryLinesFromFile({ arrayBuffer: async () => buffer, text: async () => '' }, 'legal.docx');
    expect(result).toEqual({ lines: ['plaintiff → nguyên đơn', 'defendant → bị đơn'], skippedRows: 0 });
  });

  it('reads arrow lines from a real PDF on web', async () => {
    const { readFileSync } = await import('node:fs');
    const { glossaryLinesFromFile } = await import('../data/glossaryImport');
    const bytes = readFileSync('tests/fixtures/reader-pdf/glossary-arrows.pdf');
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    const result = await glossaryLinesFromFile({ arrayBuffer: async () => buffer, text: async () => '' }, 'glossary.pdf', 'application/pdf', { isWeb: true });
    expect(result.lines).toEqual(['MRI → chup cong huong tu', 'ECG → dien tam do']);
  });

  it('routes files by extension or MIME type', async () => {
    const { getGlossaryFileKind } = await import('../data/glossaryImport');
    expect(getGlossaryFileKind('a.docx')).toBe('docx');
    expect(getGlossaryFileKind('scan', 'application/pdf')).toBe('pdf');
    expect(getGlossaryFileKind('terms.tsv')).toBe('delimited');
  });
});
