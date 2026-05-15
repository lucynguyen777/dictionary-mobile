export type ReaderImportFormat = 'txt' | 'html';

export type ReaderImportResult = {
  title: string;
  content: string;
  sourceFormat: ReaderImportFormat;
};

export function extractReaderText(fileName: string, rawContent: string): ReaderImportResult {
  const sourceFormat = getReaderImportFormat(fileName);
  const title = fileName.replace(/\.[^/.]+$/, '').trim() || 'Reader document';
  const content = sourceFormat === 'html' ? htmlToPlainText(rawContent) : rawContent.trim();

  return {
    title,
    content,
    sourceFormat,
  };
}

function getReaderImportFormat(fileName: string): ReaderImportFormat {
  const normalizedName = fileName.toLocaleLowerCase();

  if (normalizedName.endsWith('.html') || normalizedName.endsWith('.htm')) return 'html';

  return 'txt';
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
