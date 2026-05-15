import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdapterByKey, getAdapterForLanguage, lookupBilingual, lookupMonolingual } from '../data/adapterRegistry';
import * as dictApi from '../data/dictionaryApi';

vi.mock('../data/dictionaryApi', () => {
  const mockFetchEnglishMeaning = vi.fn(async (word: string) => ({
    word: `${word}-mock`,
    ipa: '',
    audio: '',
    definitions: [],
    source: 'en',
  }));

  const mockFetchMinhQndMonolingual = vi.fn(async (word: string) => ({
    word: `${word}-mock`,
    ipa: '',
    audio: '',
    definitions: [],
    source: 'vi',
  }));

  const mockFetchWiktApiMonolingual = vi.fn(async (word: string) => ({
    word: `${word}-mock`,
    ipa: '',
    audio: '',
    definitions: [],
    source: 'fr',
  }));

  const mockFetchBilingualMeaning = vi.fn(async (word: string, sourceLang: string, targetLang: string) => ({
    word,
    ipa: '',
    audio: '',
    definitions: [],
    translations: ['t-mock'],
    source: `${sourceLang}->${targetLang}`,
  }));

  const mockFetchEnglishRelated = vi.fn(async (word: string) => ({ synonyms: ['s1'], antonyms: ['a1'] }));
  const mockFetchMinhQndRelated = vi.fn(async (word: string) => ({ synonyms: ['s1'], antonyms: ['a1'] }));
  const mockFetchWiktApiRelated = vi.fn(async (word: string) => ({ synonyms: ['s1'], antonyms: ['a1'] }));

  const mockFetchVietnameseSuggestions = vi.fn(async (q: string) => ['g1', 'g2']);

  return {
    fetchEnglishMeaning: mockFetchEnglishMeaning,
    fetchMinhQndMonolingualMeaning: mockFetchMinhQndMonolingual,
    fetchWiktApiMonolingualMeaning: mockFetchWiktApiMonolingual,
    fetchBilingualMeaning: mockFetchBilingualMeaning,
    fetchEnglishRelatedWords: mockFetchEnglishRelated,
    fetchMinhQndRelatedWords: mockFetchMinhQndRelated,
    fetchWiktApiRelatedWords: mockFetchWiktApiRelated,
    fetchVietnameseSuggestions: mockFetchVietnameseSuggestions,
  };
});

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
    expect((dictApi as any).fetchMinhQndMonolingualMeaning).toHaveBeenCalledWith('hello', 'vi');
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
