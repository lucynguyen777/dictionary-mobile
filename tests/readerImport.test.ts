import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  extractDocxReaderText,
  extractEpubReaderText,
  extractPdfReaderDocument,
  extractPdfReaderText,
  extractReaderDocument,
  extractReaderText,
  getReaderImportFormat,
  getUnsupportedReaderImportMessage,
  isEnabledReaderImportFormat,
  isSupportedReaderImportFormat,
  readerImportPlans,
} from '../data/readerImport';

const pdfFixtureDir = join(process.cwd(), 'tests', 'fixtures', 'reader-pdf');
const standardFontDataUrl = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts') + '/';
const originalReaderEnablePdf = process.env.READER_ENABLE_PDF;
const originalExpoOs = process.env.EXPO_OS;

afterEach(() => {
  restoreEnv('READER_ENABLE_PDF', originalReaderEnablePdf);
  restoreEnv('EXPO_OS', originalExpoOs);
});

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
    expect(readerImportPlans.epub.parser).toContain('ZIP spine');
    expect(readerImportPlans.pdf.parser).toContain('expo-pdf-text-extract');
    expect(readerImportPlans.pdf.nextStep).toContain('READER_ENABLE_PDF=true');
  });

  it('converts DOCX HTML output into Reader text', async () => {
    const text = await extractDocxReaderText(new ArrayBuffer(2), async () => ({
      messages: [],
      value: '<h1>Lesson</h1><p>Hello&nbsp;DOCX</p><script>ignore()</script>',
    }));

    expect(text).toBe('Lesson\n\nHello DOCX');
  });

  it('extracts EPUB chapters in spine order', async () => {
    const epub = new JSZip();
    epub.file(
      'META-INF/container.xml',
      '<?xml version="1.0"?><container><rootfiles><rootfile full-path="OEBPS/content.opf" /></rootfiles></container>'
    );
    epub.file(
      'OEBPS/content.opf',
      [
        '<package>',
        '<manifest>',
        '<item id="chapter-two" href="chapter-2.xhtml" media-type="application/xhtml+xml" />',
        '<item id="chapter-one" href="chapter-1.xhtml" media-type="application/xhtml+xml" />',
        '</manifest>',
        '<spine>',
        '<itemref idref="chapter-one" />',
        '<itemref idref="chapter-two" />',
        '</spine>',
        '</package>',
      ].join('')
    );
    epub.file('OEBPS/chapter-1.xhtml', '<html><body><h1>One</h1><p>Hello&nbsp;EPUB.</p></body></html>');
    epub.file('OEBPS/chapter-2.xhtml', '<html><body><h1>Two</h1><p>Second chapter.</p></body></html>');

    const buffer = await epub.generateAsync({ type: 'arraybuffer' });

    await expect(extractEpubReaderText(buffer)).resolves.toBe('One\n\nHello EPUB.\n\nTwo\n\nSecond chapter.');
  });

  it('imports EPUB documents through the async Reader document path', async () => {
    const epub = new JSZip();
    epub.file(
      'META-INF/container.xml',
      '<container><rootfiles><rootfile full-path="book.opf" /></rootfiles></container>'
    );
    epub.file(
      'book.opf',
      '<package><manifest><item id="c1" href="c1.xhtml" media-type="application/xhtml+xml" /></manifest><spine><itemref idref="c1" /></spine></package>'
    );
    epub.file('c1.xhtml', '<html><body><p>Reader EPUB import.</p></body></html>');

    const result = await extractReaderDocument(
      'sample.epub',
      await epub.generateAsync({ type: 'arraybuffer' }),
      'application/epub+zip'
    );

    expect(result.title).toBe('sample');
    expect(result.sourceFormat).toBe('epub');
    expect(result.content).toBe('Reader EPUB import.');
    expect(isEnabledReaderImportFormat('epub')).toBe(true);
  });

  it('extracts text from the simple digital PDF fixture without enabling PDF imports', async () => {
    const buffer = await readFixtureArrayBuffer('digital-simple.pdf');
    const text = await extractPdfReaderText(buffer, undefined, { standardFontDataUrl });

    expect(text).toContain('Reader PDF Simple Fixture');
    expect(text).toContain('selectable text for Reader import tests');
    expect(isEnabledReaderImportFormat('pdf')).toBe(false);
  });

  it('imports PDF documents through the async Reader document path only when the web gate is enabled', async () => {
    process.env.READER_ENABLE_PDF = 'true';
    process.env.EXPO_OS = 'web';

    const buffer = await readFixtureArrayBuffer('digital-simple.pdf');
    const result = await extractReaderDocument('digital-simple.pdf', buffer, 'application/pdf');

    expect(result.title).toBe('digital-simple');
    expect(result.sourceFormat).toBe('pdf');
    expect(result.content).toContain('Reader PDF Simple Fixture');
    expect(isEnabledReaderImportFormat('pdf')).toBe(true);
  });

  it('wraps PDF extraction in the Reader import result shape', async () => {
    const buffer = await readFixtureArrayBuffer('digital-multiline.pdf');
    const result = await extractPdfReaderDocument('digital-multiline.pdf', buffer, (rawContent) =>
      extractPdfReaderText(rawContent, undefined, { standardFontDataUrl })
    );

    expect(result.title).toBe('digital-multiline');
    expect(result.sourceFormat).toBe('pdf');
    expect(result.content).toContain('Reader PDF Multiline Fixture');
    expect(result.content).toContain('Final line confirms extraction reaches the end of the page.');
  });

  it('rejects PDF fixtures with no extractable text', async () => {
    const buffer = await readFixtureArrayBuffer('empty.pdf');

    await expect(extractPdfReaderDocument('empty.pdf', buffer)).rejects.toThrow('Tài liệu trống');
  });

  it('keeps image-only PDF fixtures on the empty/OCR-required path', async () => {
    const buffer = await readFixtureArrayBuffer('scanned-image.pdf');

    await expect(extractPdfReaderDocument('scanned-image.pdf', buffer)).rejects.toThrow('Tài liệu trống');
  });

  it('rejects files exceeding the size limit', async () => {
    const largeContent = 'a'.repeat(10 * 1024 * 1024 + 1); // > 10MB
    await expect(extractReaderDocument('large.txt', largeContent)).rejects.toThrow('Kích thước file quá lớn');
  });

  it('rejects files resulting in empty content', () => {
    expect(() => extractReaderText('empty.html', '<p>   </p>')).toThrow('Tài liệu trống');
  });
});

async function readFixtureArrayBuffer(fileName: string) {
  const buffer = await readFile(join(pdfFixtureDir, fileName));

  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
