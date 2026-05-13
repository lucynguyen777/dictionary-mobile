export type DictionaryEntry = {
  word: string;
  ipa: string;
  audio: string;
  level: string;
  topic: string;
  vietnamese: string;
  shortDefinition: string;
  definitions: {
    partOfSpeech: string;
    meaning: string;
    vietnamese: string;
    examples: string[];
  }[];
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  idioms: {
    phrase: string;
    meaning: string;
  }[];
  conjugation: {
    tense: string;
    form: string;
  }[];
  etymology: string;
  pronunciationTips: {
    phoneme: string;
    model: number;
    learner: number;
    note: string;
  }[];
};

export const dictionaryEntries: DictionaryEntry[] = [
  {
    word: 'articulate',
    ipa: '/ɑːrˈtɪkjələt/',
    audio: 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/articulate--_gb_1.mp3',
    level: 'B2',
    topic: 'Communication',
    vietnamese: 'diễn đạt rõ ràng',
    shortDefinition: 'able to express ideas clearly and effectively',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Able to explain thoughts or feelings in a clear, confident way.',
        vietnamese: 'Có khả năng diễn đạt suy nghĩ hoặc cảm xúc một cách rõ ràng.',
        examples: [
          'She is an articulate speaker during client meetings.',
          'The essay was concise, articulate, and persuasive.',
        ],
      },
      {
        partOfSpeech: 'verb',
        meaning: 'To say or describe an idea clearly.',
        vietnamese: 'Diễn đạt hoặc trình bày một ý tưởng rõ ràng.',
        examples: [
          'Try to articulate the problem before proposing a solution.',
          'He articulated each sound slowly for the class.',
        ],
      },
    ],
    synonyms: ['eloquent', 'expressive', 'fluent', 'well-spoken'],
    antonyms: ['inarticulate', 'unclear', 'mumbled'],
    collocations: ['articulate a vision', 'articulate clearly', 'highly articulate'],
    idioms: [{ phrase: 'put into words', meaning: 'to express a feeling or idea verbally' }],
    conjugation: [
      { tense: 'Present', form: 'articulate / articulates' },
      { tense: 'Past', form: 'articulated' },
      { tense: 'Continuous', form: 'articulating' },
    ],
    etymology: 'From Latin articulare, meaning to divide into distinct parts or speak distinctly.',
    pronunciationTips: [
      { phoneme: '/ɑːr/', model: 94, learner: 88, note: 'Keep the first vowel open and steady.' },
      { phoneme: '/tɪk/', model: 91, learner: 84, note: 'Release the /t/ lightly before the short vowel.' },
      { phoneme: '/jələt/', model: 89, learner: 80, note: 'Reduce the final syllables instead of stressing each one.' },
    ],
  },
  {
    word: 'resilient',
    ipa: '/rɪˈzɪliənt/',
    audio: 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/resilient--_gb_1.mp3',
    level: 'B2',
    topic: 'Mindset',
    vietnamese: 'kiên cường',
    shortDefinition: 'able to recover quickly after difficulty or change',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Strong enough to recover after stress, pressure, or failure.',
        vietnamese: 'Đủ mạnh mẽ để phục hồi sau áp lực, khó khăn hoặc thất bại.',
        examples: [
          'A resilient team learns quickly after a setback.',
          'The material is light, flexible, and resilient.',
        ],
      },
    ],
    synonyms: ['adaptable', 'tough', 'durable', 'flexible'],
    antonyms: ['fragile', 'rigid', 'vulnerable'],
    collocations: ['resilient mindset', 'resilient economy', 'emotionally resilient'],
    idioms: [{ phrase: 'bounce back', meaning: 'to recover after a difficult experience' }],
    conjugation: [{ tense: 'Comparative', form: 'more resilient / most resilient' }],
    etymology: 'From Latin resilire, meaning to leap back or rebound.',
    pronunciationTips: [
      { phoneme: '/rɪ/', model: 92, learner: 86, note: 'Start with a short, relaxed /rɪ/ sound.' },
      { phoneme: '/zɪl/', model: 90, learner: 79, note: 'Voice the /z/ clearly.' },
      { phoneme: '/iənt/', model: 88, learner: 82, note: 'Blend the final vowel smoothly.' },
    ],
  },
  {
    word: 'nuance',
    ipa: '/ˈnjuːɑːns/',
    audio: 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/nuance--_gb_1.mp3',
    level: 'C1',
    topic: 'Academic',
    vietnamese: 'sắc thái tinh tế',
    shortDefinition: 'a small difference in meaning, tone, or feeling',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: 'A subtle distinction that changes how something is understood.',
        vietnamese: 'Một khác biệt tinh tế làm thay đổi cách hiểu sự việc.',
        examples: [
          'The translation missed the nuance of the original sentence.',
          'Good readers notice nuance in tone and context.',
        ],
      },
    ],
    synonyms: ['subtlety', 'shade', 'distinction', 'refinement'],
    antonyms: ['obviousness', 'simplicity'],
    collocations: ['cultural nuance', 'subtle nuance', 'miss the nuance'],
    idioms: [{ phrase: 'read between the lines', meaning: 'to understand implied meaning' }],
    conjugation: [{ tense: 'Plural', form: 'nuances' }],
    etymology: 'Borrowed from French nuance, originally meaning shade or slight variation.',
    pronunciationTips: [
      { phoneme: '/njuː/', model: 93, learner: 85, note: 'Glide from /n/ into /juː/.' },
      { phoneme: '/ɑːns/', model: 89, learner: 81, note: 'Keep the final /s/ crisp.' },
    ],
  },
  {
    word: 'immerse',
    ipa: '/ɪˈmɜːrs/',
    audio: 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/immerse--_gb_1.mp3',
    level: 'B2',
    topic: 'Learning',
    vietnamese: 'đắm mình vào',
    shortDefinition: 'to become deeply involved in an activity or subject',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: 'To involve yourself completely in something.',
        vietnamese: 'Tham gia hoặc tập trung hoàn toàn vào một điều gì đó.',
        examples: [
          'Immerse yourself in English podcasts for better listening.',
          'The app helps learners immerse in vocabulary every day.',
        ],
      },
    ],
    synonyms: ['absorb', 'engage', 'submerge', 'involve'],
    antonyms: ['withdraw', 'detach', 'ignore'],
    collocations: ['immerse yourself', 'fully immerse', 'immerse in a language'],
    idioms: [{ phrase: 'dive into', meaning: 'to start doing something with energy' }],
    conjugation: [
      { tense: 'Present', form: 'immerse / immerses' },
      { tense: 'Past', form: 'immersed' },
      { tense: 'Continuous', form: 'immersing' },
    ],
    etymology: 'From Latin immergere, meaning to dip or plunge into.',
    pronunciationTips: [
      { phoneme: '/ɪ/', model: 91, learner: 87, note: 'Use a short first vowel.' },
      { phoneme: '/mɜːrs/', model: 90, learner: 78, note: 'Lengthen /ɜːr/ before the final /s/.' },
    ],
  },
  {
    word: 'pragmatic',
    ipa: '/præɡˈmætɪk/',
    audio: 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/pragmatic--_gb_1.mp3',
    level: 'C1',
    topic: 'Business',
    vietnamese: 'thực tế',
    shortDefinition: 'focused on practical results rather than theory',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Solving problems in a sensible way based on real conditions.',
        vietnamese: 'Giải quyết vấn đề dựa trên điều kiện thực tế.',
        examples: [
          'The manager suggested a pragmatic compromise.',
          'A pragmatic learner studies the words they actually need.',
        ],
      },
    ],
    synonyms: ['practical', 'realistic', 'sensible', 'down-to-earth'],
    antonyms: ['idealistic', 'impractical', 'theoretical'],
    collocations: ['pragmatic approach', 'pragmatic solution', 'remain pragmatic'],
    idioms: [{ phrase: 'feet on the ground', meaning: 'to be realistic and practical' }],
    conjugation: [{ tense: 'Adverb', form: 'pragmatically' }],
    etymology: 'From Greek pragmatikos, connected with action, affairs, and practical matters.',
    pronunciationTips: [
      { phoneme: '/præɡ/', model: 92, learner: 86, note: 'Keep the consonant cluster compact.' },
      { phoneme: '/mætɪk/', model: 90, learner: 82, note: 'Stress the second syllable.' },
    ],
  },
];

export const savedFolders = [
  { name: 'IELTS Speaking', words: 42, color: '#E8F0FF' },
  { name: 'Business English', words: 36, color: '#EAF8F0' },
  { name: 'Academic verbs', words: 28, color: '#FFF1E8' },
  { name: 'Travel phrases', words: 19, color: '#F1ECFF' },
  { name: 'Favorites', words: 64, color: '#FFEFF3' },
  { name: 'Daily review', words: 15, color: '#EAF7FA' },
];

export const studyStats = {
  streak: 12,
  mastered: 128,
  dueToday: 18,
  listeningScore: 86,
};
