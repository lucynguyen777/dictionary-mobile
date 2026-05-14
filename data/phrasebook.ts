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
  {
    phrase: 'look up',
    type: 'phrasal verb',
    meaning: 'To search for information in a reference or online.',
    example: 'I looked up the new vocabulary in my dictionary.',
    triggers: ['search', 'dictionary', 'find', 'lookup'],
    backlinks: ['look', 'search', 'dictionary'],
  },
  {
    phrase: 'look forward to',
    type: 'phrasal verb',
    meaning: 'To be excited about a future event.',
    example: 'I look forward to our next lesson.',
    triggers: ['anticipate', 'expect', 'excited'],
    backlinks: ['look', 'anticipate', 'expect'],
  },
  {
    phrase: 'get along with',
    type: 'phrasal verb',
    meaning: 'To have a friendly relationship with someone.',
    example: 'He gets along with his classmates very well.',
    triggers: ['relationship', 'friendly', 'cooperate'],
    backlinks: ['get', 'along', 'relationship'],
  },
  {
    phrase: 'get over',
    type: 'phrasal verb',
    meaning: 'To recover from an illness, loss, or disappointment.',
    example: 'It took her a while to get over the flu.',
    triggers: ['recover', 'heal', 'overcome'],
    backlinks: ['get', 'recover', 'overcome'],
  },
  {
    phrase: 'break down',
    type: 'phrasal verb',
    meaning: 'To analyze something by separating it into parts; or to stop working.',
    example: 'Let’s break down the problem into smaller steps.',
    triggers: ['analyze', 'explain', 'separate'],
    backlinks: ['break', 'analyze', 'problem'],
  },
  {
    phrase: 'break the ice',
    type: 'idiom',
    meaning: 'To do or say something to relieve tension or get conversation going.',
    example: 'He told a joke to break the ice at the meeting.',
    triggers: ['social', 'introduce', 'conversation'],
    backlinks: ['break', 'ice', 'introduce'],
  },
  {
    phrase: 'call it a day',
    type: 'idiom',
    meaning: 'To stop working on something, usually for the rest of the day.',
    example: 'We finished enough work, let’s call it a day.',
    triggers: ['stop', 'finish', 'rest'],
    backlinks: ['call', 'day', 'finish'],
  },
  {
    phrase: 'call off',
    type: 'phrasal verb',
    meaning: 'To cancel an event or arrangement.',
    example: 'They called off the meeting due to the weather.',
    triggers: ['cancel', 'postpone', 'stop'],
    backlinks: ['call', 'cancel', 'meeting'],
  },
  {
    phrase: 'cut corners',
    type: 'idiom',
    meaning: 'To do something in a cheap or quick way that may result in poor quality.',
    example: 'Don’t cut corners when preparing for the exam.',
    triggers: ['save', 'cheap', 'quality'],
    backlinks: ['cut', 'corner', 'cheap'],
  },
  {
    phrase: 'come up with',
    type: 'phrasal verb',
    meaning: 'To think of an idea or plan.',
    example: 'She came up with a clever solution to the problem.',
    triggers: ['invent', 'idea', 'plan'],
    backlinks: ['come', 'up', 'idea'],
  },
  {
    phrase: 'come across',
    type: 'phrasal verb',
    meaning: 'To find something by chance or to seem to be a certain way.',
    example: 'I came across an interesting article online.',
    triggers: ['discover', 'find', 'seem'],
    backlinks: ['come', 'across', 'discover'],
  },
  {
    phrase: 'figure out',
    type: 'phrasal verb',
    meaning: 'To understand or solve something.',
    example: 'Can you figure out how this grammar point works?',
    triggers: ['understand', 'solve', 'work out'],
    backlinks: ['figure', 'understand', 'solve'],
  },
  {
    phrase: 'go over',
    type: 'phrasal verb',
    meaning: 'To review or explain something.',
    example: 'Let’s go over the homework before the test.',
    triggers: ['review', 'explain', 'check'],
    backlinks: ['go', 'over', 'review'],
  },
  {
    phrase: 'hand in',
    type: 'phrasal verb',
    meaning: 'To submit something (e.g., homework, an assignment).',
    example: 'Please hand in your essays by Friday.',
    triggers: ['submit', 'turn in', 'deliver'],
    backlinks: ['hand', 'submit', 'assignment'],
  },
  {
    phrase: 'hand out',
    type: 'phrasal verb',
    meaning: 'To give things to people in a group.',
    example: 'The teacher handed out the quizzes.',
    triggers: ['distribute', 'give', 'share'],
    backlinks: ['hand', 'distribute', 'give'],
  },
  {
    phrase: 'hold on',
    type: 'phrasal verb',
    meaning: 'To wait for a short time; or to keep holding something.',
    example: 'Hold on a minute, I’ll be right back.',
    triggers: ['wait', 'pause', 'hold'],
    backlinks: ['hold', 'wait', 'pause'],
  },
  {
    phrase: 'look into',
    type: 'phrasal verb',
    meaning: 'To investigate or examine something.',
    example: 'The team will look into the reported issue.',
    triggers: ['investigate', 'research', 'check'],
    backlinks: ['look', 'investigate', 'check'],
  },
  {
    phrase: 'make up',
    type: 'phrasal verb',
    meaning: 'To invent a story or to form something by combining parts.',
    example: 'She made up a story to explain her lateness.',
    triggers: ['invent', 'create', 'compose'],
    backlinks: ['make', 'invent', 'create'],
  },
  {
    phrase: 'put off',
    type: 'phrasal verb',
    meaning: 'To postpone or delay something.',
    example: 'We had to put off the meeting until next week.',
    triggers: ['postpone', 'delay', 'reschedule'],
    backlinks: ['put', 'off', 'postpone'],
  },
  {
    phrase: 'run out of',
    type: 'phrasal verb',
    meaning: 'To have no more of something.',
    example: 'We ran out of paper in the printer.',
    triggers: ['lack', 'empty', 'shortage'],
    backlinks: ['run', 'out', 'empty'],
  },
  {
    phrase: 'set up',
    type: 'phrasal verb',
    meaning: 'To establish or arrange something.',
    example: 'They set up a study group for exam prep.',
    triggers: ['arrange', 'establish', 'organize'],
    backlinks: ['set', 'up', 'arrange'],
  },
  {
    phrase: 'turn up',
    type: 'phrasal verb',
    meaning: 'To appear unexpectedly or to increase volume/level.',
    example: 'She turned up at the party late.',
    triggers: ['appear', 'increase', 'arrive'],
    backlinks: ['turn', 'appear', 'arrive'],
  },
  {
    phrase: 'turn down',
    type: 'phrasal verb',
    meaning: 'To refuse something or to decrease volume/level.',
    example: 'He turned down the job offer.',
    triggers: ['refuse', 'decline', 'lower'],
    backlinks: ['turn', 'refuse', 'decline'],
  },
  {
    phrase: 'take off',
    type: 'phrasal verb',
    meaning: 'To become successful or to leave the ground (for planes).',
    example: 'Her career really took off after the new album.',
    triggers: ['succeed', 'leave', 'depart'],
    backlinks: ['take', 'off', 'succeed'],
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
