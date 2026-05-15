export type SupportedReaderImportFormat = 'txt' | 'html';
export type UnsupportedReaderImportFormat = 'pdf' | 'docx' | 'epub';
export type ReaderImportFormat = SupportedReaderImportFormat | UnsupportedReaderImportFormat;

export type ReaderImportResult = {
  title: string;
  content: string;
  sourceFormat: SupportedReaderImportFormat;
};

const unsupportedFormatLabels: Record<UnsupportedReaderImportFormat, string> = {
  docx: 'DOCX',
  epub: 'EPUB',
  pdf: 'PDF',
};

export function extractReaderText(fileName: string, rawContent: string): ReaderImportResult {
  const sourceFormat = getReaderImportFormat(fileName);
  if (!isSupportedReaderImportFormat(sourceFormat)) {
    throw new Error(getUnsupportedReaderImportMessage(sourceFormat));
  }

  const title = fileName.replace(/\.[^/.]+$/, '').trim() || 'Reader document';
  const content = sourceFormat === 'html' ? htmlToPlainText(rawContent) : rawContent.trim();

  return {
    title,
    content,
    sourceFormat,
  };
}

export function getReaderImportFormat(fileName: string, mimeType = ''): ReaderImportFormat {
  const normalizedName = fileName.toLocaleLowerCase();
  const normalizedMimeType = mimeType.toLocaleLowerCase();

  if (normalizedName.endsWith('.pdf') || normalizedMimeType.includes('pdf')) return 'pdf';
  if (
    normalizedName.endsWith('.docx') ||
    normalizedMimeType.includes('officedocument.wordprocessingml.document')
  ) {
    return 'docx';
  }
  if (normalizedName.endsWith('.epub') || normalizedMimeType.includes('epub')) return 'epub';

  if (normalizedName.endsWith('.html') || normalizedName.endsWith('.htm')) return 'html';

  return 'txt';
}

export function isSupportedReaderImportFormat(format: ReaderImportFormat): format is SupportedReaderImportFormat {
  return format === 'txt' || format === 'html';
}

export function getUnsupportedReaderImportMessage(format: UnsupportedReaderImportFormat) {
  return `${unsupportedFormatLabels[format]} cần parser riêng trước khi import vào Reader. Hiện app mới hỗ trợ TXT và HTML an toàn.`;
}

function htmlToPlainText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<(br|hr)\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|article|header|footer|li|h[1-6]|blockquote|tr)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, ' ')
  )
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}
