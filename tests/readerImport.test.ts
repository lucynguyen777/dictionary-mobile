import { describe, expect, it } from 'vitest';

import {
  extractReaderText,
  extractDocxReaderText,
  getReaderImportFormat,
  getUnsupportedReaderImportMessage,
  isSupportedReaderImportFormat,
  readerImportPlans,
} from '../data/readerImport';

describe('readerImport', () => {
  it('extracts readable text from HTML', () => {
    const result = extractReaderText('sample.html', '<h1>Hello</h1><p>Reader&nbsp;text</p>');

    expect(result.sourceFormat).toBe('html');
    expect(result.content).toContain('Hello');
    expect(result.content).toContain('Reader text');
  });

  it('detects unsupported structured document formats before parsing binary content', () => {
    const formats = [
      getReaderImportFormat('book.epub', 'application/epub+zip'),
      getReaderImportFormat('paper.pdf', 'application/pdf'),
      getReaderImportFormat('notes.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    ];

    expect(formats.every((format) => !isSupportedReaderImportFormat(format))).toBe(true);
    expect(getUnsupportedReaderImportMessage('pdf')).toContain('PDF cần parser riêng');
    expect(getUnsupportedReaderImportMessage('pdf')).toContain(readerImportPlans.pdf.parser);
  });

  it('keeps parser strategy explicit for structured reader formats', () => {
    expect(readerImportPlans.docx.parser).toContain('Mammoth');
    expect(readerImportPlans.epub.parser).toContain('epub.js');
    expect(readerImportPlans.pdf.nextStep).toContain('Expo web');
  });

  it('converts DOCX HTML output into Reader text', async () => {
    const text = await extractDocxReaderText(new ArrayBuffer(2), async () => ({
      messages: [],
      value: '<h1>Lesson</h1><p>Hello&nbsp;DOCX</p><script>ignore()</script>',
    }));

    expect(text).toBe('Lesson\n\nHello DOCX');
  });

});
