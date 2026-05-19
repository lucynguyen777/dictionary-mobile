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

describe('Korean monolingual baseline and morphology', () => {

  it('looks up exact monolingual nouns and verbs', async () => {
    const sarang = await fetchMonolingualMeaning('사랑', 'ko');
    expect(sarang.word).toBe('사랑');
    expect(sarang.ipa).toBe('/saːraŋ/');
    expect(sarang.definitions[0].meaning).toContain('아끼고 귀중히 여기는 마음');
    expect(sarang.definitions[0].vietnamese).toBe('Tình yêu, lòng yêu thương. Cảm xúc trân trọng, nâng niu một người hoặc đối tượng nào đó.');

    const meokda = await fetchMonolingualMeaning('먹다', 'ko');
    expect(meokda.word).toBe('먹다');
    expect(meokda.definitions[0].meaning).toContain('음식 따위를 입을 통해 위로 들여보내다');
  });

  it('resolves inflected nouns (particles) using local morphology fallback', async () => {
    // Topic particle (사랑은 -> 사랑)
    const sarangEun = await fetchMonolingualMeaning('사랑은', 'ko');
    expect(sarangEun.word).toBe('사랑');
    expect(sarangEun.source).toContain('base form of 사랑은');

    // Subject particle (사랑이 -> 사랑)
    const sarangI = await fetchMonolingualMeaning('사랑이', 'ko');
    expect(sarangI.word).toBe('사랑');

    // Genitive particle (사랑의 -> 사랑)
    const sarangUi = await fetchMonolingualMeaning('사랑의', 'ko');
    expect(sarangUi.word).toBe('사랑');
  });

  it('resolves inflected verbs using local morphology fallback', async () => {
    // Informal present (먹어 -> 먹다)
    const meogeo = await fetchMonolingualMeaning('먹어', 'ko');
    expect(meogeo.word).toBe('먹다');

    // Polite present (먹어요 -> 먹다)
    const meogeoyo = await fetchMonolingualMeaning('먹어요', 'ko');
    expect(meogeoyo.word).toBe('먹다');

    // Formal present (먹습니다 -> 먹다)
    const meokseumnida = await fetchMonolingualMeaning('먹습니다', 'ko');
    expect(meokseumnida.word).toBe('먹다');

    // Past (먹었다 -> 먹다)
    const meogeotda = await fetchMonolingualMeaning('먹었다', 'ko');
    expect(meogeotda.word).toBe('먹다');

    // Connective (먹고 -> 먹다)
    const meokgo = await fetchMonolingualMeaning('먹고', 'ko');
    expect(meokgo.word).toBe('먹다');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('사랑', 'ko');
    expect(related.synonyms).toContain('애정');
    expect(related.synonyms).toContain('연애');
    expect(related.antonyms).toContain('미움');
    expect(related.antonyms).toContain('증오');
  });
});

describe('Swahili monolingual baseline and morphology', () => {

  it('looks up exact monolingual nouns and verbs', async () => {
    const mtu = await fetchMonolingualMeaning('mtu', 'sw');
    expect(mtu.word).toBe('mtu');
    expect(mtu.ipa).toBe('/m.tu/');
    expect(mtu.definitions[0].meaning).toContain('Kiumbe hai mwenye akili');
    expect(mtu.definitions[0].vietnamese).toBe('Người, con người. Thực thể sống có tư duy và nhận thức, khác biệt với động vật.');

    const penda = await fetchMonolingualMeaning('penda', 'sw');
    expect(penda.word).toBe('penda');
    expect(penda.definitions[0].meaning).toContain('Kuwa na mapenzi au hisia kali');
  });

  it('resolves plural noun classes using local morphology fallback', async () => {
    // Class 2 to 1 (watu -> mtu)
    const watu = await fetchMonolingualMeaning('watu', 'sw');
    expect(watu.word).toBe('mtu');
    expect(watu.source).toContain('base form of watu');

    // Class 8 to 7 (vitu -> kitu)
    const vitu = await fetchMonolingualMeaning('vitu', 'sw');
    expect(vitu.word).toBe('kitu');

    // Class 4 to 3 (miti -> mti)
    const miti = await fetchMonolingualMeaning('miti', 'sw');
    expect(miti.word).toBe('mti');
  });

  it('resolves highly agglutinated verbs by stripping subject/tense/object prefixes', async () => {
    // ninakupenda -> penda
    const ninakupenda = await fetchMonolingualMeaning('ninakupenda', 'sw');
    expect(ninakupenda.word).toBe('penda');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('mtu', 'sw');
    expect(related.synonyms).toContain('binadamu');
    expect(related.synonyms).toContain('mwanadamu');
    expect(related.antonyms).toContain('mnyama');
  });
});

