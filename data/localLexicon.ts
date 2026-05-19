import { DictionaryEntry, dictionaryEntries } from './dictionary';

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

const finnishDictionaryEntries: DictionaryEntry[] = [
  {
    word: 'talo',
    ipa: '/ˈtɑlo/',
    audio: '',
    level: 'A1',
    topic: 'Koti (Home)',
    vietnamese: 'nhà',
    shortDefinition: 'rakennus, joka on tarkoitettu asunnoksi (a building intended as a dwelling)',
    definitions: [
      {
        partOfSpeech: 'dani (noun)',
        meaning: 'Asumiseen tarkoitettu rakennus (A building meant for living in).',
        vietnamese: 'Nhà, công trình xây dựng để ở.',
        examples: [
          { source: 'Asun isossa talossa.', translation: 'Tôi sống trong một ngôi nhà lớn.' },
          { source: 'Talo on rakennettu puusta.', translation: 'Ngôi nhà được xây dựng bằng gỗ.' }
        ],
      }
    ],
    synonyms: ['rakennus', 'asunto', 'koti'],
    antonyms: [],
    collocations: ['omakotitalo', 'kerrostalo'],
    idioms: [],
    conjugation: [
      { tense: 'Genitive', form: 'talon' },
      { tense: 'Partitive', form: 'taloa' },
      { tense: 'Inessive', form: 'talossa' },
      { tense: 'Elative', form: 'talosta' },
      { tense: 'Illative', form: 'taloon' }
    ],
    etymology: 'Vanha uralilainen sana (Old Uralic word).',
    pronunciationTips: [],
  },
  {
    word: 'syödä',
    ipa: '/ˈsyø̯dæ/',
    audio: '',
    level: 'A1',
    topic: 'Ruoka (Food)',
    vietnamese: 'ăn',
    shortDefinition: 'ottaa ravintoa suun kautta (to ingest food through the mouth)',
    definitions: [
      {
        partOfSpeech: 'verbi (verb)',
        meaning: 'Pureskella ja niellä ruokaa (To chew and swallow food).',
        vietnamese: 'Ăn nhai và nuốt thức ăn.',
        examples: [
          { source: 'Tyttö syö omenaa.', translation: 'Cô bé đang ăn một quả táo.' },
          { source: 'Haluatko syödä jotain?', translation: 'Bạn có muốn ăn gì đó không?' }
        ],
      }
    ],
    synonyms: ['nauttia', 'ateriaa'],
    antonyms: [],
    collocations: ['syödä aamupalaa', 'syödä ulkona'],
    idioms: [],
    conjugation: [
      { tense: 'Present 1sg', form: 'syön' },
      { tense: 'Present 2sg', form: 'syöt' },
      { tense: 'Present 3sg', form: 'syö' },
      { tense: 'Present 1pl', form: 'syömme' },
      { tense: 'Present 2pl', form: 'syötte' },
      { tense: 'Present 3pl', form: 'syövät' }
    ],
    etymology: 'Suomalais-ugrilainen vartalo (Finno-Ugric stem).',
    pronunciationTips: [],
  },
  {
    word: 'käsi',
    ipa: '/ˈkæsi/',
    audio: '',
    level: 'A1',
    topic: 'Keho (Body)',
    vietnamese: 'tay',
    shortDefinition: 'ihmisen yläraaja (human upper limb / hand)',
    definitions: [
      {
        partOfSpeech: 'dani (noun)',
        meaning: 'Ihmisen yläraajan osa ranteesta sormenpäihin (Part of the human upper limb from wrist to fingertips).',
        vietnamese: 'Bàn tay, bộ phận cơ thể từ cổ tay đến đầu ngón tay.',
        examples: [
          { source: 'Pese kätesi ennen ruokailua.', translation: 'Hãy rửa tay trước khi ăn.' }
        ],
      }
    ],
    synonyms: ['kämmen'],
    antonyms: [],
    collocations: ['käsivarsi', 'vasen käsi'],
    idioms: [],
    conjugation: [
      { tense: 'Genitive', form: 'käden' },
      { tense: 'Partitive', form: 'kättä' },
      { tense: 'Inessive', form: 'kädessä' }
    ],
    etymology: 'Vanha ugrilainen sana (Old Ugric word).',
    pronunciationTips: [],
  },
  {
    word: 'yö',
    ipa: '/ˈyø/',
    audio: '',
    level: 'A1',
    topic: 'Aika (Time)',
    vietnamese: 'đêm',
    shortDefinition: 'vuorokauden pimeä aika (dark time of the day / night)',
    definitions: [
      {
        partOfSpeech: 'dani (noun)',
        meaning: 'Auringonlaskun ja auringonnousun välinen pimeä aika (Dark time between sunset and sunrise).',
        vietnamese: 'Ban đêm, khoảng thời gian tối giữa hoàng hôn và bình minh.',
        examples: [
          { source: 'Nuku hyvin yöllä.', translation: 'Ngủ ngon vào ban đêm nhé.' }
        ],
      }
    ],
    synonyms: ['pimeys'],
    antonyms: ['päivä'],
    collocations: ['hyvää yötä', 'keskiyö'],
    idioms: [],
    conjugation: [
      { tense: 'Genitive', form: 'yön' },
      { tense: 'Partitive', form: 'yötä' },
      { tense: 'Inessive', form: 'yössä' }
    ],
    etymology: 'Uralilainen perussana (Uralic word).',
    pronunciationTips: [],
  }
];

