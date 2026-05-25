export type OcrBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OcrTextLine = {
  id: string;
  text: string;
  confidence?: number;
  boundingBox?: OcrBoundingBox;
};

export type OcrTextBlock = {
  id: string;
  text: string;
  lines: OcrTextLine[];
  confidence?: number;
  boundingBox?: OcrBoundingBox;
};

export type OcrEngineResult = {
  text: string;
  languageCode: string;
  imageUri?: string | null;
  blocks: OcrTextBlock[];
  confidence?: number;
  engine: 'deterministic-fixture' | 'native';
};

export type OcrEngine = {
  id: string;
  label: string;
  isAvailable: () => boolean | Promise<boolean>;
  recognizeText: (input: { imageUri: string; languageCode: string }) => Promise<OcrEngineResult>;
};

export class OcrEngineUnavailableError extends Error {
  readonly code = 'OCR_ENGINE_UNAVAILABLE';

  constructor(message = 'Native OCR engine is not available in this runtime.') {
    super(message);
    this.name = 'OcrEngineUnavailableError';
  }
}

const DETERMINISTIC_OCR_TEXT_BY_LANGUAGE: Record<string, string> = {
  en: 'articulate clearly\nlookup text',
  vi: 'tra từ điển\nhọc mỗi ngày',
  fr: 'bonjour monde\nmot du jour',
  es: 'casa grande\nleer libro',
  tr: 'ev yemek\nışık',
  fi: 'talo käsi\nsyödä',
  hi: 'घर किताब\nहिंदी करना',
  ja: '猫 食べる\n本',
  ko: '사랑 먹다\n책',
  ar: 'كتاب مدرسة\nبيت',
  he: 'שלום בית\nספר',
};

export function createUnavailableNativeOcrEngine(): OcrEngine {
  return {
    id: 'native-ocr-unavailable',
    label: 'Native OCR',
    isAvailable: () => false,
    recognizeText: async () => {
      throw new OcrEngineUnavailableError();
    },
  };
}

export function createDeterministicOcrResult({
  imageUri,
  languageCode,
  text = DETERMINISTIC_OCR_TEXT_BY_LANGUAGE[languageCode] ?? DETERMINISTIC_OCR_TEXT_BY_LANGUAGE.en,
}: {
  imageUri?: string | null;
  languageCode: string;
  text?: string;
}): OcrEngineResult {
  const normalizedLines = normalizeOcrText(text)
    .split('\n')
    .map((line) => normalizeOcrLine(line))
    .filter(Boolean);
  const blocks = normalizedLines.map((line, index) => {
    const blockId = `block-${index + 1}`;

    return {
      id: blockId,
      text: line,
      confidence: 0.7,
      boundingBox: {
        x: 0.06,
        y: 0.08 + index * 0.16,
        width: 0.82,
        height: 0.11,
      },
      lines: [
        {
          id: `${blockId}-line-1`,
          text: line,
          confidence: 0.7,
          boundingBox: {
            x: 0.06,
            y: 0.08 + index * 0.16,
            width: 0.82,
            height: 0.11,
          },
        },
      ],
    };
  });

  return {
    text: normalizedLines.join('\n'),
    languageCode,
    imageUri,
    blocks,
    confidence: blocks.length ? 0.7 : 0,
    engine: 'deterministic-fixture',
  };
}

export async function runOcrEngine(
  engine: OcrEngine,
  input: { imageUri: string; languageCode: string }
): Promise<OcrEngineResult> {
  const isAvailable = await engine.isAvailable();
  if (!isAvailable) {
    throw new OcrEngineUnavailableError(`${engine.label} requires a dev-client/native runtime before OCR can run.`);
  }

  return engine.recognizeText(input);
}

export function normalizeOcrText(text: string) {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .split(/\r?\n/u)
    .map((line) => normalizeOcrLine(line))
    .filter(Boolean)
    .join('\n');
}

export function extractOcrLookupCandidates(result: OcrEngineResult, limit = 8) {
  const lineCandidates = result.blocks.flatMap((block) =>
    block.lines.map((line) => normalizeOcrLine(line.text)).filter(Boolean)
  );
  const fullText = normalizeOcrLine(result.text.replace(/\n+/g, ' '));
  const tokenCandidates = lineCandidates.flatMap((line) =>
    line
      .split(/[\s,.;:!?()[\]{}"“”'‘’]+/u)
      .map(normalizeOcrLine)
      .filter((token) => token.length > 1)
  );

  return Array.from(new Set([fullText, ...lineCandidates, ...tokenCandidates].filter(Boolean))).slice(0, limit);
}

function normalizeOcrLine(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}