describe('Hungarian monolingual baseline and morphology', () => {

  it('looks up exact monolingual nouns and verbs', async () => {
    const haz = await fetchMonolingualMeaning('ház', 'hu');
    expect(haz.word).toBe('ház');
    expect(haz.ipa).toBe('/haːz/');
    expect(haz.definitions[0].meaning).toContain('Emberi lakóhelyül');
    expect(haz.definitions[0].vietnamese).toBe('Nhà, ngôi nhà. Tòa nhà phục vụ mục đích cư trú của con người hoặc các hoạt động khác.');

    const enni = await fetchMonolingualMeaning('enni', 'hu');
    expect(enni.word).toBe('enni');
    expect(enni.definitions[0].meaning).toContain('Táplálékot rág és lenyel');
  });

  it('resolves plural and accusative forms using local morphology fallback', async () => {
    // Plural (házak -> ház)
    const hazak = await fetchMonolingualMeaning('házak', 'hu');
    expect(hazak.word).toBe('ház');

    // Plural with vowel harmony lengthening (kutyák -> kutya)
    const kutyak = await fetchMonolingualMeaning('kutyák', 'hu');
    expect(kutyak.word).toBe('kutya');
  });

  it('resolves case endings with vowel harmony vowel lengthening/shortening', async () => {
    // Inessive (házban -> ház)
    const hazban = await fetchMonolingualMeaning('házban', 'hu');
    expect(hazban.word).toBe('ház');
    expect(hazban.source).toContain('base form of házban');

    // Inessive with vowel harmony lengthening (erdőben -> erdő)
    const erdőben = await fetchMonolingualMeaning('erdőben', 'hu');
    expect(erdőben.word).toBe('erdő');
  });

  it('resolves conjugated verb forms using local morphology fallback', async () => {
    // Definite 1st Sg Present (eszem -> enni)
    const eszem = await fetchMonolingualMeaning('eszem', 'hu');
    expect(eszem.word).toBe('enni');

    // Indefinite 3rd Sg Present (eszik -> enni)
    const eszik = await fetchMonolingualMeaning('eszik', 'hu');
    expect(eszik.word).toBe('enni');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('ház', 'hu');
    expect(related.synonyms).toContain('épület');
    expect(related.synonyms).toContain('lakás');
  });
});

describe('Arabic monolingual baseline and morphology', () => {
  it('looks up exact monolingual words', async () => {
    const kitab = await fetchMonolingualMeaning('كتاب', 'ar');
    expect(kitab.word).toBe('كتاب');
    expect(kitab.ipa).toBe('/kiˈtaːb/');
    expect(kitab.definitions[0].meaning).toContain('عمل مكتوب أو مطبوع');
  });

  it('resolves definite article and prefix forms using local morphology fallback', async () => {
    // Definite article (الكتاب -> كتاب)
    const alKitab = await fetchMonolingualMeaning('الكتاب', 'ar');
    expect(alKitab.word).toBe('كتاب');

    // Conjunction and definite article (والكتاب -> كتاب)
    const waAlKitab = await fetchMonolingualMeaning('والكتاب', 'ar');
    expect(waAlKitab.word).toBe('كتاب');

    // Preposition (بالكتاب -> كتاب)
    const biAlKitab = await fetchMonolingualMeaning('بالكتاب', 'ar');
    expect(biAlKitab.word).toBe('كتاب');
  });

  it('resolves broken plurals using local morphology fallback', async () => {
    // Plural (كتب -> كتاب)
    const kutub = await fetchMonolingualMeaning('كتب', 'ar');
    expect(kutub.word).toBe('كتاب');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('كتاب', 'ar');
    expect(related.synonyms).toContain('مجلد');
    expect(related.synonyms).toContain('سفر');
  });
});