const turkishDictionaryEntries: DictionaryEntry[] = [
  {
    word: 'ev',
    ipa: '/ev/',
    audio: '',
    level: 'A1',
    topic: 'Koti (Home)',
    vietnamese: 'nhà',
    shortDefinition: 'insanların barındığı yapı (a structure in which people live / house)',
    definitions: [
      {
        partOfSpeech: 'isim (noun)',
        meaning: 'İçinde yaşamak için yapılmış bina (A building built for living in).',
        vietnamese: 'Nhà, công trình xây dựng để ở.',
        examples: [
          { source: 'Büyük bir evde yaşıyorum.', translation: 'Tôi sống trong một ngôi nhà lớn.' },
          { source: 'Eve gidiyorum.', translation: 'Tôi đang đi về nhà.' }
        ],
      }
    ],
    synonyms: ['konut', 'hane'],
    antonyms: [],
    collocations: ['ev sahibi', 'kira evi'],
    idioms: [],
    conjugation: [
      { tense: 'Plural', form: 'evler' },
      { tense: 'Locative', form: 'evde' },
      { tense: 'Ablative', form: 'evden' },
      { tense: 'Dative', form: 'eve' },
      { tense: 'Accusative', form: 'evi' },
      { tense: 'Genitive', form: 'evin' }
    ],
    etymology: 'Eski Türkçe: eb (Old Turkic: eb).',
    pronunciationTips: [],
  },
  {
    word: 'yemek',
    ipa: '/jeˈmec/',
    audio: '',
    level: 'A1',
    topic: 'Ruoka (Food)',
    vietnamese: 'ăn / món ăn',
    shortDefinition: 'beslenmek için yenen şeyler (food) veya beslenmek (to eat)',
    definitions: [
      {
        partOfSpeech: 'isim (noun)',
        meaning: 'Yenmek için hazırlanmış yiyecek (Prepared food to be eaten).',
        vietnamese: 'Món ăn, thức ăn được chuẩn bị.',
        examples: [
          { source: 'Yemek çok lezzetli.', translation: 'Món ăn rất ngon.' }
        ],
      },
      {
        partOfSpeech: 'fiil (verb)',
        meaning: 'Besini çiğneyip yutmak (To chew and swallow food).',
        vietnamese: 'Ăn nhai và nuốt thức ăn.',
        examples: [
          { source: 'Elma yemek istiyorum.', translation: 'Tôi muốn ăn táo.' }
        ],
      }
    ],
    synonyms: ['yiyecek', 'gıda', 'beslenmek'],
    antonyms: [],
    collocations: ['akşam yemeği', 'yemek pişirmek'],
    idioms: [],
    conjugation: [
      { tense: 'Plural Noun', form: 'yemekler' },
      { tense: 'Dative Noun', form: 'yemeğe' },
      { tense: 'Locative Noun', form: 'yemekte' },
      { tense: 'Present 1sg Verb', form: 'yerim' },
      { tense: 'Past 3sg Verb', form: 'yedi' },
      { tense: 'Participle Verb', form: 'yiyen' }
    ],
    etymology: 'Eski Türkçe: yeme (Old Turkic: yeme).',
    pronunciationTips: [],
  },
  {
    word: 'ışık',
    ipa: '/ɯˈʃɯc/',
    audio: '',
    level: 'A1',
    topic: 'Doğa (Nature)',
    vietnamese: 'ánh sáng',
    shortDefinition: 'cisimleri görmeyi sağlayan fiziksel etki (light)',
    definitions: [
      {
        partOfSpeech: 'isim (noun)',
        meaning: 'Cisimleri görmemizi sağlayan fiziksel aydınlık (Physical brightness that enables seeing objects).',
        vietnamese: 'Ánh sáng, hiện tượng vật lý giúp nhìn thấy vật thể.',
        examples: [
          { source: 'Güneş ışığı odayı doldurdu.', translation: 'Ánh sáng mặt trời lấp đầy căn phòng.' }
        ],
      }
    ],
    synonyms: ['aydınlık', 'nur'],
    antonyms: ['karanlık'],
    collocations: ['ışık yılı', 'yeşil ışık'],
    idioms: [],
    conjugation: [
      { tense: 'Plural', form: 'ışıklar' },
      { tense: 'Dative', form: 'ışığa' },
      { tense: 'Locative', form: 'ışıkta' }
    ],
    etymology: 'Eski Türkçe: yaruk / yışık (Old Turkic: yaruk / yışık).',
    pronunciationTips: [],
  },
  {
    word: 'İstanbul',
    ipa: '/isˈtɑnbul/',
    audio: '',
    level: 'A1',
    topic: 'Coğrafya (Geography)',
    vietnamese: 'Istanbul',
    shortDefinition: 'Türkiye\'nin en büyük şehri (largest city in Turkey)',
    definitions: [
      {
        partOfSpeech: 'özel isim (proper noun)',
        meaning: 'Türkiye\'nin kuzeybatısında yer alan tarihi ve en büyük şehri (The historical and largest city located in northwest Turkey).',
        vietnamese: 'Istanbul, thành phố lớn nhất và mang tính lịch sử ở tây bắc Thổ Nhĩ Kỳ.',
        examples: [
          { source: 'İstanbul\'da yaşıyorum.', translation: 'Tôi đang sống ở Istanbul.' }
        ],
      }
    ],
    synonyms: [],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [
      { tense: 'Locative', form: "İstanbul'da" },
      { tense: 'Dative', form: "İstanbul'a" }
    ],
    etymology: 'Yunanca: Eis ten polin (Greek: Eis ten polin - to the city).',
    pronunciationTips: [],
  }
];

