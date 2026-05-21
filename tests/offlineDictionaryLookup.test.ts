import { describe, expect, it } from 'vitest';
import {
  OfflineDictionaryEntry,
  findOfflineDictionaryEntry,
  getOfflineLookupCandidates,
  getOfflineRelatedWords,
  mapOfflineEntryToApiMeaning,
  normalizeOfflineLookupKey,
} from '../data/offlineDictionaryLookup';

const offlineEntries: OfflineDictionaryEntry[] = [
  {
    attribution: 'Source: enwiktionary (CC-BY-SA-4.0/GFDL)',
    audio: ['book.mp3'],
    definitions: [
      {
        gloss: 'A set of written or printed pages.',
        tags: ['countable'],
        topics: ['education'],
      },
    ],
    etymology: '',
    examples: [{ source: 'I read a book.', translation: 'Tôi đọc một cuốn sách.' }],
    id: 'en:book',
    ipa: '/bʊk/',
    langCode: 'en',
    license: 'CC-BY-SA-4.0/GFDL',
    normalizedWord: 'book',
    partOfSpeech: 'noun',
    relations: {
      antonyms: [],
      synonyms: ['volume'],
    },
    sourceName: 'enwiktionary',
    sourceUrl: 'https://kaikki.org/dictionary/rawdata.html',
    updatedAt: '2026-05-21T00:00:00.000Z',
    word: 'Book',
  },
];

describe('offlineDictionaryLookup', () => {
  it('normalizes lookup keys consistently with the pack builder', () => {
    expect(normalizeOfflineLookupKey('  Book  ')).toBe('book');
  });

  it('finds exact offline pack entries by normalized word', () => {
    const result = findOfflineDictionaryEntry(offlineEntries, 'BOOK', 'en');

    expect(result).toMatchObject({
      matchType: 'exact',
      matchedLookupKey: 'book',
      requestedWord: 'book',
    });
    expect(result?.entry.word).toBe('Book');
  });

  it('uses morphology candidates before returning a missing offline result', () => {
    expect(getOfflineLookupCandidates('books', 'en')).toContain('book');

    const result = findOfflineDictionaryEntry(offlineEntries, 'books', 'en');

    expect(result).toMatchObject({
      matchType: 'morphology',
      matchedLookupKey: 'book',
      requestedWord: 'books',
    });
  });

  it('keeps lookup scoped to the requested language pack', () => {
    expect(findOfflineDictionaryEntry(offlineEntries, 'book', 'fr')).toBeNull();
    expect(findOfflineDictionaryEntry(offlineEntries, 'missing', 'en')).toBeNull();
  });

  it('maps offline entries into the current API meaning contract', () => {
    const result = findOfflineDictionaryEntry(offlineEntries, 'books', 'en');

    expect(result).not.toBeNull();
    expect(mapOfflineEntryToApiMeaning(result!)).toEqual({
      audio: 'book.mp3',
      definitions: [
        {
          antonyms: [],
          domain: 'education',
          examples: [{ source: 'I read a book.', translation: 'Tôi đọc một cuốn sách.' }],
          meaning: 'A set of written or printed pages.',
          partOfSpeech: 'noun',
          source: 'Source: enwiktionary (CC-BY-SA-4.0/GFDL)',
          synonyms: ['volume'],
        },
      ],
      ipa: '/bʊk/',
      source: 'enwiktionary offline pack · base form of books',
      word: 'Book',
    });
  });

  it('maps offline relations for related-word UI reuse', () => {
    const result = findOfflineDictionaryEntry(offlineEntries, 'book', 'en');

    expect(result).not.toBeNull();
    expect(getOfflineRelatedWords(result!)).toEqual({
      antonyms: [],
      synonyms: ['volume'],
    });
  });
});
