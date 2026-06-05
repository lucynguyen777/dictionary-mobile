import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';
import mammoth from 'mammoth';

export type SupportedReaderImportFormat = 'txt' | 'html';
export type UnsupportedReaderImportFormat = 'pdf' | 'docx' | 'epub';
export type ReaderImportFormat = SupportedReaderImportFormat | UnsupportedReaderImportFormat;
export type EnabledReaderImportFormat = SupportedReaderImportFormat | 'docx' | 'epub' | 'pdf';
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
  sourceFormat: EnabledReaderImportFormat;
};

export type ReaderPdfImportResult = {
  title: string;
  content: string;
  sourceFormat: 'pdf';
};

export type ReaderPdfClassification = {
  kind: 'digital' | 'image-based';
  text: string;
};

export type ReaderPdfOcrResult = {
  text?: string;
  markdown?: string;
  pages?: {
    pageNumber?: number;
    text?: string;
    markdown?: string;
  }[];
  metadata?: Record<string, unknown>;
};

export type ReaderPdfOcrParser = (input: {
  fileName: string;
  rawContent: ArrayBuffer;
}) => Promise<ReaderPdfOcrResult>;
export type ReaderPdfOcrFetch = (
  input: string,
  init: {
    body: string;
    headers: Record<string, string>;
    method: 'POST';
  }
) => Promise<{
  json: () => Promise<ReaderPdfOcrResult>;
  ok: boolean;
  status: number;
}>;

type MammothConvertToHtml = typeof mammoth.convertToHtml;
type XmlNode = Record<string, unknown>;
type PdfJsTextItem = {
  str?: string;
  hasEOL?: boolean;
};
type PdfJsPage = {
  getTextContent: () => Promise<{ items: PdfJsTextItem[] }>;
};
type PdfJsDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
};
type PdfJsModule = {
  getDocument: (params: {
    data: Uint8Array;
    disableWorker: true;
    isEvalSupported: false;
    useWorkerFetch: false;
    standardFontDataUrl?: string;
  }) => { promise: Promise<PdfJsDocument> };
};
type PdfJsLoader = () => Promise<PdfJsModule>;

export type ReaderPdfParser = (fileName: string, rawContent: ArrayBuffer) => Promise<ReaderPdfImportResult>;

export const MAX_READER_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const PDFJS_DIST_VERSION = '5.7.284';


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
    status: 'supported',
    parser: 'ZIP spine text extraction',
    note: 'Đọc spine theo thứ tự sách, gom HTML chapter rồi sanitize sang text.',
    nextStep: 'Đã có prototype local; tiếp theo cần kiểm thử file thật và thêm giới hạn kích thước.',
  },
  pdf: {
    label: 'PDF',
    status: 'planned',
    parser: 'expo-pdf-text-extract for dev-client/native, PDF.js-style fallback for web',
    note: 'PDF text extraction phụ thuộc nền tảng; digital PDFs khác scanned PDFs và Expo Go không phù hợp cho native module.',
    nextStep: 'Digital PDF bật mặc định trên Expo web; native/Expo Go và scanned PDF vẫn cần gate rõ ràng.',
  },
};

export function extractReaderText(fileName: string, rawContent: string): ReaderImportResult {
  const sourceFormat = getReaderImportFormat(fileName);
  if (!isSupportedReaderImportFormat(sourceFormat)) {
    throw new Error(getUnsupportedReaderImportMessage(sourceFormat));
  }

  const title = getReaderImportTitle(fileName);
  const content = sourceFormat === 'html' ? htmlToPlainText(rawContent) : rawContent.trim();

  if (!content) {
    throw new Error('Tài liệu trống hoặc không thể trích xuất văn bản hợp lệ.');
  }

  return {
    title,
    content,
    sourceFormat,
  };
}