const japaneseDictionaryEntries: DictionaryEntry[] = [
  {
    word: '猫',
    ipa: '/neko/',
    audio: '',
    level: 'N5',
    topic: 'Dōbutsu (Animals)',
    vietnamese: 'con mèo',
    shortDefinition: 'ネコ科の小型哺乳類 (small feline mammal / cat)',
    definitions: [
      {
        partOfSpeech: '名詞 (noun)',
        meaning: 'ネコ科の小型哺乳類。愛玩用に広く飼育されている (A small mammal of the cat family. Widely kept as a pet).',
        vietnamese: 'Con mèo. Động vật có vú nhỏ thuộc họ mèo, được nuôi rộng rãi làm thú cưng.',
        examples: [
          { source: '猫が鳴いている。', translation: 'Con mèo đang kêu.' }
        ],
      }
    ],
    synonyms: ['キャット', 'ねこ'],
    antonyms: ['犬'],
    collocations: ['野良猫', '飼い猫'],
    idioms: [],
    conjugation: [],
    etymology: '古環境語: ねこ (Old Japanese: neko).',
    pronunciationTips: [],
  },
  {
    word: 'たべる',
    ipa: '/taberu/',
    audio: '',
    level: 'N5',
    topic: 'Shokuji (Meal)',
    vietnamese: 'ăn',
    shortDefinition: '食物を口に入れて咀嚼し、飲み込むこと (to eat)',
    definitions: [
      {
        partOfSpeech: '動詞 (verb)',
        meaning: '食物を口に入れ、噛み砕いて胃に送り込む (To put food in the mouth, chew, and send to the stomach).',
        vietnamese: 'Ăn. Cho thức ăn vào miệng, nhai nát và đưa vào dạ dày.',
        examples: [
          { source: 'りんごを食べる。', translation: 'Tôi ăn quả táo.' }
        ],
      }
    ],
    synonyms: ['食す', '召し上がる'],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [
      { tense: 'Polite', form: '食べます' },
      { tense: 'Past', form: '食べた' },
      { tense: 'Te-form', form: '食べて' },
      { tense: 'Negative', form: '食べない' }
    ],
    etymology: '古日本語: たぶ (Old Japanese: tabu).',
    pronunciationTips: [],
  },
  {
    word: '食べる',
    ipa: '/taberu/',
    audio: '',
    level: 'N5',
    topic: 'Shokuji (Meal)',
    vietnamese: 'ăn',
    shortDefinition: 'たべる の漢字表記 (Kanji spelling of taberu / to eat)',
    definitions: [
      {
        partOfSpeech: '動詞 (verb)',
        meaning: '「たべる」の漢字表記 (Kanji spelling of "taberu").',
        vietnamese: 'Cách viết chữ Hán của từ "taberu" (ăn).',
        examples: [
          { source: '朝ご飯を食べる。', translation: 'Tôi ăn bữa sáng.' }
        ],
      }
    ],
    synonyms: ['食す'],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [
      { tense: 'Polite', form: '食べます' },
      { tense: 'Past', form: '食べた' },
      { tense: 'Te-form', form: '食べて' },
      { tense: 'Negative', form: '食べない' }
    ],
    etymology: '「たべる」に漢字を当てたもの。',
    pronunciationTips: [],
  }
];

