import { DictionaryEntry, dictionaryEntries } from '@/data/dictionary';

const vietnameseDictionaryEntries: DictionaryEntry[] = [
  {
    word: 'học',
    ipa: '',
    audio: '',
    level: 'A1',
    topic: 'Giáo dục',
    vietnamese: 'từ tiếng Việt',
    shortDefinition: 'tiếp thu kiến thức hoặc kỹ năng qua luyện tập, quan sát hoặc được dạy',
    definitions: [
      {
        partOfSpeech: 'động từ',
        meaning: 'Tiếp thu kiến thức, kỹ năng hoặc kinh nghiệm qua quá trình học tập.',
        vietnamese: 'Nghĩa chung',
        examples: ['Tôi học tiếng Anh mỗi ngày.', 'Trẻ em học rất nhanh qua trò chơi.'],
        domain: 'Nghĩa chung',
        level: 'A1',
      },
      {
        partOfSpeech: 'động từ',
        meaning: 'Theo học tại một trường, lớp hoặc chương trình đào tạo.',
        vietnamese: 'Giáo dục',
        examples: ['Cô ấy học đại học ở Hà Nội.'],
        domain: 'Giáo dục',
        level: 'A2',
      },
    ],
    synonyms: ['nghiên cứu', 'tiếp thu', 'rèn luyện'],
    antonyms: ['quên'],
    collocations: ['học ngoại ngữ', 'học thuộc', 'học qua trải nghiệm'],
    idioms: [{ phrase: 'học đi đôi với hành', meaning: 'việc học hiệu quả hơn khi gắn với thực hành' }],
    conjugation: [],
    etymology: 'Từ thuần Việt được dùng rộng rãi trong giáo dục và đời sống.',
    pronunciationTips: [],
  },
  {
    word: 'từ điển',
    ipa: '',
    audio: '',
    level: 'A2',
    topic: 'Ngôn ngữ học',
    vietnamese: 'từ tiếng Việt',
    shortDefinition: 'sách, ứng dụng hoặc cơ sở dữ liệu giải thích từ ngữ',
    definitions: [
      {
        partOfSpeech: 'danh từ',
        meaning: 'Nguồn tra cứu cung cấp nghĩa, cách phát âm, từ loại hoặc cách dùng của từ.',
        vietnamese: 'Nghĩa chung',
        examples: ['Ứng dụng này là một từ điển học tiếng Anh.'],
        domain: 'Ngôn ngữ học',
        level: 'A2',
      },
    ],
    synonyms: ['tự điển', 'kho từ vựng'],
    antonyms: [],
    collocations: ['tra từ điển', 'từ điển song ngữ', 'từ điển chuyên ngành'],
    idioms: [],
    conjugation: [],
    etymology: 'Kết hợp giữa “từ” và “điển”, chỉ nguồn ghi chép, giải thích từ ngữ.',
    pronunciationTips: [],
  },
  {
    word: 'kiên cường',
    ipa: '',
    audio: '',
    level: 'B1',
    topic: 'Tính cách',
    vietnamese: 'từ tiếng Việt',
    shortDefinition: 'bền bỉ, vững vàng trước khó khăn',
    definitions: [
      {
        partOfSpeech: 'tính từ',
        meaning: 'Có khả năng chịu đựng và vượt qua khó khăn mà không dễ bỏ cuộc.',
        vietnamese: 'Nghĩa chung',
        examples: ['Một tinh thần kiên cường giúp cô ấy vượt qua thất bại.'],
        domain: 'Nghĩa chung',
        level: 'B1',
      },
    ],
    synonyms: ['bền bỉ', 'mạnh mẽ', 'gan góc'],
    antonyms: ['yếu đuối', 'dễ nản'],
    collocations: ['tinh thần kiên cường', 'ý chí kiên cường'],
    idioms: [],
    conjugation: [],
    etymology: 'Từ ghép Hán Việt, thường dùng để nói về phẩm chất tinh thần.',
    pronunciationTips: [],
  },
];

const frenchDictionaryEntries: DictionaryEntry[] = [
  {
    word: 'maison',
    ipa: '/mɛ.zɔ̃/',
    audio: '',
    level: 'A1',
    topic: 'Vie quotidienne',
    vietnamese: 'mot français',
    shortDefinition: 'bâtiment où l’on habite',
    gender: 'féminin',
    definitions: [
      {
        partOfSpeech: 'nom',
        meaning: "Bâtiment destiné à servir d'habitation.",
        vietnamese: 'Nghĩa chung',
        examples: ['Elle rentre à la maison après le travail.'],
        domain: 'Nghĩa chung',
        gender: 'féminin',
        level: 'A1',
      },
    ],
    synonyms: ['habitation', 'logement'],
    antonyms: [],
    collocations: ['à la maison', 'maison familiale'],
    idioms: [],
    conjugation: [],
    etymology: "Du latin mansio, lié à l'idée de séjourner.",
    pronunciationTips: [],
  },
  {
    word: 'livre',
    ipa: '/livʁ/',
    audio: '',
    level: 'A1',
    topic: 'Éducation',
    vietnamese: 'mot français',
    shortDefinition: 'ensemble de pages imprimées ou numériques',
    gender: 'masculin',
    definitions: [
      {
        partOfSpeech: 'nom',
        meaning: 'Objet composé de pages contenant un texte ou des images.',
        vietnamese: 'Nghĩa chung',
        examples: ['Je lis un livre chaque semaine.'],
        domain: 'Nghĩa chung',
        gender: 'masculin',
        level: 'A1',
      },
    ],
    synonyms: ['ouvrage'],
    antonyms: [],
    collocations: ['lire un livre', 'livre numérique'],
    idioms: [],
    conjugation: [],
    etymology: 'Du latin liber, qui désignait aussi un écrit.',
    pronunciationTips: [],
  },
];

const entriesByLanguage: Record<string, DictionaryEntry[]> = {
  en: dictionaryEntries,
  vi: vietnameseDictionaryEntries,
  fr: frenchDictionaryEntries,
};

export function getLocalDictionaryEntries(languageCode: string) {
  return entriesByLanguage[languageCode] ?? [];
}

export function findLocalDictionaryEntry(languageCode: string, word: string) {
  const normalizedWord = normalizeLookupTerm(word);

  return getLocalDictionaryEntries(languageCode).find((entry) => normalizeLookupTerm(entry.word) === normalizedWord);
}

export function supportsLocalDictionary(languageCode: string) {
  return Boolean(entriesByLanguage[languageCode]);
}

export function normalizeLookupTerm(value: string) {
  return value.trim().toLocaleLowerCase();
}
