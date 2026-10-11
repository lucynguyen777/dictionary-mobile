import { describe, expect, it } from 'vitest';

import { getMorphologyCandidates } from '../data/morphology';

const words = (lang: string, input: string) => getMorphologyCandidates(lang, input).map((candidate) => candidate.word);

describe('Korean contracted verb forms', () => {
  it.each([
    ['갔다', '가다'], ['왔다', '오다'], ['했다', '하다'], ['봤다', '보다'], ['마셨다', '마시다'], ['썼다', '쓰다'],
    ['샀다', '사다'], ['됐다', '되다'], ['줬어요', '주다'], ['공부했어요', '공부하다'],
    ['봐요', '보다'], ['해요', '하다'], ['커요', '크다'], ['가요', '가다'], ['마셔요', '마시다'],
    ['갑니다', '가다'], ['봅니다', '보다'],
    ['추워요', '춥다'], ['더웠다', '덥다'],
  ])('%s → %s', (form, lemma) => {
    expect(words('ko', form)).toContain(lemma);
  });

  it('still strips particles and keeps regular endings', () => {
    expect(words('ko', '사랑으로')).toContain('사랑');
    expect(words('ko', '먹었다')).toContain('먹다');
  });
});

describe('Japanese godan and adjective forms', () => {
  it.each([
    ['飲んだ', '飲む'], ['読んだ', '読む'], ['遊んだ', '遊ぶ'], ['泳いだ', '泳ぐ'], ['話した', '話す'], ['行った', '行く'],
    ['行きます', '行く'], ['読みます', '読む'], ['書きます', '書く'], ['話します', '話す'], ['待ちました', '待つ'],
    ['大きかった', '大きい'], ['新しかった', '新しい'], ['寒くない', '寒い'],
  ])('%s → %s', (form, lemma) => {
    expect(words('ja', form)).toContain(lemma);
  });

  it('keeps ichidan rules', () => {
    expect(words('ja', '食べました')).toContain('食べる');
    expect(words('ja', '見ます')).toContain('見る');
  });
});

describe('Russian adjective case forms', () => {
  it.each([
    ['хорошего', 'хороший'], ['новые', 'новый'], ['большие', 'большой'], ['красивая', 'красивый'], ['синего', 'синий'], ['русскому', 'русский'],
  ])('%s → %s', (form, lemma) => {
    expect(words('ru', form)).toContain(lemma);
  });
});

describe('Turkish verb forms', () => {
  it.each([
    ['gidiyor', 'gitmek'], ['seviyorum', 'sevmek'], ['yazıyor', 'yazmak'], ['istiyor', 'istemek'], ['anlıyorlar', 'anlamak'],
    ['biliyorum', 'bilmek'], ['yaptım', 'yapmak'], ['anladım', 'anlamak'], ['gördük', 'görmek'], ['okuyorsun', 'okumak'],
  ])('%s → %s', (form, lemma) => {
    expect(words('tr', form)).toContain(lemma);
  });

  it('keeps noun readings', () => {
    expect(words('tr', 'evler')).toContain('ev');
    expect(words('tr', 'okulda')).toContain('okul');
  });
});

describe('Spanish short irregular verbs', () => {
  it.each([['va', 'ir'], ['es', 'ser'], ['he', 'haber'], ['hay', 'haber'], ['está', 'estar'], ['dijo', 'decir']])('%s → %s', (form, lemma) => {
    expect(words('es', form)).toContain(lemma);
  });
});

describe('Russian irregular forms', () => {
  it.each([['детей', 'ребёнок'], ['хочет', 'хотеть'], ['живёт', 'жить'], ['живет', 'жить'], ['людей', 'человек'], ['ест', 'есть'], ['может', 'мочь'], ['пишу', 'писать']])('%s → %s', (form, lemma) => {
    expect(words('ru', form)).toContain(lemma);
  });
});

describe('French forms', () => {
  it.each([
    ['livres', 'livre'], ['chats', 'chat'], ['écoles', 'école'], ['enfants', 'enfant'], ['femmes', 'femme'], ['parle', 'parler'],
    ['mange', 'manger'], ['mangeons', 'manger'], ['boit', 'boire'], ['voit', 'voir'], ['vient', 'venir'], ['prend', 'prendre'],
    ['heureuse', 'heureux'], ['chevaux', 'cheval'], ['gâteaux', 'gâteau'], ['parlé', 'parler'], ['finissons', 'finir'],
    ['grande', 'grand'], ['vives', 'vif'], ['bonne', 'bon'], ['est', 'être'], ["l'école", 'école'], ['attend', 'attendre'],
  ])('%s → %s', (form, lemma) => {
    expect(words('fr', form)).toContain(lemma);
  });
});
