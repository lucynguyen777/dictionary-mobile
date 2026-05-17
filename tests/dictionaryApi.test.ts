import { describe, expect, it } from 'vitest';

import { canUseBilingualDictionaryApi, isBlockedBilingualDictionaryPair } from '../data/dictionaryApi';
import { isSupportedBilingualDictionaryPair, isTranslationComingSoonPair } from '../data/languages';

describe('dictionaryApi bilingual source selection', () => {
  it('allows French to Vietnamese because MinhQnd has lexical dictionary data', () => {
    expect(isBlockedBilingualDictionaryPair('fr', 'vi')).toBe(false);
    expect(canUseBilingualDictionaryApi('fr', 'vi')).toBe(true);
    expect(isSupportedBilingualDictionaryPair('fr', 'vi')).toBe(true);
    expect(isTranslationComingSoonPair('fr', 'vi')).toBe(false);
  });

  it('keeps Vietnamese to French blocked until a dictionary source is selected', () => {
    expect(isBlockedBilingualDictionaryPair('vi', 'fr')).toBe(true);
    expect(canUseBilingualDictionaryApi('vi', 'fr')).toBe(false);
    expect(isSupportedBilingualDictionaryPair('vi', 'fr')).toBe(false);
    expect(isTranslationComingSoonPair('vi', 'fr')).toBe(true);
  });

  it('does not route unsupported bilingual pairs to the bilingual API', () => {
    expect(canUseBilingualDictionaryApi('en', 'ja')).toBe(false);
    expect(canUseBilingualDictionaryApi('ja', 'vi')).toBe(false);
    expect(isSupportedBilingualDictionaryPair('en', 'ja')).toBe(false);
    expect(isTranslationComingSoonPair('ja', 'vi')).toBe(true);
  });
});
