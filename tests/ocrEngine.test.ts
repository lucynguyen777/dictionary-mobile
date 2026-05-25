import { describe, expect, it } from 'vitest';

import {
  OcrEngineUnavailableError,
  createDeterministicOcrResult,
  createUnavailableNativeOcrEngine,
  extractOcrLookupCandidates,
  normalizeOcrText,
  runOcrEngine,
} from '../data/ocrEngine';

describe('OCR engine boundary', () => {
  it('normalizes OCR text while preserving native scripts', () => {
    expect(normalizeOcrText('  tra   từ điển \n\n học   mỗi ngày  ')).toBe('tra từ điển\nhọc mỗi ngày');
    expect(normalizeOcrText('\u200Bघर   किताब\n हिंदी')).toBe('घर किताब\nहिंदी');
  });

  it('creates deterministic OCR blocks and lookup candidates without native OCR', () => {
    const result = createDeterministicOcrResult({
      imageUri: 'file:///capture.jpg',
      languageCode: 'hi',
    });

    expect(result.engine).toBe('deterministic-fixture');
    expect(result.imageUri).toBe('file:///capture.jpg');
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].lines[0]).toMatchObject({
      id: 'block-1-line-1',
      text: 'घर किताब',
      confidence: 0.7,
    });
    expect(result.blocks[0].lines[0].boundingBox).toMatchObject({
      x: 0.06,
      width: 0.82,
    });

    expect(extractOcrLookupCandidates(result)).toEqual([
      'घर किताब हिंदी करना',
      'घर किताब',
      'हिंदी करना',
      'घर',
      'किताब',
      'हिंदी',
      'करना',
    ]);
  });

  it('reports unavailable native engines through a stable error type', async () => {
    const engine = createUnavailableNativeOcrEngine();

    await expect(runOcrEngine(engine, { imageUri: 'file:///capture.jpg', languageCode: 'en' })).rejects.toBeInstanceOf(
      OcrEngineUnavailableError
    );
  });
});
