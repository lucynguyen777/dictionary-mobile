import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { VocabularyImportRow } from '@/data/csvImport';
import { DictionaryEntry, savedFolders } from '@/data/dictionary';
import { getStoredItem, removeStoredItem, setStoredItem } from '@/data/storageAdapter';

const STORAGE_KEY = 'dictionary-mobile.library.v1';
const FAVORITES_FOLDER_ID = 'favorites';

export type Folder = {
  id: string;
  name: string;
  color: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SavedWord = {
  id: string;
  word: string;
  ipa: string;
  definition: string;
  audio: string;
  folderIds: string[];
  note: string;
  tags: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type SearchHistoryItem = {
  word: string;
  lookedUpAt: string;
};

export type Flashcard = {
  id: string;
  wordId: string;
  type: 'bilingual' | 'word-definition' | 'definition-word' | 'word-pronunciation';
  front: string;
  back: string;
  createdAt: string;
  reviewState: 'new' | 'learning' | 'reviewed';
  // SM-2 Spaced Repetition System fields
  interval: number;
  repetition: number;
  efactor: number;
  dueDate: string;
};

export type FlashcardType = Flashcard['type'];
export type FlashcardReviewState = Flashcard['reviewState'];

export type LibraryState = {
  folders: Folder[];
  savedWords: SavedWord[];
  searchHistory: SearchHistoryItem[];
  flashcards: Flashcard[];
  deletedFolderIds: string[];
};

export type ExportResult = {
  ok: boolean;
  message: string;
  uri?: string;
};

export type ImportVocabularyTarget = {
  folderId?: string;
  folderName: string;
};

const now = () => new Date().toISOString();

export async function loadLibraryState(): Promise<LibraryState> {
  const rawState = await getStoredItem(STORAGE_KEY);

  if (!rawState) return getDefaultLibraryState();

  try {
    return normalizeLibraryState(JSON.parse(rawState) as Partial<LibraryState>);
  } catch {
    return getDefaultLibraryState();
  }
}

export async function saveLibraryState(state: LibraryState) {
  await setStoredItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearLibraryState() {
  await removeStoredItem(STORAGE_KEY);
}


export async function createFolder(state: LibraryState, name?: string) {
  const createdAt = now();
  const folder: Folder = {
    id: `folder-${Date.now()}`,
    name: name?.trim() || `New folder ${state.folders.length + 1}`,
    color: pickFolderColor(state.folders.length),
    isFavorite: false,
    createdAt,
    updatedAt: createdAt,
  };
  const nextState = {
    ...state,
    folders: [...state.folders, folder],
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function renameFolder(state: LibraryState, folderId: string, name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) return state;

  const timestamp = now();
  const nextState = {
    ...state,
    folders: state.folders.map((folder) =>
      folder.id === folderId
        ? {
            ...folder,
            name: trimmedName,
            updatedAt: timestamp,
          }
        : folder
    ),
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function toggleFavoriteFolder(state: LibraryState, folderId: string) {
  if (folderId === FAVORITES_FOLDER_ID) return state;

  const timestamp = now();
  const nextState = {
    ...state,
    folders: state.folders.map((folder) =>
      folder.id === folderId
        ? {
            ...folder,
            isFavorite: !folder.isFavorite,
            updatedAt: timestamp,
          }
        : folder
    ),
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function duplicateFolder(state: LibraryState, folderId: string) {
  const sourceFolder = state.folders.find((folder) => folder.id === folderId);
  if (!sourceFolder || folderId === FAVORITES_FOLDER_ID) return state;

  const timestamp = now();
  const copyFolder: Folder = {
    ...sourceFolder,
    id: `folder-${Date.now()}`,
    name: buildDuplicateFolderName(state.folders, sourceFolder.name),
    isFavorite: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const nextState = {
    ...state,
    folders: [copyFolder, ...state.folders],
    savedWords: state.savedWords.map((word) =>
      word.folderIds.includes(folderId)
        ? {
            ...word,
            folderIds: Array.from(new Set([...word.folderIds, copyFolder.id])),
            updatedAt: timestamp,
          }
        : word
    ),
  };

  await saveLibraryState(nextState);

  return nextState;
}

export function isFavoriteWordsFolder(folderId: string) {
  return folderId === FAVORITES_FOLDER_ID;
}

export async function deleteFolder(state: LibraryState, folderId: string) {
  if (folderId === FAVORITES_FOLDER_ID) return state;

  const timestamp = now();
  const nextState = {
    ...state,
    deletedFolderIds: Array.from(new Set([...state.deletedFolderIds, folderId])),
    folders: state.folders.filter((folder) => folder.id !== folderId),
    savedWords: state.savedWords.flatMap((word) => {
      const folderIds = word.folderIds.filter((id) => id !== folderId);

      return folderIds.length ? [{ ...word, folderIds, updatedAt: timestamp }] : [];
    }),
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function toggleFavoriteWord(state: LibraryState, entry: DictionaryEntry) {
  const savedWord = getSavedWord(state, entry.word);
  const isFavorite = Boolean(savedWord?.folderIds.includes(FAVORITES_FOLDER_ID));
  const nextState = upsertSavedWord(state, entry, FAVORITES_FOLDER_ID, savedWord?.note ?? '', isFavorite);

  await saveLibraryState(nextState);

  return nextState;
}

export async function saveWordToFolder(state: LibraryState, entry: DictionaryEntry, folderId: string, note: string) {
  const nextState = upsertSavedWord(state, entry, folderId, note, false);

  await saveLibraryState(nextState);

  return nextState;
}

export async function updateSavedWordNote(state: LibraryState, wordId: string, note: string) {
  const timestamp = now();
  const nextState = {
    ...state,
    savedWords: state.savedWords.map((word) =>
      word.id === wordId
        ? {
            ...word,
            note: note.trim(),
            updatedAt: timestamp,
          }
        : word
    ),
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function removeWordFromFolder(state: LibraryState, wordId: string, folderId: string) {
  const timestamp = now();
  const nextState = {
    ...state,
    savedWords: state.savedWords.flatMap((word) => {
      if (word.id !== wordId) return [word];

      const folderIds = word.folderIds.filter((id) => id !== folderId);
      if (!folderIds.length) return [];

      return [
        {
          ...word,
          folderIds,
          updatedAt: timestamp,
        },
      ];
    }),
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function addSearchHistory(state: LibraryState, word: string) {
  const normalizedWord = word.trim().toLowerCase();
  if (!normalizedWord) return state;

  const nextState = {
    ...state,
    searchHistory: [
      { word: normalizedWord, lookedUpAt: now() },
      ...state.searchHistory.filter((item) => item.word !== normalizedWord),
    ].slice(0, 12),
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function createFlashcardsFromSavedWords(state: LibraryState, types: FlashcardType[]) {
  const selectedTypes = Array.from(new Set(types));
  if (!selectedTypes.length || !state.savedWords.length) return state;

  const newCards = buildFlashcardsForWords(state, state.savedWords, selectedTypes);

  const nextState = {
    ...state,
    flashcards: [...newCards, ...state.flashcards],
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function createFlashcardsFromWordIds(state: LibraryState, wordIds: string[], types: FlashcardType[]) {
  const selectedTypes = Array.from(new Set(types));
  const selectedWordIds = new Set(wordIds);
  const selectedWords = state.savedWords.filter((word) => selectedWordIds.has(word.id));
  if (!selectedTypes.length || !selectedWords.length) return state;

  const newCards = buildFlashcardsForWords(state, selectedWords, selectedTypes);
  if (!newCards.length) return state;

  const nextState = {
    ...state,
    flashcards: [...newCards, ...state.flashcards],
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function updateFlashcardReviewState(state: LibraryState, cardId: string, reviewState: FlashcardReviewState) {
  const nextState = {
    ...state,
    flashcards: state.flashcards.map((card) => (card.id === cardId ? { ...card, reviewState } : card)),
  };

  await saveLibraryState(nextState);

  return nextState;
}

/**
 * SuperMemo-2 (SM-2) algorithm for flashcard spaced repetition.
 * Quality: 0-5 (0 = complete blackout, 5 = perfect response)
 */
export async function reviewFlashcard(state: LibraryState, cardId: string, quality: number) {
  const nextState = {
    ...state,
    flashcards: state.flashcards.map((card) => {
      if (card.id !== cardId) return card;

      let { interval, repetition, efactor } = card;

      // Ensure quality is within bounds
      const q = Math.max(0, Math.min(5, quality));

      if (q >= 3) {
        if (repetition === 0) {
          interval = 1;
        } else if (repetition === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * efactor);
        }
        repetition += 1;
      } else {
        repetition = 0;
        interval = 1;
      }

      efactor = efactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      if (efactor < 1.3) efactor = 1.3;

      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + interval);
      
      const reviewState: Flashcard['reviewState'] = q < 3 ? 'learning' : (interval > 14 ? 'reviewed' : 'learning');

      return {
        ...card,
        interval,
        repetition,
        efactor,
        dueDate: nextDue.toISOString(),
        reviewState,
      };
    }),
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function importVocabularyRowsToFolder(
  state: LibraryState,
  rows: VocabularyImportRow[],
  target: string | ImportVocabularyTarget
) {
  const importedRows = dedupeImportRows(rows);
  if (!importedRows.length) return state;

  const timestamp = now();
  const targetConfig = typeof target === 'string' ? { folderName: target } : target;
  const existingFolder = targetConfig.folderId
    ? state.folders.find((folder) => folder.id === targetConfig.folderId)
    : undefined;
  const folder: Folder = existingFolder
    ? { ...existingFolder, updatedAt: timestamp }
    : {
        id: `folder-${Date.now()}`,
        name: targetConfig.folderName.trim() || `Imported ${state.folders.length + 1}`,
        color: pickFolderColor(state.folders.length),
        isFavorite: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
  const savedWordsById = new Map(state.savedWords.map((word) => [word.id, word]));

  importedRows.forEach((row) => {
    const id = `word-${row.word.toLowerCase()}`;
    const existingWord = savedWordsById.get(id);
    const folderIds = Array.from(new Set([...(existingWord?.folderIds ?? []), folder.id]));

    savedWordsById.set(id, {
      id,
      word: row.word.toLowerCase(),
      ipa: row.ipa || existingWord?.ipa || '',
      definition: row.definition || existingWord?.definition || '',
      audio: existingWord?.audio ?? '',
      folderIds,
      note: row.note || existingWord?.note || '',
      tags: row.tags.length ? row.tags : existingWord?.tags ?? ['import'],
      source: 'import',
      createdAt: existingWord?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
  });

  const folders = existingFolder
    ? state.folders.map((item) => (item.id === folder.id ? folder : item))
    : [folder, ...state.folders];

  const nextState = {
    ...state,
    folders,
    savedWords: Array.from(savedWordsById.values()),
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function exportFolderToCsv(state: LibraryState, folderId: string): Promise<ExportResult> {
  const folder = state.folders.find((item) => item.id === folderId);
  if (!folder) return { ok: false, message: 'Không tìm thấy bộ từ.' };

  const words = getFolderWords(state, folderId);
  if (!words.length) return { ok: false, message: 'Bộ từ này chưa có từ đã lưu.' };

  const csv = buildFolderCsv(folder, words);
  const filename = `${slugify(folder.name)}-${Date.now()}.csv`;
  const file = new File(Paths.document, filename);
  file.create({ overwrite: true });
  file.write(csv, { encoding: 'utf8' });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return { ok: true, message: `Đã xuất ${words.length} từ.`, uri: file.uri };
}

export async function exportFolderToExcel(state: LibraryState, folderId: string): Promise<ExportResult> {
  const folder = state.folders.find((item) => item.id === folderId);
  if (!folder) return { ok: false, message: 'Không tìm thấy bộ từ.' };

  const words = getFolderWords(state, folderId);
  if (!words.length) return { ok: false, message: 'Bộ từ này chưa có từ đã lưu.' };

  const workbook = buildFolderExcelWorkbook(folder, words);
  const filename = `${slugify(folder.name)}-${Date.now()}.xls`;
  const file = new File(Paths.document, filename);
  file.create({ overwrite: true });
  file.write(workbook, { encoding: 'utf8' });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/vnd.ms-excel',
      UTI: 'com.microsoft.excel.xls',
    });
  }

  return { ok: true, message: `Đã xuất ${words.length} từ sang Excel.`, uri: file.uri };
}

export async function exportFolderToAnkiTsv(state: LibraryState, folderId: string): Promise<ExportResult> {
  const folder = state.folders.find((item) => item.id === folderId);
  if (!folder) return { ok: false, message: 'Không tìm thấy bộ từ.' };

  const words = getFolderWords(state, folderId);
  if (!words.length) return { ok: false, message: 'Bộ từ này chưa có từ đã lưu.' };

  // Anki TSV format: front<TAB>back<TAB>tags
  // front: word + IPA (if available)
  // back: definition + note (if available)
  const rows = words.map((word) => {
    const front = word.ipa ? `${word.word}\n${word.ipa}` : word.word;
    const backParts = [word.definition || ''];
    if (word.note) backParts.push(`Note: ${word.note}`);
    const back = backParts.filter(Boolean).join('\n');
    const tags = [folder.name.replace(/\s+/g, '_'), ...word.tags].join(' ');

    return [front, back, tags].map(escapeTsvCell).join('\t');
  });

  const header = '#separator:tab\n#html:false\n#notetype:Basic\n#deck:' + folder.name + '\n';
  const tsv = header + rows.join('\n');

  const filename = `${slugify(folder.name)}-anki-${Date.now()}.txt`;
  const file = new File(Paths.document, filename);
  file.create({ overwrite: true });
  file.write(tsv, { encoding: 'utf8' });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/plain',
      UTI: 'public.plain-text',
    });
  }

  return { ok: true, message: `Đã xuất ${words.length} từ sang định dạng Anki.`, uri: file.uri };
}



export async function exportFlashcardsToAnkiText(state: LibraryState, cardIds?: string[]): Promise<ExportResult> {
  const cards = cardIds && cardIds.length ? state.flashcards.filter((c) => cardIds.includes(c.id)) : state.flashcards;
  if (!cards.length) return { ok: false, message: 'Không có flashcard để xuất.' };

  const rows = buildFlashcardsAnkiRows(state, cards);
  const tsv = rows.map((row) => row.map(escapeTsvCell).join('\t')).join('\n');

  const filename = `flashcards-${Date.now()}.tsv`;
  const file = new File(Paths.document, filename);
  file.create({ overwrite: true });
  file.write(tsv, { encoding: 'utf8' });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/tab-separated-values',
      UTI: 'public.tab-separated-values-text',
    });
  }

  return { ok: true, message: `Đã xuất ${cards.length} thẻ.`, uri: file.uri };
}

function buildFlashcardsAnkiRows(state: LibraryState, cards: Flashcard[]) {
  return cards.map((card) => {
    const savedWord = state.savedWords.find((w) => w.id === card.wordId);
    const tags = savedWord ? savedWord.tags.join(' ') : '';
    const front = card.front ?? '';
    const back = card.back ?? '';

    return [front, back, tags];
  });
}

function escapeTsvCell(value: string) {
  return (value ?? '').replace(/\t/g, ' ').trim();
}

export function getDefaultLibraryState(): LibraryState {
  const timestamp = now();

  return {
    folders: savedFolders.map((folder) => ({
      id: slugify(folder.name) || `folder-${folder.name.length}`,
      name: folder.name,
      color: folder.color,
      isFavorite: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    savedWords: [],
    searchHistory: [],
    flashcards: [],
    deletedFolderIds: [],
  };
}

export function getSavedWord(state: LibraryState, word: string) {
  return state.savedWords.find((item) => item.word.toLowerCase() === word.toLowerCase());
}

export function getFolderWords(state: LibraryState, folderId: string) {
  return state.savedWords.filter((word) => word.folderIds.includes(folderId));
}

export function getFolderById(state: LibraryState, folderId: string) {
  return state.folders.find((folder) => folder.id === folderId);
}

export function getFavoriteFolderId() {
  return FAVORITES_FOLDER_ID;
}

function normalizeLibraryState(state: Partial<LibraryState>): LibraryState {
  const defaultState = getDefaultLibraryState();
  const deletedFolderIds = state.deletedFolderIds ?? [];
  const folders = mergeFolders(defaultState.folders, state.folders ?? []).filter(
    (folder) => !deletedFolderIds.includes(folder.id)
  );

  return {
    folders,
    savedWords: state.savedWords ?? [],
    searchHistory: state.searchHistory ?? [],
    flashcards: state.flashcards ?? [],
    deletedFolderIds,
  };
}

function mergeFolders(defaultFolders: Folder[], storedFolders: Folder[]) {
  const byId = new Map<string, Folder>();

  defaultFolders.forEach((folder) => byId.set(folder.id, normalizeFolder(folder)));
  storedFolders.forEach((folder) => byId.set(folder.id, normalizeFolder(folder)));

  return Array.from(byId.values());
}

function normalizeFolder(folder: Partial<Folder>): Folder {
  const timestamp = now();

  return {
    id: folder.id ?? `folder-${Date.now()}`,
    name: folder.name?.trim() || 'Untitled folder',
    color: folder.color || pickFolderColor(0),
    isFavorite: Boolean(folder.isFavorite),
    createdAt: folder.createdAt ?? timestamp,
    updatedAt: folder.updatedAt ?? folder.createdAt ?? timestamp,
  };
}

function buildDuplicateFolderName(folders: Folder[], sourceName: string) {
  const baseName = `${sourceName} copy`;
  const existingNames = new Set(folders.map((folder) => folder.name.trim().toLowerCase()));

  if (!existingNames.has(baseName.toLowerCase())) return baseName;

  let index = 2;
  let nextName = `${baseName} ${index}`;

  while (existingNames.has(nextName.toLowerCase())) {
    index += 1;
    nextName = `${baseName} ${index}`;
  }

  return nextName;
}

function upsertSavedWord(
  state: LibraryState,
  entry: DictionaryEntry,
  folderId: string,
  note: string,
  shouldRemoveFolder: boolean
) {
  const timestamp = now();
  const savedWord = getSavedWord(state, entry.word);
  const currentFolderIds = savedWord?.folderIds ?? [];
  const folderIds = shouldRemoveFolder
    ? currentFolderIds.filter((id) => id !== folderId)
    : Array.from(new Set([...currentFolderIds, folderId]));
  const nextWord: SavedWord = {
    id: savedWord?.id ?? `word-${entry.word.toLowerCase()}`,
    word: entry.word.toLowerCase(),
    ipa: entry.ipa,
    definition: entry.shortDefinition || entry.definitions[0]?.meaning || '',
    audio: entry.audio,
    folderIds,
    note: note.trim(),
    tags: [entry.level, entry.topic].filter(Boolean),
    source: 'dictionary',
    createdAt: savedWord?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  const savedWords = folderIds.length
    ? [nextWord, ...state.savedWords.filter((item) => item.id !== nextWord.id)]
    : state.savedWords.filter((item) => item.id !== nextWord.id);

  return {
    ...state,
    savedWords,
  };
}

function buildFlashcard(word: SavedWord, type: FlashcardType, id: string, createdAt: string): Flashcard {
  const definition = word.definition || 'Đang chờ định nghĩa';
  const pronunciation = word.ipa || 'Đang chờ IPA';

  const cardContent: Record<FlashcardType, Pick<Flashcard, 'front' | 'back'>> = {
    bilingual: {
      front: word.word,
      back: `${definition}${word.note ? `\nNote: ${word.note}` : ''}`,
    },
    'word-definition': {
      front: word.word,
      back: definition,
    },
    'definition-word': {
      front: definition,
      back: word.word,
    },
    'word-pronunciation': {
      front: word.word,
      back: pronunciation,
    },
  };

  return {
    id,
    wordId: word.id,
    type,
    front: cardContent[type].front,
    back: cardContent[type].back,
    createdAt,
    reviewState: 'new',
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    dueDate: createdAt,
  };
}

function buildFlashcardsForWords(state: LibraryState, words: SavedWord[], selectedTypes: FlashcardType[]) {
  const existingIds = new Set(state.flashcards.map((card) => card.id));
  const createdAt = now();

  return words.flatMap((word) =>
    selectedTypes.flatMap((type) => {
      const id = `flashcard-${word.id}-${type}`;
      if (existingIds.has(id)) return [];

      return [buildFlashcard(word, type, id, createdAt)];
    })
  );
}

function dedupeImportRows(rows: VocabularyImportRow[]) {
  const byWord = new Map<string, VocabularyImportRow>();

  rows.forEach((row) => {
    const normalizedWord = row.word.trim().toLowerCase();
    if (!normalizedWord) return;

    byWord.set(normalizedWord, { ...row, word: normalizedWord });
  });

  return Array.from(byWord.values());
}

function buildFolderCsv(folder: Folder, words: SavedWord[]) {
  const rows = buildFolderExportRows(folder, words);

  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

function buildFolderExcelWorkbook(folder: Folder, words: SavedWord[]) {
  const rows = buildFolderExportRows(folder, words);
  const tableRows = rows
    .map((row, index) => {
      const cellTag = index === 0 ? 'th' : 'td';
      const cells = row.map((cell) => `<${cellTag}>${escapeHtmlCell(cell)}</${cellTag}>`).join('');

      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; }
    th, td { border: 1px solid #d9e2ec; padding: 6px 8px; mso-number-format:"\\@"; }
    th { background: #eaf1ff; font-weight: 700; }
  </style>
</head>
<body>
  <table>${tableRows}</table>
</body>
</html>`;
}

function buildFolderExportRows(folder: Folder, words: SavedWord[]) {
  return [
    ['word', 'ipa', 'definition', 'note', 'folder', 'tags', 'createdAt'],
    ...words.map((word) => [
      word.word,
      word.ipa,
      word.definition,
      word.note,
      folder.name,
      word.tags.join('|'),
      word.createdAt,
    ]),
  ];
}

function escapeCsvCell(value: string) {
  const escapedValue = value.replace(/"/g, '""');

  return `"${escapedValue}"`;
}

function escapeHtmlCell(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pickFolderColor(index: number) {
  const colors = ['#E8F0FF', '#EAF8F0', '#FFF1E8', '#F1ECFF', '#FFEFF3', '#EAF7FA'];

  return colors[index % colors.length];
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
