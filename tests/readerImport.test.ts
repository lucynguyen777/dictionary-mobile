import { describe, expect, it } from 'vitest';

import {
  extractReaderText,
  getReaderImportFormat,
  getUnsupportedReaderImportMessage,
  isSupportedReaderImportFormat,
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
  });
});
