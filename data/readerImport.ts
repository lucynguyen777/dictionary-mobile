export type SupportedReaderImportFormat = 'txt' | 'html';
export type UnsupportedReaderImportFormat = 'pdf' | 'docx' | 'epub';
export type ReaderImportFormat = SupportedReaderImportFormat | UnsupportedReaderImportFormat;
export type ReaderImportPlan = {
  label: string;
  status: 'supported' | 'planned';
  parser: string;
  note: string;
  nextStep: string;
};

export type ReaderImportResult = {
  title: string;
  content: string;
  sourceFormat: SupportedReaderImportFormat;
};

export const readerImportPlans: Record<ReaderImportFormat, ReaderImportPlan> = {
  txt: {
    label: 'TXT',
    status: 'supported',
    parser: 'Plain text',
    note: 'Đọc trực tiếp nội dung text local.',
    nextStep: 'Đã hỗ trợ import.',
  },
  html: {
    label: 'HTML',
    status: 'supported',
    parser: 'HTML to plain text sanitizer',
    note: 'Loại script/style/svg rồi chuyển cấu trúc HTML sang text an toàn.',
    nextStep: 'Đã hỗ trợ import.',
  },
  docx: {
    label: 'DOCX',
    status: 'planned',
    parser: 'Mammoth DOCX -> HTML -> Reader text',
    note: 'Ưu tiên semantic text thay vì cố giữ layout văn bản Word.',
    nextStep: 'Prototype parser DOCX bằng ArrayBuffer và tái dùng htmlToPlainText.',
  },
  epub: {
    label: 'EPUB',
    status: 'planned',
    parser: 'epub.js / ZIP spine text extraction',
    note: 'Đọc spine theo thứ tự sách, gom HTML chapter rồi sanitize sang text.',
    nextStep: 'Prototype EPUB sample nhỏ và giới hạn kích thước/chapter lỗi.',
  },
  pdf: {
    label: 'PDF',
    status: 'planned',
    parser: 'Staged PDF extractor for Expo native/web',
    note: 'PDF text extraction phụ thuộc nền tảng; cần kiểm tra native module và web fallback trước khi bật.',
    nextStep: 'Đánh giá extractor trên Expo web và dev client, giữ PDF disabled trong Expo Go.',
  },
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
  const plan = readerImportPlans[format];

  return `${plan.label} cần parser riêng trước khi import vào Reader. Chiến lược: ${plan.parser}. ${plan.nextStep} Hiện app mới hỗ trợ TXT và HTML an toàn.`;
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
