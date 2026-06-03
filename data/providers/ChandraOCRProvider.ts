import {
  OcrEngine,
  OcrEngineResult,
  OcrEngineUnavailableError,
  OcrTextBlock,
  normalizeOcrText,
} from '../ocrEngine';

export type ChandraOcrPage = {
  pageNumber?: number;
  text?: string;
  markdown?: string;
  blocks?: ChandraOcrBlock[];
};

export type ChandraOcrBlock = {
  id?: string;
  text?: string;
  lines?: ChandraOcrLine[];
  confidence?: number;
  boundingBox?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
};

export type ChandraOcrLine = {
  id?: string;
  text?: string;
  confidence?: number;
  boundingBox?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
};

export type ChandraOcrServiceResponse = {
  text?: string;
  markdown?: string;
  pages?: ChandraOcrPage[];
  metadata?: Record<string, unknown>;
};

export type ChandraOcrClient = {
  isAvailable?: () => boolean | Promise<boolean>;
  recognizeImage: (input: { imageUri: string; languageCode: string }) => Promise<ChandraOcrServiceResponse>;
};

export class ChandraOCRProvider implements OcrEngine {
  readonly id = 'chandra';
  readonly label = 'Chandra OCR';

  private readonly client?: ChandraOcrClient;

  constructor(client?: ChandraOcrClient) {
    this.client = client;
  }

  async isAvailable() {
    if (!this.client) return false;
    return this.client.isAvailable ? this.client.isAvailable() : true;
  }

  async recognizeText(input: { imageUri: string; languageCode: string }): Promise<OcrEngineResult> {
    if (!(await this.isAvailable()) || !this.client) {
      throw new OcrEngineUnavailableError('Chandra OCR service is not configured for this runtime.');
    }

    const response = await this.client.recognizeImage(input);

    return mapChandraResponseToOcrResult(response, {
      imageUri: input.imageUri,
      languageCode: input.languageCode,
    });
  }
}

export function createChandraOCRProvider(client?: ChandraOcrClient) {
  return new ChandraOCRProvider(client);
}

export function mapChandraResponseToOcrResult(
  response: ChandraOcrServiceResponse,
  input: { imageUri?: string | null; languageCode: string }
): OcrEngineResult {
  const pageBlocks = response.pages?.flatMap((page, pageIndex) =>
    (page.blocks ?? []).map((block, blockIndex) => mapChandraBlock(block, `page-${page.pageNumber ?? pageIndex + 1}`, blockIndex))
  );
  const blocks = pageBlocks?.length ? pageBlocks : createBlocksFromText(getChandraPlainText(response));
  const text = normalizeOcrText(
    getChandraPlainText({
      ...response,
      text: response.text ?? blocks.map((block) => block.text).join('\n'),
    })
  );

  return {
    text,
    languageCode: input.languageCode,
    imageUri: input.imageUri,
    blocks,
    confidence: getAverageConfidence(blocks),
    engine: 'native',
  };
}

export function getChandraPlainText(response: ChandraOcrServiceResponse) {
  const pageText = response.pages
    ?.map((page) => page.markdown ?? page.text ?? '')
    .map(markdownToPlainText)
    .filter(Boolean)
    .join('\n\n');

  return markdownToPlainText(response.markdown ?? response.text ?? pageText ?? '');
}

function mapChandraBlock(block: ChandraOcrBlock, pageId: string, blockIndex: number): OcrTextBlock {
  const blockId = block.id || `${pageId}-block-${blockIndex + 1}`;
  const lines = block.lines?.length ? block.lines : [{ text: block.text ?? '' }];
  const mappedLines = lines
    .map((line, lineIndex) => ({
      id: line.id || `${blockId}-line-${lineIndex + 1}`,
      text: normalizeOcrText(line.text ?? ''),
      confidence: line.confidence,
      boundingBox: normalizeBoundingBox(line.boundingBox),
    }))
    .filter((line) => line.text);

  return {
    id: blockId,
    text: normalizeOcrText(block.text ?? mappedLines.map((line) => line.text).join('\n')),
    lines: mappedLines,
    confidence: block.confidence,
    boundingBox: normalizeBoundingBox(block.boundingBox),
  };
}

function createBlocksFromText(text: string): OcrTextBlock[] {
  return normalizeOcrText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      id: `chandra-block-${index + 1}`,
      text: line,
      lines: [
        {
          id: `chandra-block-${index + 1}-line-1`,
          text: line,
        },
      ],
    }));
}

function normalizeBoundingBox(box: ChandraOcrBlock['boundingBox']) {
  if (!box) return undefined;

  return {
    x: clampUnit(box.x ?? 0),
    y: clampUnit(box.y ?? 0),
    width: clampUnit(box.width ?? 0),
    height: clampUnit(box.height ?? 0),
  };
}

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function markdownToPlainText(value: string) {
  return normalizeOcrText(
    value
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[*_`~]+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  );
}

function getAverageConfidence(blocks: OcrTextBlock[]) {
  const values = blocks
    .flatMap((block) => [block.confidence, ...block.lines.map((line) => line.confidence)])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (!values.length) return undefined;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
