export type RecognitionKind = 'speech' | 'ocr';

export type RecognitionPrototypeResult = {
  kind: RecognitionKind;
  text: string;
  suggestions: string[];
  confidence: number;
  localUri?: string | null;
  notice: string;
};

const PROTOTYPE_SPEECH_TEXT_BY_LANGUAGE: Record<string, string> = {
  en: 'articulate',
  vi: 'từ điển',
  fr: 'bonjour',
  es: 'casa',
  tr: 'ev',
  fi: 'talo',
  ja: '猫',
  ko: '사랑',
  ar: 'كتاب',
  he: 'שלום',
};

const PROTOTYPE_OCR_TEXT_BY_LANGUAGE: Record<string, string> = {
  en: 'articulate clearly',
  vi: 'tra từ điển',
  fr: 'bonjour monde',
  es: 'casa grande',
  tr: 'ev yemek',
  fi: 'talo käsi',
  ja: '猫 食べる',
  ko: '사랑 먹다',
  ar: 'كتاب مدرسة',
  he: 'שלום בית',
};

export function normalizeRecognizedLookupText(text: string) {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitRecognitionSuggestions(text: string, limit = 6) {
  const normalizedText = normalizeRecognizedLookupText(text);
  if (!normalizedText) return [];

  const tokens = normalizedText
    .split(/[\s,.;:!?()[\]{}"“”'‘’]+/u)
    .map(normalizeRecognizedLookupText)
    .filter((token) => token.length > 1);

  return Array.from(new Set([normalizedText, ...tokens])).slice(0, limit);
}

export function createSpeechToTextPrototypeResult({
  languageCode,
  audioUri,
}: {
  languageCode: string;
  audioUri?: string | null;
}): RecognitionPrototypeResult {
  const text = PROTOTYPE_SPEECH_TEXT_BY_LANGUAGE[languageCode] ?? PROTOTYPE_SPEECH_TEXT_BY_LANGUAGE.en;

  return {
    kind: 'speech',
    text,
    suggestions: splitRecognitionSuggestions(text),
    confidence: 0.72,
    localUri: audioUri,
    notice: 'Speech-to-text prototype: microphone permission and recording flow are wired; on-device ASR is still pending.',
  };
}

export function createOcrPrototypeResult({
  languageCode,
  imageUri,
}: {
  languageCode: string;
  imageUri?: string | null;
}): RecognitionPrototypeResult {
  const text = PROTOTYPE_OCR_TEXT_BY_LANGUAGE[languageCode] ?? PROTOTYPE_OCR_TEXT_BY_LANGUAGE.en;

  return {
    kind: 'ocr',
    text,
    suggestions: splitRecognitionSuggestions(text),
    confidence: 0.68,
    localUri: imageUri,
    notice: 'OCR prototype: image permission and picker flow are wired; on-device text extraction is still pending.',
  };
}