const koreanDictionaryEntries: DictionaryEntry[] = [
  {
    word: '사랑',
    ipa: '/saːraŋ/',
    audio: '',
    level: 'Beginner',
    topic: 'Gamjeong (Emotion)',
    vietnamese: 'tình yêu',
    shortDefinition: '아끼고 위하는 따뜻한 마음 (warm feeling of caring / love)',
    definitions: [
      {
        partOfSpeech: '명사 (noun)',
        meaning: '어떤 사람이나 대상을 몹시 아끼고 귀중히 여기는 마음 (A feeling of deeply caring for and valuing someone or something).',
        vietnamese: 'Tình yêu, lòng yêu thương. Cảm xúc trân trọng, nâng niu một người hoặc đối tượng nào đó.',
        examples: [
          { source: '어머니의 사랑은 가없이 깊다.', translation: 'Tình yêu của mẹ sâu đậm bao la.' }
        ],
      }
    ],
    synonyms: ['애정', '연애'],
    antonyms: ['미움', '증오'],
    collocations: ['사랑에 빠지다', '첫사랑'],
    idioms: [],
    conjugation: [],
    etymology: '고유어: 사랑 (Native Korean: sarang).',
    pronunciationTips: [],
  },
  {
    word: '먹다',
    ipa: '/mʌk̚t͈a/',
    audio: '',
    level: 'Beginner',
    topic: 'Siksal (Meal)',
    vietnamese: 'ăn',
    shortDefinition: '음식을 입을 통해 배 속에 들여보내다 (to eat)',
    definitions: [
      {
        partOfSpeech: '동사 (verb)',
        meaning: '음식 따위를 입을 통해 위로 들여보내다 (To send food or similar substances through the mouth to the stomach).',
        vietnamese: 'Ăn. Đưa thức ăn qua miệng vào dạ dày.',
        examples: [
          { source: '밥을 먹다.', translation: 'Ăn cơm.' }
        ],
      }
    ],
    synonyms: ['섭취하다', '식사하다'],
    antonyms: [],
    collocations: ['마음을 먹다'],
    idioms: [],
    conjugation: [
      { tense: 'Polite Present', form: '먹어요' },
      { tense: 'Formal Polite Present', form: '먹습니다' },
      { tense: 'Past', form: '먹었다' },
      { tense: 'Formal Polite Past', form: '먹었습니다' },
      { tense: 'Connective', form: '먹고' }
    ],
    etymology: '고유어: 먹다 (Native Korean: meokda).',
    pronunciationTips: [],
  }
];

