import {
  OcrEngineResult,
  createDeterministicOcrResult,
  extractOcrLookupCandidates,
} from './ocrEngine';

export type RecognitionKind = 'speech' | 'ocr';
export type RecognitionEngineStatus = 'prototype' | 'native-unavailable' | 'native-ready';

export type RecognitionPrototypeResult = {
  kind: RecognitionKind;
  text: string;
  suggestions: string[];
  confidence: number;
  localUri?: string | null;
  notice: string;
  engineStatus?: RecognitionEngineStatus;
  ocrResult?: OcrEngineResult;
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
  ocrResult = createDeterministicOcrResult({ languageCode, imageUri }),
}: {
  languageCode: string;
  imageUri?: string | null;
  ocrResult?: OcrEngineResult;
}): RecognitionPrototypeResult {
  const suggestions = extractOcrLookupCandidates(ocrResult);

  return {
    kind: 'ocr',
    text: ocrResult.text,
    suggestions,
    confidence: ocrResult.confidence ?? 0,
    localUri: imageUri,
    notice: 'OCR readiness: capture stays local; native text extraction is gated behind a dev-client OCR engine.',
    engineStatus: ocrResult.engine === 'native' ? 'native-ready' : 'native-unavailable',
    ocrResult,
  };
}
