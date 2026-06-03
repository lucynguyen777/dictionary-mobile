import {
  OcrEngine,
  OcrEngineResult,
  OcrEngineUnavailableError,
  OcrTextBlock,
  normalizeOcrText,
} from '../ocrEngine';

export type MLKitTextRecognitionResult = {
  text?: string;
  blocks?: {
    text?: string;
    lines?: {
      text?: string;
      confidence?: number;
      boundingBox?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      };
    }[];
    confidence?: number;
    boundingBox?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    };
  }[];
};

type MLKitBoundingBox = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type MLKitRecognizer = {
  isAvailable?: () => boolean | Promise<boolean>;
  recognizeText: (imageUri: string) => Promise<MLKitTextRecognitionResult>;
};

export function createMLKitOCRProvider(recognizer?: MLKitRecognizer): OcrEngine {
  return {
    id: 'mlkit',
    label: 'MLKit OCR',
    isAvailable: async () => {
      if (!recognizer) return false;
      return recognizer.isAvailable ? recognizer.isAvailable() : true;
    },
    recognizeText: async ({ imageUri, languageCode }) => {
      if (!recognizer) {
        throw new OcrEngineUnavailableError('MLKit OCR requires a dev-client/native runtime before OCR can run.');
      }

      const isAvailable = recognizer.isAvailable ? await recognizer.isAvailable() : true;
      if (!isAvailable) {
        throw new OcrEngineUnavailableError('MLKit OCR is not available in this runtime.');
      }

      const result = await recognizer.recognizeText(imageUri);

      return mapMLKitResultToOcrResult(result, { imageUri, languageCode });
    },
  };
}

export function mapMLKitResultToOcrResult(
  result: MLKitTextRecognitionResult,
  input: { imageUri?: string | null; languageCode: string }
): OcrEngineResult {
  const blocks = result.blocks?.length
    ? result.blocks.map((block, blockIndex) => {
        const blockId = `mlkit-block-${blockIndex + 1}`;
        const lines = (block.lines?.length ? block.lines : [{ text: block.text ?? '' }])
          .map((line, lineIndex) => ({
            id: `${blockId}-line-${lineIndex + 1}`,
            text: normalizeOcrText(line.text ?? ''),
            confidence: line.confidence,
            boundingBox: normalizeBoundingBox(line.boundingBox),
          }))
          .filter((line) => line.text);

        return {
          id: blockId,
          text: normalizeOcrText(block.text ?? lines.map((line) => line.text).join('\n')),
          lines,
          confidence: block.confidence,
          boundingBox: normalizeBoundingBox(block.boundingBox),
        };
      })
    : createBlocksFromText(result.text ?? '');

  return {
    text: normalizeOcrText(result.text ?? blocks.map((block) => block.text).join('\n')),
    languageCode: input.languageCode,
    imageUri: input.imageUri,
    blocks,
    confidence: getAverageConfidence(blocks),
    engine: 'native',
  };
}

function createBlocksFromText(text: string): OcrTextBlock[] {
  return normalizeOcrText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      id: `mlkit-block-${index + 1}`,
      text: line,
      lines: [
        {
          id: `mlkit-block-${index + 1}-line-1`,
          text: line,
        },
      ],
    }));
}

function normalizeBoundingBox(box?: MLKitBoundingBox) {
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

function getAverageConfidence(blocks: OcrTextBlock[]) {
  const values = blocks
    .flatMap((block) => [block.confidence, ...block.lines.map((line) => line.confidence)])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (!values.length) return undefined;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