const swahiliDictionaryEntries: DictionaryEntry[] = [
  {
    word: 'mtu',
    ipa: '/m.tu/',
    audio: '',
    level: 'A1',
    topic: 'Watu (People)',
    vietnamese: 'người',
    shortDefinition: 'kiumbe mwenye akili (human being / person)',
    definitions: [
      {
        partOfSpeech: 'Nomino (noun)',
        meaning: 'Kiumbe hai mwenye akili ya kufikiri na utambuzi, tofauti na mnyama (A living being with the ability to think and reason, distinct from animals).',
        vietnamese: 'Người, con người. Thực thể sống có tư duy và nhận thức, khác biệt với động vật.',
        examples: [
          { source: 'Mtu huyu ni rafiki yangu.', translation: 'Người này là bạn tôi.' }
        ],
      }
    ],
    synonyms: ['binadamu', 'mwanadamu'],
    antonyms: ['mnyama'],
    collocations: ['mtu mzuri', 'watu wote'],
    idioms: [],
    conjugation: [
      { tense: 'Plural (Class 2)', form: 'watu' }
    ],
    etymology: 'Proto-Bantu: *-ntu (human/thing).',
    pronunciationTips: [],
  },
  {
    word: 'kitu',
    ipa: '/ki.tu/',
    audio: '',
    level: 'A1',
    topic: 'Kawaida (General)',
    vietnamese: 'vật / thứ',
    shortDefinition: 'jambo au chombo kisicho na uzima (thing / object)',
    definitions: [
      {
        partOfSpeech: 'Nomino (noun)',
        meaning: 'Jambo, chombo au dutu yoyote isiyo na uzima (Any matter, object, or substance without life).',
        vietnamese: 'Vật, vật thể, thứ, đồ đạc. Bất kỳ đối tượng hay chất nào không có sự sống.',
        examples: [
          { source: 'Hiki ni kitu gani?', translation: 'Đây là cái gì vậy?' }
        ],
      }
    ],
    synonyms: ['dutu', 'chombo'],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [
      { tense: 'Plural (Class 8)', form: 'vitu' }
    ],
    etymology: 'Proto-Bantu: *-ntu (human/thing) with class 7 prefix.',
    pronunciationTips: [],
  },
  {
    word: 'mti',
    ipa: '/m.ti/',
    audio: '',
    level: 'A1',
    topic: 'Mazingira (Environment)',
    vietnamese: 'cây',
    shortDefinition: 'mmea mkubwa wenye shina la mbao (tree)',
    definitions: [
      {
        partOfSpeech: 'Nomino (noun)',
        meaning: 'Mmea mkubwa na mrefu wenye shina gumu la mbao na matawi (A large, tall plant with a hard woody trunk and branches).',
        vietnamese: 'Cây, cây cối. Loại thực vật lớn và cao có thân gỗ cứng và các cành lá.',
        examples: [
          { source: 'Mti huu una matunda mazuri.', translation: 'Cây này có quả ngon.' }
        ],
      }
    ],
    synonyms: [],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [
      { tense: 'Plural (Class 4)', form: 'miti' }
    ],
    etymology: 'Proto-Bantu: *-tɪ́ (tree/wood).',
    pronunciationTips: [],
  },
  {
    word: 'penda',
    ipa: '/pe.nda/',
    audio: '',
    level: 'A1',
    topic: 'Hisia (Feelings)',
    vietnamese: 'yêu / thích',
    shortDefinition: 'kuwa na hisia nzuri kwa mtu au kitu (to love / to like)',
    definitions: [
      {
        partOfSpeech: 'Kitenzi (verb)',
        meaning: 'Kuwa na mapenzi au hisia kali za kuvutiwa na mtu au kupendezwa na kitu (To have strong affection or feelings of attraction to someone or interest in something).',
        vietnamese: 'Yêu, thương, thích. Có tình cảm sâu sắc hoặc sự hấp dẫn mạnh mẽ đối với ai đó hoặc quan tâm đến điều gì đó.',
        examples: [
          { source: 'Ninakupenda sana.', translation: 'Tôi yêu bạn rất nhiều.' }
        ],
      }
    ],
    synonyms: ['thamani', 'husudu'],
    antonyms: ['chukia'],
    collocations: ['kupenda sana'],
    idioms: [],
    conjugation: [
      { tense: 'Present (I love you)', form: 'ninakupenda' },
      { tense: 'Infinitive', form: 'kupenda' }
    ],
    etymology: 'Proto-Bantu: *-penda (to love/like).',
    pronunciationTips: [],
  }
];

