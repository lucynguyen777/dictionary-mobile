import { describe, expect, it } from 'vitest';

import {
  canUseBilingualDictionaryApi,
  isBlockedBilingualDictionaryPair,
  fetchMonolingualMeaning,
  fetchRelatedWords,
} from '../data/dictionaryApi';
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

describe('Finnish monolingual baseline and morphology', () => {

  it('looks up exact monolingual nouns and verbs', async () => {
    const talo = await fetchMonolingualMeaning('talo', 'fi');
    expect(talo.word).toBe('talo');
    expect(talo.ipa).toBe('/ˈtɑlo/');
    expect(talo.definitions[0].meaning).toContain('Asumiseen tarkoitettu rakennus');
    expect(talo.definitions[0].vietnamese).toBe('Nhà, công trình xây dựng để ở.');

    const syoda = await fetchMonolingualMeaning('syödä', 'fi');
    expect(syoda.word).toBe('syödä');
    expect(syoda.ipa).toBe('/ˈsyø̯dæ/');
    expect(syoda.definitions[0].meaning).toContain('Pureskella ja niellä ruokaa');
  });

  it('resolves inflected forms using local morphology fallback', async () => {
    // Inessive (talossa -> talo)
    const talossa = await fetchMonolingualMeaning('talossa', 'fi');
    expect(talossa.word).toBe('talo');
    expect(talossa.source).toContain('base form of talossa');

    // 1sg verb (syön -> syödä)
    const syon = await fetchMonolingualMeaning('syön', 'fi');
    expect(syon.word).toBe('syödä');
    expect(syon.source).toContain('base form of syön');
  });

  it('preserves native letters and gradation (kädessä -> käsi, yötä -> yö)', async () => {
    const kasi = await fetchMonolingualMeaning('käsi', 'fi');
    expect(kasi.word).toBe('käsi');

    const kadessa = await fetchMonolingualMeaning('kädessä', 'fi');
    expect(kadessa.word).toBe('käsi');

    const yota = await fetchMonolingualMeaning('yötä', 'fi');
    expect(yota.word).toBe('yö');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('talo', 'fi');
    expect(related.synonyms).toContain('koti');
    expect(related.synonyms).toContain('rakennus');
  });
});
