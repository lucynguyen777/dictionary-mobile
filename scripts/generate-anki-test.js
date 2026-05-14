const fs = require('fs');
const path = require('path');

function escapeTsvCell(value) {
  return (value ?? '').replace(/\t/g, ' ').trim();
}

function buildFlashcardsAnkiRows(state, cards) {
  return cards.map((card) => {
    const savedWord = state.savedWords.find((w) => w.id === card.wordId);
    const tags = savedWord ? savedWord.tags.join(' ') : '';
    const front = card.front ?? '';
    const back = card.back ?? '';

    return [front, back, tags];
  });
}

function run() {
  const now = new Date().toISOString();

  const state = {
    savedWords: [
      {
        id: 'word-hello',
        word: 'hello',
        ipa: 'həˈloʊ',
        definition: 'A greeting',
        audio: '',
        folderIds: ['folder-1'],
        note: 'common greeting',
        tags: ['greeting'],
        source: 'import',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'word-world',
        word: 'world',
        ipa: 'wɜːrld',
        definition: 'The earth, together with all of its countries and peoples',
        audio: '',
        folderIds: ['folder-1'],
        note: '',
        tags: ['noun'],
        source: 'import',
        createdAt: now,
        updatedAt: now,
      },
    ],
    flashcards: [
      { id: 'flashcard-word-hello-bilingual', wordId: 'word-hello', type: 'bilingual', front: 'hello', back: 'A greeting\nNote: common greeting', createdAt: now, reviewState: 'new' },
      { id: 'flashcard-word-world-def', wordId: 'word-world', type: 'word-definition', front: 'world', back: 'The earth, together with all of its countries and peoples', createdAt: now, reviewState: 'new' },
    ],
  };

  const rows = buildFlashcardsAnkiRows(state, state.flashcards);
  const tsv = rows.map((row) => row.map(escapeTsvCell).join('\t')).join('\n');

  const outDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const filename = `flashcards-test-${Date.now()}.tsv`;
  const filepath = path.join(outDir, filename);

  fs.writeFileSync(filepath, tsv, 'utf8');

  console.log('WROTE', filepath);
  console.log('--- CONTENT START ---');
  console.log(tsv);
  console.log('--- CONTENT END ---');
}

run();
