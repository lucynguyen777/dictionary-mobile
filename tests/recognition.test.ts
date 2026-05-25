import { describe, expect, it } from 'vitest';

import {
  createOcrPrototypeResult,
  createSpeechToTextPrototypeResult,
  normalizeRecognizedLookupText,
  splitRecognitionSuggestions,
} from '../data/recognition';

describe('recognition prototype utilities', () => {
  it('normalizes recognized text without romanizing native scripts', () => {
    expect(normalizeRecognizedLookupText('  học   tiếng   Việt  ')).toBe('học tiếng Việt');
    expect(normalizeRecognizedLookupText('\u200B猫   食べる')).toBe('猫 食べる');
    expect(normalizeRecognizedLookupText('  שלום   בית  ')).toBe('שלום בית');
  });

  it('creates lookup suggestions from full OCR text and individual tokens', () => {
    expect(splitRecognitionSuggestions('articulate clearly, today')).toEqual([
      'articulate clearly, today',
      'articulate',
      'clearly',
      'today',
    ]);
  });

  it('returns deterministic speech prototype output for selected languages', () => {
    const result = createSpeechToTextPrototypeResult({ languageCode: 'vi', audioUri: 'file:///voice.m4a' });

    expect(result.kind).toBe('speech');
    expect(result.text).toBe('từ điển');
    expect(result.suggestions).toContain('từ điển');
    expect(result.localUri).toBe('file:///voice.m4a');
    expect(result.notice).toContain('prototype');
  });

  it('returns deterministic OCR prototype output and token suggestions', () => {
    const result = createOcrPrototypeResult({ languageCode: 'ja', imageUri: 'file:///image.jpg' });

    expect(result.kind).toBe('ocr');
    expect(result.text).toBe('猫 食べる\n本');
    expect(result.suggestions).toEqual(['猫 食べる 本', '猫 食べる', '本', '食べる']);
    expect(result.localUri).toBe('file:///image.jpg');
    expect(result.engineStatus).toBe('native-unavailable');
    expect(result.notice).toContain('dev-client OCR engine');
  });
});
