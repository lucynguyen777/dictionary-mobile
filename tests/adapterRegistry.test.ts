import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../data/dictionaryApi', () => {
  const mockFetchMonolingualMeaning = vi.fn(async (word: string, lang?: string) => ({
    word: `${word}-mock`,
    ipa: '',
    audio: '',
    definitions: [],
    source: lang ?? 'mock',
  }));

  const mockFetchBilingualMeaning = vi.fn(async (word: string, sourceLang: string, targetLang: string) => ({
    word,
    ipa: '',
    audio: '',
    definitions: [],
    translations: ['t-mock'],
    source: `${sourceLang}->${targetLang}`,
  }));

  const mockFetchRelatedWords = vi.fn(async (word: string, lang?: string) => ({
    synonyms: ['s1'],
    antonyms: ['a1'],
  }));

  const mockFetchVietnameseSuggestions = vi.fn(async (q: string) => ['g1', 'g2']);

  return {
    fetchMonolingualMeaning: mockFetchMonolingualMeaning,
    fetchBilingualMeaning: mockFetchBilingualMeaning,
    fetchRelatedWords: mockFetchRelatedWords,
    fetchVietnameseSuggestions: mockFetchVietnameseSuggestions,
  };
});

import { getAdapterByKey, getAdapterForLanguage, lookupBilingual, lookupMonolingual } from '../data/adapterRegistry';
import * as dictApi from '../data/dictionaryApi';

describe('adapterRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers core adapters and source adapters', () => {
    const en = getAdapterByKey('en');
    const viAdapter = getAdapterByKey('vi');
    const minh = getAdapterByKey('minhqnd');
    const wikt = getAdapterByKey('wiktapi');

    expect(en).toBeDefined();
    expect(viAdapter).toBeDefined();
    expect(minh).toBeDefined();
    expect(wikt).toBeDefined();

    expect(en?.key).toBe('en');
    expect(viAdapter?.key).toBe('vi');
    expect(minh?.key).toBe('minhqnd');
    expect(wikt?.key).toBe('wiktapi');
  });

  it('lookupMonolingual delegates to dictionaryApi', async () => {
    const result = await lookupMonolingual('hello', 'vi');

    expect(result.word).toBe('hello-mock');
    expect((dictApi as any).fetchMonolingualMeaning).toHaveBeenCalledWith('hello', 'vi');
  });

  it('lookupBilingual delegates to dictionaryApi', async () => {
    const result = await lookupBilingual('bonjour', 'fr', 'en');

    expect(result.translations).toContain('t-mock');
    expect((dictApi as any).fetchBilingualMeaning).toHaveBeenCalledWith('bonjour', 'fr', 'en');
  });

  it('getAdapterForLanguage falls back to adapterKey mapping', () => {
    const adapter = getAdapterForLanguage('vi');
    expect(adapter.key).toBe('vi');
  });
});
