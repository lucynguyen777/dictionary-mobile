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

describe('Turkish monolingual baseline and morphology', () => {

  it('looks up exact monolingual nouns and verbs', async () => {
    const ev = await fetchMonolingualMeaning('ev', 'tr');
    expect(ev.word).toBe('ev');
    expect(ev.ipa).toBe('/ev/');
    expect(ev.definitions[0].meaning).toContain('İçinde yaşamak için yapılmış bina');
    expect(ev.definitions[0].vietnamese).toBe('Nhà, công trình xây dựng để ở.');

    const yemek = await fetchMonolingualMeaning('yemek', 'tr');
    expect(yemek.word).toBe('yemek');
    expect(yemek.ipa).toBe('/jeˈmec/');
    expect(yemek.definitions[0].meaning).toContain('Yenmek için hazırlanmış yiyecek');
  });

  it('resolves inflected forms using local morphology fallback', async () => {
    // Locative (evde -> ev)
    const evde = await fetchMonolingualMeaning('evde', 'tr');
    expect(evde.word).toBe('ev');
    expect(evde.source).toContain('base form of evde');

    // Plural (yemekler -> yemek)
    const yemekler = await fetchMonolingualMeaning('yemekler', 'tr');
    expect(yemekler.word).toBe('yemek');
    expect(yemekler.source).toContain('base form of yemekler');

    // Verb 1sg (yerim -> yemek)
    const yerim = await fetchMonolingualMeaning('yerim', 'tr');
    expect(yerim.word).toBe('yemek');
    expect(yerim.source).toContain('base form of yerim');

    // Verb past 3sg (yedi -> yemek)
    const yedi = await fetchMonolingualMeaning('yedi', 'tr');
    expect(yedi.word).toBe('yemek');
    expect(yedi.source).toContain('base form of yedi');
  });

  it('resolves dative/accusative with consonant gradation (yemeğe -> yemek, ışığa -> ışık)', async () => {
    const yemege = await fetchMonolingualMeaning('yemeğe', 'tr');
    expect(yemege.word).toBe('yemek');

    const isiga = await fetchMonolingualMeaning('ışığa', 'tr');
    expect(isiga.word).toBe('ışık');
  });

  it('preserves and normalizes dotted and dotless I correctly', async () => {
    const isikLower = await fetchMonolingualMeaning('ışık', 'tr');
    expect(isikLower.word).toBe('ışık');

    const isikUpper = await fetchMonolingualMeaning('IŞIK', 'tr');
    expect(isikUpper.word).toBe('ışık');

    const istanbulDotted = await fetchMonolingualMeaning('İstanbul', 'tr');
    expect(istanbulDotted.word).toBe('İstanbul');
  });

  it('strips proper noun apostrophes and case suffixes', async () => {
    const istanbulDa = await fetchMonolingualMeaning("İstanbul'da", 'tr');
    expect(istanbulDa.word).toBe('İstanbul');

    const istanbulA = await fetchMonolingualMeaning("İstanbul'a", 'tr');
    expect(istanbulA.word).toBe('İstanbul');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('ev', 'tr');
    expect(related.synonyms).toContain('konut');
    expect(related.synonyms).toContain('hane');
  });
});

describe('Japanese monolingual baseline and morphology', () => {

  it('looks up exact monolingual nouns and verbs', async () => {
    const neko = await fetchMonolingualMeaning('猫', 'ja');
    expect(neko.word).toBe('猫');
    expect(neko.ipa).toBe('/neko/');
    expect(neko.definitions[0].meaning).toContain('ネコ科の小型哺乳類');
    expect(neko.definitions[0].vietnamese).toBe('Con mèo. Động vật có vú nhỏ thuộc họ mèo, được nuôi rộng rãi làm thú cưng.');

    const taberuKana = await fetchMonolingualMeaning('たべる', 'ja');
    expect(taberuKana.word).toBe('たべる');
    expect(taberuKana.definitions[0].meaning).toContain('食物を口に入れ、噛み砕いて胃に送り込む');

    const taberuKanji = await fetchMonolingualMeaning('食べる', 'ja');
    expect(taberuKanji.word).toBe('食べる');
  });

  it('resolves inflected forms using local morphology fallback', async () => {
    // Past (食べた -> 食べる)
    const tabeta = await fetchMonolingualMeaning('食べた', 'ja');
    expect(tabeta.word).toBe('食べる');
    expect(tabeta.source).toContain('base form of 食べた');

    // Negative (食べない -> 食べる)
    const tabenai = await fetchMonolingualMeaning('食べない', 'ja');
    expect(tabenai.word).toBe('食べる');

    // Polite (食べます -> 食べる)
    const tabemasu = await fetchMonolingualMeaning('食べます', 'ja');
    expect(tabemasu.word).toBe('食べる');

    // Te-form (食べて -> 食べる)
    const tabete = await fetchMonolingualMeaning('食べて', 'ja');
    expect(tabete.word).toBe('食べる');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('猫', 'ja');
    expect(related.synonyms).toContain('ねこ');
    expect(related.synonyms).toContain('キャット');
  });
});