export async function extractReaderDocument(
  fileName: string,
  rawContent: string | ArrayBuffer,
  mimeType = ''
): Promise<ReaderImportResult> {
  const size = typeof rawContent === 'string' ? rawContent.length : rawContent.byteLength;
  if (size > MAX_READER_FILE_SIZE_BYTES) {
    throw new Error('Kích thước file quá lớn. Vui lòng import file nhỏ hơn 50MB.');
  }

  const sourceFormat = getReaderImportFormat(fileName, mimeType);

  if (sourceFormat === 'docx') {
    if (typeof rawContent === 'string') {
      throw new Error('DOCX cần đọc ở dạng ArrayBuffer trước khi chuyển sang Reader text.');
    }

    const title = getReaderImportTitle(fileName);
    const content = await extractDocxReaderText(rawContent);

    if (!content) {
      throw new Error('Tài liệu trống hoặc không thể trích xuất văn bản hợp lệ.');
    }

    return {
      title,
      content,
      sourceFormat,
    };
  }

  if (sourceFormat === 'epub') {
    if (typeof rawContent === 'string') {
      throw new Error('EPUB cần đọc ở dạng ArrayBuffer trước khi chuyển sang Reader text.');
    }

    const title = getReaderImportTitle(fileName);
    const content = await extractEpubReaderText(rawContent);

    if (!content) {
      throw new Error('Tài liệu trống hoặc không thể trích xuất văn bản hợp lệ.');
    }

    return {
      title,
      content,
      sourceFormat,
    };
  }

  if (sourceFormat === 'pdf') {
    if (!isPdfImportEnabled()) {
      throw new Error(getUnsupportedReaderImportMessage(sourceFormat));
    }

    if (typeof rawContent === 'string') {
      throw new Error('PDF cần đọc ở dạng ArrayBuffer trước khi chuyển sang Reader text.');
    }

    return extractPdfReaderDocument(fileName, rawContent, extractPdfReaderText, {
      ocrParser: getConfiguredChandraPdfOcrParser(),
    });
  }

  if (!isSupportedReaderImportFormat(sourceFormat)) {
    throw new Error(getUnsupportedReaderImportMessage(sourceFormat));
  }

  return extractReaderText(fileName, typeof rawContent === 'string' ? rawContent : decodeUtf8(rawContent));
}

export async function extractEpubReaderText(arrayBuffer: ArrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const containerXml = await readZipText(zip, 'META-INF/container.xml');
  const opfPath = getEpubRootfilePath(containerXml);
  const opfXml = await readZipText(zip, opfPath);
  const chapterPaths = getEpubSpineChapterPaths(opfXml, opfPath);
  const chapterTexts: string[] = [];

  for (const chapterPath of chapterPaths) {
    const chapterHtml = await readZipText(zip, chapterPath);
    const chapterText = htmlToPlainText(chapterHtml);

    if (chapterText) chapterTexts.push(chapterText);
  }

  return chapterTexts.join('\n\n').trim();
}

export async function extractDocxReaderText(
  arrayBuffer: ArrayBuffer,
  convertToHtml: MammothConvertToHtml = mammoth.convertToHtml
) {
  const result = await convertToHtml(
    { arrayBuffer },
    {
      includeDefaultStyleMap: true,
      includeEmbeddedStyleMap: true,
    }
  );

  return htmlToPlainText(result.value);
}

export async function extractPdfReaderDocument(
  fileName: string,
  rawContent: ArrayBuffer,
  parser: (rawContent: ArrayBuffer) => Promise<string> = extractPdfReaderText,
  options: { ocrParser?: ReaderPdfOcrParser } = {}
): Promise<ReaderPdfImportResult> {
  if (rawContent.byteLength > MAX_READER_FILE_SIZE_BYTES) {
    throw new Error('Kích thước file quá lớn. Vui lòng import file nhỏ hơn 50MB.');
  }

  const classification = await classifyPdfForReaderImport(rawContent, parser);
  const content =
    classification.kind === 'digital'
      ? classification.text
      : await extractImageBasedPdfReaderText(fileName, rawContent, options.ocrParser);

  if (!content) {
    throw new Error('Tài liệu trống hoặc không thể trích xuất văn bản hợp lệ.');
  }

  return {
    title: getReaderImportTitle(fileName),
    content,
    sourceFormat: 'pdf',
  };
}

export async function classifyPdfForReaderImport(
  rawContent: ArrayBuffer,
  parser: (rawContent: ArrayBuffer) => Promise<string> = extractPdfReaderText
): Promise<ReaderPdfClassification> {
  const text = normalizeReaderImportedText(await parser(rawContent));

  return {
    kind: text ? 'digital' : 'image-based',
    text,
  };
}

export function extractReaderTextFromOcrResult(result: ReaderPdfOcrResult) {
  const pageText = result.pages
    ?.map((page) => page.markdown ?? page.text ?? '')
    .map(markdownToReaderText)
    .filter(Boolean)
    .join('\n\n');

  return markdownToReaderText(result.markdown ?? result.text ?? pageText ?? '');
}

