import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { DictionaryEntry, savedFolders } from '@/data/dictionary';
import type { VocabularyImportRow } from '@/data/csvImport';
import { getStoredItem, setStoredItem } from '@/data/storageAdapter';

const STORAGE_KEY = 'dictionary-mobile.library.v1';
const FAVORITES_FOLDER_ID = 'favorites';

export type Folder = {
  id: string;
  name: string;
  color: string;
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

export async function createFolder(state: LibraryState, name?: string) {
  const createdAt = now();
  const folder: Folder = {
    id: `folder-${Date.now()}`,
    name: name?.trim() || `New folder ${state.folders.length + 1}`,
    color: pickFolderColor(state.folders.length),
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
  if (!folder) return { ok: false, message: 'Folder not found.' };

  const words = getFolderWords(state, folderId);
  if (!words.length) return { ok: false, message: 'This folder has no saved words yet.' };

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

  return { ok: true, message: `Exported ${words.length} words.`, uri: file.uri };
}

export function getDefaultLibraryState(): LibraryState {
  const timestamp = now();

  return {
    folders: savedFolders.map((folder) => ({
      id: slugify(folder.name) || `folder-${folder.name.length}`,
      name: folder.name,
      color: folder.color,
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

  defaultFolders.forEach((folder) => byId.set(folder.id, folder));
  storedFolders.forEach((folder) => byId.set(folder.id, folder));

  return Array.from(byId.values());
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
  const definition = word.definition || 'Definition pending';
  const pronunciation = word.ipa || 'IPA pending';

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
  const rows = [
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

  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

function escapeCsvCell(value: string) {
  const escapedValue = value.replace(/"/g, '""');

  return `"${escapedValue}"`;
}

function pickFolderColor(index: number) {
  const colors = ['#E8F0FF', '#EAF8F0', '#FFF1E8', '#F1ECFF', '#FFEFF3', '#EAF7FA'];

  return colors[index % colors.length];
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
