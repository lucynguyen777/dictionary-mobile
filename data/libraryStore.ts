import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { DictionaryEntry, savedFolders } from '@/data/dictionary';
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

export type LibraryState = {
  folders: Folder[];
  savedWords: SavedWord[];
  searchHistory: SearchHistoryItem[];
  flashcards: Flashcard[];
};

export type ExportResult = {
  ok: boolean;
  message: string;
  uri?: string;
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
  const folders = mergeFolders(defaultState.folders, state.folders ?? []);

  return {
    folders,
    savedWords: state.savedWords ?? [],
    searchHistory: state.searchHistory ?? [],
    flashcards: state.flashcards ?? [],
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