const hungarianDictionaryEntries: DictionaryEntry[] = [
  {
    word: 'ház',
    ipa: '/haːz/',
    audio: '',
    level: 'Beginner',
    topic: 'Otthon (Home)',
    vietnamese: 'nhà',
    shortDefinition: 'emberi lakóhely (house / building)',
    definitions: [
      {
        partOfSpeech: 'Főnév (noun)',
        meaning: 'Emberi lakóhelyül, illetve egyéb emberi tevékenység céljára szolgáló épület (A building used as a human dwelling or for other human activities).',
        vietnamese: 'Nhà, ngôi nhà. Tòa nhà phục vụ mục đích cư trú của con người hoặc các hoạt động khác.',
        examples: [
          { source: 'Ez egy szép ház.', translation: 'Đây là một ngôi nhà đẹp.' }
        ],
      }
    ],
    synonyms: ['épület', 'lakás'],
    antonyms: [],
    collocations: ['családi ház', 'háztető'],
    idioms: [],
    conjugation: [
      { tense: 'Plural', form: 'házak' },
      { tense: 'Inessive (in the house)', form: 'házban' }
    ],
    etymology: 'Finno-Ugric: *kota (hut/tent).',
    pronunciationTips: [],
  },
  {
    word: 'kutya',
    ipa: '/ˈkucɒ/',
    audio: '',
    level: 'Beginner',
    topic: 'Állatok (Animals)',
    vietnamese: 'con chó',
    shortDefinition: 'háziasított négylábú állat (dog)',
    definitions: [
      {
        partOfSpeech: 'Főnév (noun)',
        meaning: 'Háziasított húsevő emlősállat, az ember legrégebbi társa (A domesticated carnivorous mammal, human\'s oldest companion).',
        vietnamese: 'Chó. Loài động vật có vú ăn thịt đã được thuần hóa, người bạn lâu đời nhất của con người.',
        examples: [
          { source: 'A kutya ugat.', translation: 'Con chó đang sủa.' }
        ],
      }
    ],
    synonyms: ['eb'],
    antonyms: [],
    collocations: ['kiskutya'],
    idioms: [],
    conjugation: [
      { tense: 'Plural', form: 'kutyák' }
    ],
    etymology: 'Onomatopoeic origin.',
    pronunciationTips: [],
  },
  {
    word: 'erdő',
    ipa: '/ˈɛrdøː/',
    audio: '',
    level: 'Beginner',
    topic: 'Természet (Nature)',
    vietnamese: 'rừng',
    shortDefinition: 'fákkal borított nagy terület (forest)',
    definitions: [
      {
        partOfSpeech: 'Főnév (noun)',
        meaning: 'Fákkal sűrűn benőtt nagyobb terület (A larger area densely covered with trees).',
        vietnamese: 'Rừng. Một vùng đất rộng lớn phủ đầy cây cối rậm rạp.',
        examples: [
          { source: 'Sétálunk az erdőben.', translation: 'Chúng tôi đi dạo trong rừng.' }
        ],
      }
    ],
    synonyms: [],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [
      { tense: 'Plural', form: 'erdők' }
    ],
    etymology: 'Finno-Ugric origin.',
    pronunciationTips: [],
  },
  {
    word: 'enni',
    ipa: '/ˈɛnːi/',
    audio: '',
    level: 'Beginner',
    topic: 'Étkezés (Eating)',
    vietnamese: 'ăn',
    shortDefinition: 'táplálékot magához vesz (to eat)',
    definitions: [
      {
        partOfSpeech: 'Ige (verb)',
        meaning: 'Táplálékot rág és lenyel, hogy fenntartsa az életét (To chew and swallow food to maintain life).',
        vietnamese: 'Ăn. Nhai và nuốt thức ăn để duy trì sự sống.',
        examples: [
          { source: 'Almát akarok enni.', translation: 'Tôi muốn ăn một quả táo.' }
        ],
      }
    ],
    synonyms: ['táplálkozik', 'fogyaszt'],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [
      { tense: 'Present 1st Sg Definite', form: 'eszem' },
      { tense: 'Present 3rd Sg Indefinite', form: 'eszik' }
    ],
    etymology: 'Proto-Uralic: *sewe- (to eat).',
    pronunciationTips: [],
  }
];