export async function extractPdfReaderText(
  arrayBuffer: ArrayBuffer,
  loadPdfJs: PdfJsLoader = loadPdfJsParser,
  options: { standardFontDataUrl?: string } = {}
) {
  const pdfjs = await loadPdfJs();
  const document = await pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    disableWorker: true,
    isEvalSupported: false,
    standardFontDataUrl: options.standardFontDataUrl ?? getDefaultPdfStandardFontDataUrl(),
    useWorkerFetch: false,
  }).promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const lines = textContent.items
      .map((item) => item.str?.trim() ?? '')
      .filter(Boolean);

    if (lines.length) pageTexts.push(lines.join('\n'));
  }

  return pageTexts.join('\n\n').trim();
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

export function isEnabledReaderImportFormat(format: ReaderImportFormat): format is EnabledReaderImportFormat {
  return (
    isSupportedReaderImportFormat(format) ||
    format === 'docx' ||
    format === 'epub' ||
    (format === 'pdf' && isPdfImportEnabled())
  );
}

export function isPdfImportEnabled(): boolean {
  try {
    if (process.env.EXPO_OS === 'web') return process.env.EXPO_PUBLIC_READER_ENABLE_PDF !== 'false';

    return false;
  } catch {
    return false;
  }
}

export function getUnsupportedReaderImportMessage(format: UnsupportedReaderImportFormat) {
  const plan = readerImportPlans[format];

  if (format === 'pdf') {
    return `${plan.label} digital đã hỗ trợ trên Expo web. Native/Expo Go vẫn chặn an toàn; scanned PDF cần OCR backend như Chandra trước khi import.`;
  }

  return `${plan.label} cần parser riêng trước khi import vào Reader. Chiến lược: ${plan.parser}. ${plan.nextStep} Hiện app mới hỗ trợ TXT và HTML an toàn.`;
}

function getReaderImportTitle(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '').trim() || 'Reader document';
}

function decodeUtf8(arrayBuffer: ArrayBuffer) {
  return new TextDecoder().decode(arrayBuffer);
}

async function extractImageBasedPdfReaderText(
  fileName: string,
  rawContent: ArrayBuffer,
  ocrParser?: ReaderPdfOcrParser
) {
  if (!ocrParser) {
    throw new Error('PDF dạng ảnh/scanned cần OCR backend Chandra trước khi import vào Reader.');
  }

  return extractReaderTextFromOcrResult(await ocrParser({ fileName, rawContent }));
}

export function getConfiguredChandraPdfOcrParser(): ReaderPdfOcrParser | undefined {
  const endpoint = getChandraOcrEndpoint();

  return createChandraPdfOcrParser(endpoint);
}