describe('Hebrew monolingual baseline and morphology', () => {
  it('looks up exact monolingual words', async () => {
    const sefer = await fetchMonolingualMeaning('ספר', 'he');
    expect(sefer.word).toBe('ספר');
    expect(sefer.ipa).toBe('/ˈse.feʁ/');
    expect(sefer.definitions[0].meaning).toContain('קובץ דפים מודפסים');
  });

  it('resolves definite article and prefix forms using local morphology fallback', async () => {
    // Definite article (הספר -> ספר)
    const haSefer = await fetchMonolingualMeaning('הספר', 'he');
    expect(haSefer.word).toBe('ספר');

    // Conjunction, preposition, and definite article (ובספר -> ספר)
    const veBeSefer = await fetchMonolingualMeaning('ובספר', 'he');
    expect(veBeSefer.word).toBe('ספר');
  });

  it('resolves plurals using local morphology fallback', async () => {
    // Plural (ספרים -> ספר)
    const sefarim = await fetchMonolingualMeaning('ספרים', 'he');
    expect(sefarim.word).toBe('ספר');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('ספר', 'he');
    expect(related.synonyms).toContain('חיבור');
    expect(related.synonyms).toContain('כרך');
  });
});

describe('Tagalog monolingual baseline and morphology', () => {
  it('looks up exact monolingual nouns and verbs', async () => {
    const aso = await fetchMonolingualMeaning('aso', 'tl');
    expect(aso.word).toBe('aso');
    expect(aso.ipa).toBe('/ˈʔa.so/');
    expect(aso.definitions[0].meaning).toContain('Isang pinaamong hayop');

    const kain = await fetchMonolingualMeaning('kain', 'tl');
    expect(kain.word).toBe('kain');
  });

  it('resolves prefix and reduplication forms using local morphology fallback', async () => {
    // Prefix (magbasa -> basa)
    const magbasa = await fetchMonolingualMeaning('magbasa', 'tl');
    expect(magbasa.word).toBe('basa');

    // Prefix and CV reduplication (nagbabasa -> basa)
    const nagbabasa = await fetchMonolingualMeaning('nagbabasa', 'tl');
    expect(nagbabasa.word).toBe('basa');
  });

  it('resolves infix and reduplication forms using local morphology fallback', async () => {
    // Infix (kumain -> kain)
    const kumain = await fetchMonolingualMeaning('kumain', 'tl');
    expect(kumain.word).toBe('kain');

    // Infix and CV reduplication (kumakain -> kain)
    const kumakain = await fetchMonolingualMeaning('kumakain', 'tl');
    expect(kumakain.word).toBe('kain');
  });

  it('resolves suffix forms using local morphology fallback', async () => {
    // Suffix (basahin -> basa)
    const basahin = await fetchMonolingualMeaning('basahin', 'tl');
    expect(basahin.word).toBe('basa');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('aso', 'tl');
    expect(related.synonyms).toContain('tuta');
  });
});