const tagalogDictionaryEntries: DictionaryEntry[] = [
  {
    word: 'aso',
    ipa: '/ˈʔa.so/',
    audio: '',
    level: 'Beginner',
    topic: 'Hayop (Animals)',
    vietnamese: 'con chó',
    shortDefinition: 'isang uri ng hayop na apat ang paa at tinaguriang matalik na kaibigan ng tao (dog)',
    definitions: [
      {
        partOfSpeech: 'Pangngalan (noun)',
        meaning: 'Isang pinaamong hayop na mamalya na kabilang sa pamilya Canidae (A domesticated mammalian animal belonging to the family Canidae).',
        vietnamese: 'Con chó. Loài động vật có vú được thuần hóa thuộc họ Chó.',
        examples: [
          { source: 'Tahol nang tahol ang aso.', translation: 'Con chó đang sủa liên hồi.' }
        ],
      }
    ],
    synonyms: ['tuta'],
    antonyms: [],
    collocations: ['asong gubat'],
    idioms: [],
    conjugation: [
      { tense: 'Plural', form: 'mga aso' }
    ],
    etymology: 'Proto-Malayo-Polynesian: *asu.',
    pronunciationTips: [],
  },
  {
    word: 'kain',
    ipa: '/ˈka.ʔin/',
    audio: '',
    level: 'Beginner',
    topic: 'Pagkain (Food)',
    vietnamese: 'ăn',
    shortDefinition: 'pagsubo at paglunok ng pagkain sa bibig (to eat)',
    definitions: [
      {
        partOfSpeech: 'Pandiwa (verb)',
        meaning: 'Ang proseso ng pagkuha, pagnguya, at paglunok ng pagkain (The process of taking, chewing, and swallowing food).',
        vietnamese: 'Ăn. Quá trình lấy, nhai và nuốt thức ăn.',
        examples: [
          { source: 'Gusto kong kumain ng mangga.', translation: 'Tôi muốn ăn xoài.' }
        ],
      }
    ],
    synonyms: ['kainin', 'kumain'],
    antonyms: [],
    collocations: ['kainan', 'pagkain'],
    idioms: [],
    conjugation: [
      { tense: 'Infinitive/Actor Focus', form: 'kumain' },
      { tense: 'Contemplated/Future', form: 'kakain' },
      { tense: 'Imperfective/Present', form: 'kumakain' }
    ],
    etymology: 'Proto-Austronesian: *kaen.',
    pronunciationTips: [],
  },
  {
    word: 'basa',
    ipa: '/ˈba.sa/',
    audio: '',
    level: 'Beginner',
    topic: 'Edukasyon (Education)',
    vietnamese: 'đọc',
    shortDefinition: 'pag-unawa sa mga nakasulat na titik o sagisag (to read)',
    definitions: [
      {
        partOfSpeech: 'Pandiwa (verb)',
        meaning: 'Pagtingin at pag-unawa sa kahulugan ng mga nakasulat o nakaprint na mga simbolo (To look at and understand the meaning of written or printed symbols).',
        vietnamese: 'Đọc. Nhìn và hiểu ý nghĩa của các ký hiệu được viết hoặc in.',
        examples: [
          { source: 'Nagbabasa ako ng libro.', translation: 'Tôi đang đọc một cuốn sách.' }
        ],
      }
    ],
    synonyms: ['bumasa'],
    antonyms: [],
    collocations: ['basahin', 'tagabasa'],
    idioms: [],
    conjugation: [
      { tense: 'Infinitive/Actor Focus', form: 'bumasa' },
      { tense: 'Contemplated/Future', form: 'babasa' },
      { tense: 'Imperfective/Present', form: 'nagbabasa' }
    ],
    etymology: 'Sanskrit: bhasha (speech/language).',
    pronunciationTips: [],
  }
];