export function createChandraPdfOcrParser(
  endpoint: string,
  fetchImpl: ReaderPdfOcrFetch = fetch as ReaderPdfOcrFetch
): ReaderPdfOcrParser | undefined {
  const normalizedEndpoint = normalizeChandraOcrEndpoint(endpoint);
  if (!normalizedEndpoint) return undefined;

  return async ({ fileName, rawContent }) => {
    if (rawContent.byteLength > MAX_READER_FILE_SIZE_BYTES) {
      throw new Error('Kích thước file quá lớn. Vui lòng import file nhỏ hơn 50MB.');
    }

    const response = await fetchImpl(`${normalizedEndpoint}/ocr/pdf`, {
      body: JSON.stringify({
        fileBase64: arrayBufferToBase64(rawContent),
        fileName,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error('Chandra OCR từ chối file quá lớn. Vui lòng dùng file nhỏ hơn hoặc tăng giới hạn backend.');
      }

      throw new Error(`Chandra OCR chưa thể xử lý PDF scanned (${response.status}).`);
    }

    return response.json() as Promise<ReaderPdfOcrResult>;
  };
}

export function getChandraOcrEndpoint() {
  try {
    return normalizeChandraOcrEndpoint(process.env.EXPO_PUBLIC_CHANDRA_OCR_URL ?? '');
  } catch {
    return '';
  }
}

export function isChandraPdfOcrConfigured() {
  return Boolean(getChandraOcrEndpoint());
}

function normalizeChandraOcrEndpoint(endpoint: string) {
  return endpoint.trim().replace(/\/+$/, '');
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let index = 0;

  for (; index + 2 < bytes.length; index += 3) {
    output += alphabet[bytes[index] >> 2];
    output += alphabet[((bytes[index] & 0x03) << 4) | (bytes[index + 1] >> 4)];
    output += alphabet[((bytes[index + 1] & 0x0f) << 2) | (bytes[index + 2] >> 6)];
    output += alphabet[bytes[index + 2] & 0x3f];
  }

  if (index < bytes.length) {
    output += alphabet[bytes[index] >> 2];
    if (index + 1 < bytes.length) {
      output += alphabet[((bytes[index] & 0x03) << 4) | (bytes[index + 1] >> 4)];
      output += alphabet[(bytes[index + 1] & 0x0f) << 2];
      output += '=';
    } else {
      output += alphabet[(bytes[index] & 0x03) << 4];
      output += '==';
    }
  }

  return output;
}

function normalizeReaderImportedText(text: string) {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .split(/\r?\n/u)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function markdownToReaderText(text: string) {
  return normalizeReaderImportedText(
    text
      .replace(/^#{1,6}\s+/gm, (match) => `${match.trim()} `)
      .replace(/[*_`~]+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  );
}

async function loadPdfJsParser(): Promise<PdfJsModule> {
  return import('pdfjs-dist/legacy/build/pdf.mjs') as Promise<PdfJsModule>;
}

function getDefaultPdfStandardFontDataUrl() {
  try {
    if (process.versions?.node && typeof process.cwd === 'function') {
      return `${process.cwd()}/node_modules/pdfjs-dist/standard_fonts/`;
    }
  } catch {
    // Expo web does not expose the Node process shape; use the browser-safe URL below.
  }

  return `https://unpkg.com/pdfjs-dist@${PDFJS_DIST_VERSION}/standard_fonts/`;
}

async function readZipText(zip: JSZip, path: string) {
  const file = zip.file(path);
  if (!file) throw new Error(`EPUB thiếu file bắt buộc: ${path}`);

  return file.async('text');
}

function getEpubRootfilePath(containerXml: string) {
  const container = parseXml(containerXml);
  const rootfiles = asArray(getObject(container.container)?.rootfiles && getObject(getObject(container.container)?.rootfiles)?.rootfile);
  const rootfilePath = getString(rootfiles[0]?.['full-path']);

  if (!rootfilePath) throw new Error('EPUB thiếu rootfile OPF trong META-INF/container.xml.');

  return normalizeZipPath(rootfilePath);
}

function getEpubSpineChapterPaths(opfXml: string, opfPath: string) {
  const opf = parseXml(opfXml);
  const packageNode = getObject(opf.package);
  const manifestItems = asArray(getObject(packageNode.manifest)?.item);
  const spineItems = asArray(getObject(packageNode.spine)?.itemref);
  const manifestById = new Map<string, XmlNode>();

  for (const item of manifestItems) {
    const id = getString(item.id);
    if (id) manifestById.set(id, item);
  }

  const opfBasePath = getZipBasePath(opfPath);
  const chapterPaths = spineItems
    .map((item) => manifestById.get(getString(item.idref)))
    .filter((item): item is XmlNode => Boolean(item))
    .filter((item) => {
      const mediaType = getString(item['media-type']);
      return mediaType.includes('html') || mediaType.includes('xhtml');
    })
    .map((item) => normalizeZipPath(opfBasePath + getString(item.href)))
    .filter(Boolean);

  if (!chapterPaths.length) throw new Error('EPUB không có chapter HTML trong spine.');

  return chapterPaths;
}

function parseXml(xml: string) {
  const parser = new XMLParser({
    attributeNamePrefix: '',
    ignoreAttributes: false,
    trimValues: true,
  });

  return parser.parse(xml) as XmlNode;
}

function asArray(value: unknown): XmlNode[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(isObject);

  return isObject(value) ? [value] : [];
}

function getObject(value: unknown): XmlNode {
  return isObject(value) ? value : {};
}

function isObject(value: unknown): value is XmlNode {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getZipBasePath(path: string) {
  const lastSlashIndex = path.lastIndexOf('/');

  return lastSlashIndex >= 0 ? `${path.slice(0, lastSlashIndex)}/` : '';
}

function normalizeZipPath(path: string) {
  const parts: string[] = [];

  for (const part of path.replace(/^\/+/, '').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      parts.pop();
      continue;
    }
    parts.push(part);
  }

  return parts.join('/');
}

function htmlToPlainText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<(br|hr)\s*\/?>/gi, '\n')
      .replace(/<h1[^>]*>/gi, '\n# ')
      .replace(/<h2[^>]*>/gi, '\n## ')
      .replace(/<h3[^>]*>/gi, '\n### ')
      .replace(/<h[4-6][^>]*>/gi, '\n#### ')
      .replace(/<\/(p|div|section|article|header|footer|li|h[1-6]|blockquote|tr|table)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<\/t[hd]>\s*<t[hd][^>]*>/gi, ' | ')
      .replace(/<\/t[hd]>/gi, ' ')
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