describe('Amharic monolingual baseline and morphology', () => {
  it('looks up exact monolingual nouns and verbs', async () => {
    const bet = await fetchMonolingualMeaning('ቤት', 'am');
    expect(bet.word).toBe('ቤት');
    expect(bet.ipa).toBe('/bet/');
    expect(bet.definitions[0].meaning).toContain('ለሰው መኖሪያ ወይም ለሌላ አገልግሎት');

    const wusha = await fetchMonolingualMeaning('ውሻ', 'am');
    expect(wusha.word).toBe('ውሻ');
  });

  it('resolves prefix forms using local morphology fallback', async () => {
    // Prefix የ- (የቤት -> ቤት)
    const yabet = await fetchMonolingualMeaning('የቤት', 'am');
    expect(yabet.word).toBe('ቤት');

    // Prefix ከ- (ከቤት -> ቤት)
    const kabet = await fetchMonolingualMeaning('ከቤት', 'am');
    expect(kabet.word).toBe('ቤት');
  });

  it('resolves suffix forms using local morphology fallback', async () => {
    // Suffix -ው (ቤቱ -> ቤት)
    const betu = await fetchMonolingualMeaning('ቤቱ', 'am');
    expect(betu.word).toBe('ቤት');

    // Plural suffix -ዎች (ውሻዎች -> ውሻ)
    const wushawoch = await fetchMonolingualMeaning('ውሻዎች', 'am');
    expect(wushawoch.word).toBe('ውሻ');
  });

  it('resolves prefix and suffix stacked forms using local morphology fallback', async () => {
    // Prefix የ- + Suffix -አችን (የቤታችን -> ቤት)
    // Wait, the word starts with የ (prefix) and remaining "ቤታችን" ends with "አችን" (suffix)
    const yabetachen = await fetchMonolingualMeaning('የቤታችን', 'am');
    expect(yabetachen.word).toBe('ቤት');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('ቤት', 'am');
    expect(related.synonyms).toContain('መኖሪያ');
    expect(related.synonyms).toContain('ህንጻ');
  });
});

describe('Russian monolingual baseline and morphology', () => {
  it('looks up exact monolingual nouns and verbs', async () => {
    const kniga = await fetchMonolingualMeaning('книга', 'ru');
    expect(kniga.word).toBe('книга');
    expect(kniga.ipa).toBe('/ˈknʲiɡə/');
    expect(kniga.definitions[0].meaning).toContain('Произведение печати в виде переплетённых листов');

    const chitat = await fetchMonolingualMeaning('читать', 'ru');
    expect(chitat.word).toBe('читать');
  });

  it('strips combining stress marks (accent marks) from search lookup', async () => {
    // соба́ка (with U+0301) -> собака
    const sobaka = await fetchMonolingualMeaning('соба́ка', 'ru');
    expect(sobaka.word).toBe('собака');

    // кни́гу (with U+0301 and Accusative ending) -> книга
    const knigu = await fetchMonolingualMeaning('кни́гу', 'ru');
    expect(knigu.word).toBe('книга');
  });

  it('resolves noun case and plural declensions using local morphology fallback', async () => {
    // Accusative singular (книгу -> книга)
    const knigu = await fetchMonolingualMeaning('книгу', 'ru');
    expect(knigu.word).toBe('книга');

    // Dative singular (собаке -> собака)
    const sobake = await fetchMonolingualMeaning('собаке', 'ru');
    expect(sobake.word).toBe('собака');

    // Genitive singular / Nominative plural (книги -> книга)
    const knigi = await fetchMonolingualMeaning('книги', 'ru');
    expect(knigi.word).toBe('книга');
  });

  it('resolves verb present/future and past conjugations using local morphology fallback', async () => {
    // Present tense 1st singular (читаю -> читать)
    const chitayu = await fetchMonolingualMeaning('читаю', 'ru');
    expect(chitayu.word).toBe('читать');

    // Present tense 3rd singular (читает -> читать)
    const chitaet = await fetchMonolingualMeaning('читает', 'ru');
    expect(chitaet.word).toBe('читать');

    // Past tense feminine singular (читала -> читать)
    const chitala = await fetchMonolingualMeaning('читала', 'ru');
    expect(chitala.word).toBe('читать');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('читать', 'ru');
    expect(related.synonyms).toContain('просматривать');
    expect(related.antonyms).toContain('писать');
  });
});

describe('Mandarin monolingual baseline and variant morphology', () => {
  it('looks up exact monolingual words', async () => {
    const shu = await fetchMonolingualMeaning('书', 'zh');
    expect(shu.word).toBe('书');
    expect(shu.ipa).toBe('/ʂu¹/');
    expect(shu.definitions[0].meaning).toContain('装订成册的著作');

    const mao = await fetchMonolingualMeaning('猫', 'zh');
    expect(mao.word).toBe('猫');
  });

  it('resolves Traditional to Simplified variant forms using variant mapping morphology fallback', async () => {
    // Traditional 書 -> Simplified 书
    const shuTrad = await fetchMonolingualMeaning('書', 'zh');
    expect(shuTrad.word).toBe('书');
    expect(shuTrad.source).toContain('base form of 書');

    // Traditional 貓 -> Simplified 猫
    const maoTrad = await fetchMonolingualMeaning('貓', 'zh');
    expect(maoTrad.word).toBe('猫');

    // Traditional 讀 -> Simplified 读
    const duTrad = await fetchMonolingualMeaning('讀', 'zh');
    expect(duTrad.word).toBe('读');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('读', 'zh');
    expect(related.synonyms).toContain('阅读');
    expect(related.antonyms).toContain('写');
  });
});

