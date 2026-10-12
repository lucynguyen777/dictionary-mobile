import { describe, expect, it } from 'vitest';

import { getDefinitionTranslationTarget, toDeepLTargetLanguage } from '../data/translationTargets';

describe('getDefinitionTranslationTarget', () => {
  it.each([
    ['en', 'vi', 'vi', 'VI'],
    ['vi', 'en', 'vi', 'EN-US'],
    ['fr', 'vi', 'vi', 'VI'],
    ['en', 'en', 'vi', 'VI'],
    ['ja', 'ja', 'en', 'EN-US'],
    ['vi', 'vi', 'vi', null],
    ['en', 'sw', 'vi', null],
  ])('%s -> %s (native %s) translates into %s', (source, target, native, expected) => {
    expect(getDefinitionTranslationTarget(source, target, native)).toBe(expected);
  });
});

describe('toDeepLTargetLanguage', () => {
  it('uses regional codes DeepL requires for English and Portuguese', () => {
    expect(toDeepLTargetLanguage('en')).toBe('EN-US');
    expect(toDeepLTargetLanguage('pt')).toBe('PT-BR');
    expect(toDeepLTargetLanguage('yo')).toBeNull();
  });
});

describe('toDeepLSourceLanguage', () => {
  it('drops regional suffixes and skips unsupported languages', async () => {
    const { toDeepLSourceLanguage } = await import('../data/translationTargets');
    expect(toDeepLSourceLanguage('en')).toBe('EN');
    expect(toDeepLSourceLanguage('zh')).toBe('ZH');
    expect(toDeepLSourceLanguage('sw')).toBeUndefined();
  });
});
