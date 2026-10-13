import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords, hasMonolingualDictionarySource } from '../data/dictionaryApi';
import { getLocalDictionaryEntries } from '../data/localLexicon';
import { LOCAL_PACK_SOURCES, lookupLocalPackMeaning, lookupLocalPackRelatedWords } from '../data/localPackDictionarySources';

describe('local pack source registry', () => {
  it('gives every bundled language attribution and at least one entry', () => {
    for (const source of Object.values(LOCAL_PACK_SOURCES)) {
      expect(source.source, source.languageCode).toMatch(source.kind === 'wiktionary' ? /wiktionary/ : /local-fixture/);
      expect(getLocalDictionaryEntries(source.languageCode).length, source.languageCode).toBeGreaterThan(0);
    }
  });

  it('serves each pack through the shared dictionary entry points', async () => {
    for (const code of Object.keys(LOCAL_PACK_SOURCES)) {
      const [entry] = getLocalDictionaryEntries(code);
      const result = await fetchMonolingualMeaning(entry.word, code);
      expect(result.word, code).toBe(entry.word);
      expect(result.definitions.every((definition) => definition.source === LOCAL_PACK_SOURCES[code].source), code).toBe(true);
      await expect(fetchRelatedWords(entry.word, code)).resolves.toEqual({
        antonyms: entry.antonyms ?? [],
        synonyms: entry.synonyms ?? [],
      });
    }
  });

  it('keeps licence text on CC BY-SA packs', async () => {
    const [entry] = getLocalDictionaryEntries('hi');
    await expect(lookupLocalPackMeaning('hi', entry.word)).resolves.toMatchObject({ source: 'hiwiktionary · CC BY-SA 4.0' });
  });

  it('rejects input in the wrong script before looking it up', async () => {
    await expect(lookupLocalPackMeaning('hi', 'hello')).rejects.toThrow('No Hindi Wiktionary meanings found for "hello".');
  });

  it('names fixtures as fixtures in errors', async () => {
    await expect(lookupLocalPackMeaning('haw', 'zzzz')).rejects.toThrow('No Hawaiian local fixture meanings found');
  });

  it('returns empty related words for unknown words and languages', async () => {
    await expect(lookupLocalPackRelatedWords('ja', 'zzzz')).resolves.toEqual({ antonyms: [], synonyms: [] });
    await expect(lookupLocalPackRelatedWords('xx', 'zzzz')).resolves.toEqual({ antonyms: [], synonyms: [] });
  });

  it('reports which languages have a monolingual source', () => {
    expect(hasMonolingualDictionarySource('en')).toBe(true);
    expect(hasMonolingualDictionarySource('ja')).toBe(true);
    expect(hasMonolingualDictionarySource('pt')).toBe(false);
  });
});