const entriesByLanguage: Record<string, DictionaryEntry[]> = {
  en: dictionaryEntries,
  vi: vietnameseDictionaryEntries,
  fr: frenchDictionaryEntries,
  ar: arabicDictionaryEntries,
  he: hebrewDictionaryEntries,
  fi: finnishDictionaryEntries,
  tr: turkishDictionaryEntries,
  ja: japaneseDictionaryEntries,
  ko: koreanDictionaryEntries,
  sw: swahiliDictionaryEntries,
  hu: hungarianDictionaryEntries,
  tl: tagalogDictionaryEntries,
};

export function getLocalDictionaryEntries(languageCode: string) {
  return entriesByLanguage[languageCode] ?? [];
}

export function findLocalDictionaryEntry(languageCode: string, word: string) {
  if (languageCode === 'tr') {
    const normalizedWord = normalizeTurkishWord(word);
    return getLocalDictionaryEntries('tr').find((entry) => normalizeTurkishWord(entry.word) === normalizedWord);
  }
  const normalizedWord = normalizeLookupTerm(word);

  return getLocalDictionaryEntries(languageCode).find((entry) => normalizeLookupTerm(entry.word) === normalizedWord);
}

export function supportsLocalDictionary(languageCode: string) {
  return Boolean(entriesByLanguage[languageCode]);
}

export function normalizeLookupTerm(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function normalizeTurkishWord(value: string) {
  let res = value.trim();
  res = res.replace(/I/g, 'ı').replace(/İ/g, 'i');
  return res.toLocaleLowerCase('tr');
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
  const isTr = languageCode === 'tr';
  const normalizedWord = isTr ? normalizeTurkishWord(word) : normalizeLookupTerm(word);
  if (!normalizedWord) return [];

  const entries = getLocalDictionaryEntries(languageCode);
  const scoredEntries = entries
    .map((entry) => {
      const entryWord = isTr ? normalizeTurkishWord(entry.word) : normalizeLookupTerm(entry.word);
      const distance = levenshteinDistance(normalizedWord, entryWord);
      return { word: entry.word, distance };
    })
    .filter((item) => item.distance > 0 && item.distance <= 3) // Only reasonable suggestions
    .sort((a, b) => a.distance - b.distance);

  return scoredEntries.slice(0, limit).map((item) => item.word);
}
