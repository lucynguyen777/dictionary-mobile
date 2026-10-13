import { describe, expect, it } from 'vitest';

import { getExampleTranslationLabel } from '../data/exampleTranslationLabel';
import { sanitizeOfflinePackEntry } from '../data/offlineDictionaryPackActions';
import { mapOfflineEntryToApiMeaning } from '../data/offlineDictionaryLookup';

describe('example translation labels (D12)', () => {
  const englishAid = {
    helperSource: 'enwiktionary',
    source: '本を読みます。',
    translation: 'I read a book.',
    translationLanguage: 'en',
  };

  it('marks an English aid translation as English and credits English Wiktionary', () => {
    for (const target of ['ja', 'vi']) {
      expect(getExampleTranslationLabel(englishAid, target)).toEqual({
        accessibilityLabel: 'Bản dịch tiếng Anh: I read a book.',
        badge: 'EN · ',
        caption: 'Bản dịch tiếng Anh · ví dụ từ Wiktionary tiếng Anh',
      });
    }
  });

  it('needs no badge when the translation is already in the target language', () => {
    expect(getExampleTranslationLabel({ source: 'nhà gạch', translation: 'Maison en briques', translationLanguage: 'fr' }, 'fr')).toEqual({
      accessibilityLabel: null,
      badge: null,
      caption: null,
    });
  });

  it('leaves legacy unmarked translations alone and still credits helper sentences without translations', () => {
    expect(getExampleTranslationLabel({ source: 'I read a book.', translation: 'Tôi đọc một cuốn sách.' }, 'vi').badge).toBeNull();
    expect(getExampleTranslationLabel({ helperSource: 'enwiktionary', source: '雨が降る。' }, 'ja')).toEqual({
      accessibilityLabel: null,
      badge: null,
      caption: 'Ví dụ từ Wiktionary tiếng Anh',
    });
  });

  it('keeps the language marker and helper credit from a downloaded pack through to the meaning result', () => {
    const entry = sanitizeOfflinePackEntry({
      attribution: 'Source: jawiktionary (CC-BY-SA-4.0/GFDL); examples also from enwiktionary (CC-BY-SA-4.0/GFDL)',
      definitions: [{ gloss: '書物。' }],
      examples: [
        englishAid,
        // A language marker without a translation, or a malformed one, is dropped.
        { helperSource: 'enwiktionary', source: '雨が降る。', translationLanguage: 'en' },
        { source: '本だ。', translation: 'It is a book.', translationLanguage: 'English!' },
      ],
      langCode: 'ja',
      license: 'CC-BY-SA-4.0/GFDL',
      word: '本',
    }, 'ja');

    expect(entry?.examples).toEqual([
      englishAid,
      { helperSource: 'enwiktionary', source: '雨が降る。' },
      { source: '本だ。', translation: 'It is a book.' },
    ]);

    const meaning = mapOfflineEntryToApiMeaning({ entry: entry!, matchType: 'exact', matchedLookupKey: '本', requestedWord: '本' });
    expect(meaning.definitions[0].examples[0]).toEqual(englishAid);
    expect(meaning.definitions[0].source).toContain('examples also from enwiktionary');
  });
});
