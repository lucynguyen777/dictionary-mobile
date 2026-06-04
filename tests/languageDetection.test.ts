import { describe, expect, it } from 'vitest';

import { detectLookupSourceLanguage } from '../data/languageDetection';

describe('detectLookupSourceLanguage', () => {
  it('detects script-first languages with high confidence', () => {
    expect(detectLookupSourceLanguage('كتاب', 'en')).toMatchObject({ confidence: 'high', languageCode: 'ar' });
    expect(detectLookupSourceLanguage('שלום', 'en')).toMatchObject({ confidence: 'high', languageCode: 'he' });
    expect(detectLookupSourceLanguage('घर', 'en')).toMatchObject({ confidence: 'high', languageCode: 'hi' });
    expect(detectLookupSourceLanguage('猫', 'en')).toMatchObject({ confidence: 'high', languageCode: 'zh' });
    expect(detectLookupSourceLanguage('たべる', 'en')).toMatchObject({ confidence: 'high', languageCode: 'ja' });
    expect(detectLookupSourceLanguage('사랑', 'en')).toMatchObject({ confidence: 'high', languageCode: 'ko' });
  });

  it('detects Vietnamese diacritics before Latin dictionary fallback', () => {
    expect(detectLookupSourceLanguage('tiếng Việt', 'en')).toMatchObject({
      confidence: 'high',
      languageCode: 'vi',
    });
  });

  it('keeps the current source for low-confidence input', () => {
    expect(detectLookupSourceLanguage('xyz-not-a-word', 'en')).toMatchObject({
      confidence: 'low',
      languageCode: 'en',
    });
  });
});
