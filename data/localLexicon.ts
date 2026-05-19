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
        examples: [
          { source: 'Tôi học tiếng Anh mỗi ngày.' },
          { source: 'Trẻ em học rất nhanh qua trò chơi.' }
        ],
        domain: 'Nghĩa chung',
        level: 'A1',
      },
      {
        partOfSpeech: 'động từ',
        meaning: 'Theo học tại một trường, lớp hoặc chương trình đào tạo.',
        vietnamese: 'Giáo dục',
        examples: [{ source: 'Cô ấy học đại học ở Hà Nội.' }],
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
        examples: [{ source: 'Ứng dụng này là một từ điển học tiếng Anh.' }],
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
        examples: [{ source: 'Một tinh thần kiên cường giúp cô ấy vượt qua thất bại.' }],
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
        examples: [{ source: 'Elle rentre à la maison après le travail.', translation: 'Cô ấy về nhà sau giờ làm việc.' }],
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
        examples: [{ source: 'Je lis un livre chaque semaine.', translation: 'Tôi đọc một cuốn sách mỗi tuần.' }],
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

const arabicDictionaryEntries: DictionaryEntry[] = [
  {
    word: 'كتاب',
    ipa: '/kiˈtaːb/',
    audio: '',
    level: 'A1',
    topic: 'Education',
    vietnamese: 'sách',
    shortDefinition: 'مجموعة من الورق المكتوب أو المطبوع (A set of written or printed pages)',
    definitions: [
      {
        partOfSpeech: 'اسم (noun)',
        meaning: 'عمل مكتوب أو مطبوع يتكون من صفحات مجلدة معاً (A written or printed work consisting of pages glued together).',
        vietnamese: 'Một tác phẩm viết hoặc in gồm các trang gắn liền với nhau.',
        examples: [
          { source: 'قرأت كتاباً مفيداً أمس.', translation: 'Tôi đã đọc một cuốn sách hữu ích ngày hôm qua.' },
          { source: 'هذا الكتاب له غلاف أحمر.', translation: 'Cuốn sách này có bìa màu đỏ.' }
        ],
      }
    ],
    synonyms: ['مجلد', 'سفر'],
    antonyms: [],
    collocations: ['كتاب مدرسي', 'معرض الكتاب'],
    idioms: [],
    conjugation: [],
    etymology: 'من الجذر ك-ت-ب بمعنى الكتابة (From root k-t-b meaning to write).',
    pronunciationTips: [],
  }
];

const hebrewDictionaryEntries: DictionaryEntry[] = [
  {
    word: 'ספר',
    ipa: '/ˈse.feʁ/',
    audio: '',
    level: 'A1',
    topic: 'Education',
    vietnamese: 'sách',
    shortDefinition: 'חיבור כתוב המודפס על דפים (A written composition printed on pages)',
    definitions: [
      {
        partOfSpeech: 'שם עצם (noun)',
        meaning: 'קובץ דפים מודפסים أو כתובים הכרוכים יחד (A collection of printed or written sheets bound together).',
        vietnamese: 'Một tập hợp các tờ giấy được in hoặc viết gắn liền với nhau.',
        examples: [
          { source: 'קראתי ספר מעניין מאוד.', translation: 'Tôi đã đọc một cuốn sách rất thú vị.' },
          { source: 'הספר נמצא על השולחן.', translation: 'Cuốn sách đang ở trên bàn.' }
        ],
      }
    ],
    synonyms: ['חיבור', 'כרך'],
    antonyms: [],
    collocations: ['ספר לימוד', 'חנות ספרים'],
    idioms: [],
    conjugation: [],
    etymology: 'ממשפחת המילים ספר (From the word family of sefer, related to writing/counting).',
    pronunciationTips: [],
  }
];

const entriesByLanguage: Record<string, DictionaryEntry[]> = {
  en: dictionaryEntries,
  vi: vietnameseDictionaryEntries,
  fr: frenchDictionaryEntries,
  ar: arabicDictionaryEntries,
  he: hebrewDictionaryEntries,
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

/**
 * Calculates the Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Returns up to `limit` spelling suggestions for a given word.
 * It uses Levenshtein distance and filters out words that are too different.
 */
export function getSpellingSuggestions(languageCode: string, word: string, limit = 3): string[] {
  const normalizedWord = normalizeLookupTerm(word);
  if (!normalizedWord) return [];

  const entries = getLocalDictionaryEntries(languageCode);
  const scoredEntries = entries
    .map((entry) => {
      const entryWord = normalizeLookupTerm(entry.word);
      const distance = levenshteinDistance(normalizedWord, entryWord);
      return { word: entry.word, distance };
    })
    .filter((item) => item.distance > 0 && item.distance <= 3) // Only reasonable suggestions
    .sort((a, b) => a.distance - b.distance);

  return scoredEntries.slice(0, limit).map((item) => item.word);
}