describe('Javanese monolingual baseline and morphology', () => {
  it('looks up exact monolingual words', async () => {
    const waca = await fetchMonolingualMeaning('waca', 'jv');
    expect(waca.word).toBe('waca');
    expect(waca.ipa).toBe('/watʃa/');
    expect(waca.definitions[0].meaning).toContain('Maca buku utawa tulisan');

    const tulis = await fetchMonolingualMeaning('tulis', 'jv');
    expect(tulis.word).toBe('tulis');
  });

  it('resolves active nasal verb prefixes to their dictionary root form', async () => {
    // maca -> waca
    const maca = await fetchMonolingualMeaning('maca', 'jv');
    expect(maca.word).toBe('waca');
    expect(maca.source).toContain('base form of maca');

    // nulis -> tulis
    const nulis = await fetchMonolingualMeaning('nulis', 'jv');
    expect(nulis.word).toBe('tulis');
  });

  it('resolves passive verb prefix di- to its dictionary root form', async () => {
    // diwaca -> waca
    const diwaca = await fetchMonolingualMeaning('diwaca', 'jv');
    expect(diwaca.word).toBe('waca');

    // ditulis -> tulis
    const ditulis = await fetchMonolingualMeaning('ditulis', 'jv');
    expect(ditulis.word).toBe('tulis');
  });

  it('resolves suffixes (-ake, -i) stacked with prefixes', async () => {
    // nulisake -> tulis
    const nulisake = await fetchMonolingualMeaning('nulisake', 'jv');
    expect(nulisake.word).toBe('tulis');
  });

  it('handles Javanese speech registers Ngoko and Krama synonyms', async () => {
    // tuku (Ngoko) has Krama synonym tumbas
    const tukuRelated = await fetchRelatedWords('tuku', 'jv');
    expect(tukuRelated.synonyms).toContain('tumbas');

    // tumbas (Krama) has Ngoko synonym tuku
    const tumbasRelated = await fetchRelatedWords('tumbas', 'jv');
    expect(tumbasRelated.synonyms).toContain('tuku');
  });
});

describe('Somali monolingual baseline and morphology', () => {
  it('looks up exact monolingual words', async () => {
    const buug = await fetchMonolingualMeaning('buug', 'so');
    expect(buug.word).toBe('buug');
    expect(buug.ipa).toBe('/buːɡ/');
    expect(buug.definitions[0].meaning).toContain('Xaashiyaal isku xiran');

    const guri = await fetchMonolingualMeaning('guri', 'so');
    expect(guri.word).toBe('guri');
  });

  it('resolves definite articles with consonant harmony (double consonant restoration)', async () => {
    // buugga -> buug
    const buugga = await fetchMonolingualMeaning('buugga', 'so');
    expect(buugga.word).toBe('buug');
    expect(buugga.source).toContain('base form of buugga');

    // bisadda -> bisad
    const bisadda = await fetchMonolingualMeaning('bisadda', 'so');
    expect(bisadda.word).toBe('bisad');
  });

  it('resolves definite articles without double consonant', async () => {
    // guriga -> guri
    const guriga = await fetchMonolingualMeaning('guriga', 'so');
    expect(guriga.word).toBe('guri');
  });

  it('resolves plural suffix forms (-o / -yo)', async () => {
    // guryo -> guri
    const guryo = await fetchMonolingualMeaning('guryo', 'so');
    expect(guryo.word).toBe('guri');
  });

  it('fetches local synonyms and antonyms', async () => {
    const related = await fetchRelatedWords('guri', 'so');
    expect(related.synonyms).toContain('aqal');
    expect(related.synonyms).toContain('hooy');
  });
});
