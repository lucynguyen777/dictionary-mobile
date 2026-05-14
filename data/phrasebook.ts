export type PhrasebookItem = {
  phrase: string;
  type: 'collocation' | 'idiom' | 'phrasal verb';
  meaning: string;
  example: string;
  triggers: string[];
  backlinks: string[];
};

export const phrasebookItems: PhrasebookItem[] = [
  {
    phrase: 'put into words',
    type: 'idiom',
    meaning: 'To express a thought or feeling clearly in language.',
    example: 'It was difficult to put the experience into words.',
    triggers: ['articulate', 'express', 'describe', 'explain'],
    backlinks: ['put', 'words', 'express'],
  },
  {
    phrase: 'spell out',
    type: 'phrasal verb',
    meaning: 'To explain something in a very clear and detailed way.',
    example: 'The teacher spelled out the difference between the two meanings.',
    triggers: ['articulate', 'explain', 'clarify'],
    backlinks: ['spell', 'explain', 'clarify'],
  },
  {
    phrase: 'bounce back',
    type: 'phrasal verb',
    meaning: 'To recover quickly after a difficult period.',
    example: 'She bounced back after a stressful semester.',
    triggers: ['resilient', 'recover', 'recovery'],
    backlinks: ['bounce', 'recover', 'resilient'],
  },
  {
    phrase: 'weather the storm',
    type: 'idiom',
    meaning: 'To survive a difficult situation without giving up.',
    example: 'The company weathered the storm and returned to growth.',
    triggers: ['resilient', 'difficulty', 'survive'],
    backlinks: ['weather', 'storm', 'survive'],
  },
  {
    phrase: 'read between the lines',
    type: 'idiom',
    meaning: 'To understand an implied meaning that is not stated directly.',
    example: "You have to read between the lines to catch the author's attitude.",
    triggers: ['nuance', 'imply', 'subtle'],
    backlinks: ['read', 'line', 'imply'],
  },
  {
    phrase: 'fine distinction',
    type: 'collocation',
    meaning: 'A very small but important difference between ideas.',
    example: 'The article makes a fine distinction between confidence and arrogance.',
    triggers: ['nuance', 'distinction', 'subtlety'],
    backlinks: ['fine', 'distinction', 'subtle'],
  },
  {
    phrase: 'dive into',
    type: 'phrasal verb',
    meaning: 'To start doing or studying something with energy.',
    example: 'This weekend, I want to dive into a new English book.',
    triggers: ['immerse', 'study', 'learn'],
    backlinks: ['dive', 'study', 'learn'],
  },
  {
    phrase: 'soak up',
    type: 'phrasal verb',
    meaning: 'To absorb information, language, or atmosphere deeply.',
    example: 'Try to soak up natural phrases from podcasts.',
    triggers: ['immerse', 'absorb', 'learn'],
    backlinks: ['soak', 'absorb', 'learn'],
  },
  {
    phrase: 'pragmatic approach',
    type: 'collocation',
    meaning: 'A practical way of dealing with a problem.',
    example: 'A pragmatic approach helped the team finish the project on time.',
    triggers: ['pragmatic', 'practical', 'realistic'],
    backlinks: ['approach', 'practical', 'realistic'],
  },
  {
    phrase: 'keep your feet on the ground',
    type: 'idiom',
    meaning: 'To stay realistic and sensible.',
    example: 'Even after the success, she kept her feet on the ground.',
    triggers: ['pragmatic', 'realistic', 'sensible'],
    backlinks: ['realistic', 'sensible', 'practical'],
  },
];

export function getPhrasebookItems(word: string) {
  const normalizedWord = normalizePhraseLookup(word);

  return phrasebookItems.filter((item) => {
    const normalizedPhrase = normalizePhraseLookup(item.phrase);
    const triggers = item.triggers.map(normalizePhraseLookup);

    return normalizedPhrase === normalizedWord || triggers.includes(normalizedWord);
  });
}

function normalizePhraseLookup(value: string) {
  return value.trim().toLowerCase();
}
