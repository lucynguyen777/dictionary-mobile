import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdapterByKey, getAdapterForLanguage, lookupBilingual, lookupMonolingual, lookupRelatedWords } from '../data/adapterRegistry';
import * as dictApi from '../data/dictionaryApi';
import * as offlineLookup from '../data/offlineDictionaryRuntimeLookup';

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
  const mockFetchEstonianMeaning = vi.fn(async (word: string) => ({
    word: `${word}-mock`,
    ipa: '',
    audio: '',
    definitions: [],
    source: 'et',
  }));
  const mockFetchEstonianRelated = vi.fn(async (word: string) => ({ synonyms: ['s1'], antonyms: ['a1'] }));
  const mockFetchMinhQndRelated = vi.fn(async (word: string) => ({ synonyms: ['s1'], antonyms: ['a1'] }));
  const mockFetchWiktApiRelated = vi.fn(async (word: string) => ({ synonyms: ['s1'], antonyms: ['a1'] }));

  const mockFetchVietnameseSuggestions = vi.fn(async (q: string) => ['g1', 'g2']);

  return {
    fetchEnglishMeaning: mockFetchEnglishMeaning,
    fetchEstonianMeaning: mockFetchEstonianMeaning,
    fetchMinhQndMonolingualMeaning: mockFetchMinhQndMonolingual,
    fetchWiktApiMonolingualMeaning: mockFetchWiktApiMonolingual,
    fetchBilingualMeaning: mockFetchBilingualMeaning,
    fetchEnglishRelatedWords: mockFetchEnglishRelated,
    fetchEstonianRelatedWords: mockFetchEstonianRelated,
    fetchMinhQndRelatedWords: mockFetchMinhQndRelated,
    fetchWiktApiRelatedWords: mockFetchWiktApiRelated,
    fetchVietnameseSuggestions: mockFetchVietnameseSuggestions,
  };
});

vi.mock('../data/offlineDictionaryRuntimeLookup', () => ({
  fetchOfflineMonolingualMeaning: vi.fn(async () => null),
  fetchOfflineRelatedWords: vi.fn(async () => null),
}));

describe('adapterRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers core adapters and source adapters', () => {
    const en = getAdapterByKey('en');
    const viAdapter = getAdapterByKey('vi');
    const etAdapter = getAdapterByKey('et');
    const trAdapter = getAdapterByKey('tr');
    const uzAdapter = getAdapterByKey('uz');
    const kkAdapter = getAdapterByKey('kk');
    const minh = getAdapterByKey('minhqnd');
    const wikt = getAdapterByKey('wiktapi');

    expect(en).toBeDefined();
    expect(viAdapter).toBeDefined();
    expect(etAdapter).toBeDefined();
    expect(trAdapter).toBeDefined();
    expect(uzAdapter).toBeDefined();
    expect(kkAdapter).toBeDefined();
    expect(minh).toBeDefined();
    expect(wikt).toBeDefined();

    expect(en?.key).toBe('en');
    expect(viAdapter?.key).toBe('vi');
    expect(etAdapter?.key).toBe('et');
    expect(trAdapter?.key).toBe('tr');
    expect(uzAdapter?.key).toBe('uz');
    expect(kkAdapter?.key).toBe('kk');
    expect(minh?.key).toBe('minhqnd');
    expect(wikt?.key).toBe('wiktapi');
  });

  it('lookupMonolingual delegates to dictionaryApi', async () => {
    const result = await lookupMonolingual('hello', 'vi');

    expect((offlineLookup as any).fetchOfflineMonolingualMeaning).toHaveBeenCalledWith('hello', 'vi');
    expect(result.word).toBe('hello-mock');
    expect((dictApi as any).fetchMinhQndMonolingualMeaning).toHaveBeenCalledWith('hello', 'vi');
  });

  it('lookupMonolingual prefers ready offline packs before dictionaryApi', async () => {
    vi.mocked(offlineLookup.fetchOfflineMonolingualMeaning).mockResolvedValueOnce({
      audio: '',
      definitions: [],
      ipa: '',
      source: 'offline pack',
      word: 'Book',
    });

    const result = await lookupMonolingual('book', 'en');

    expect(result.source).toBe('offline pack');
    expect((dictApi as any).fetchEnglishMeaning).not.toHaveBeenCalled();
  });

  it('lookupRelatedWords prefers offline related words before dictionaryApi', async () => {
    vi.mocked(offlineLookup.fetchOfflineRelatedWords).mockResolvedValueOnce({
      antonyms: ['scroll'],
      synonyms: ['volume'],
    });

    const result = await lookupRelatedWords('book', 'en');

    expect(result).toEqual({
      antonyms: ['scroll'],
      synonyms: ['volume'],
    });
    expect((dictApi as any).fetchEnglishRelatedWords).not.toHaveBeenCalled();
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
