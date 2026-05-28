import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { VocabularyImportRow } from './csvImport';
import { DictionaryEntry, savedFolders } from './dictionary';
import { getStoredItem, removeStoredItem, setStoredItem } from './storageAdapter';

const STORAGE_KEY = 'dictionary-mobile.library.v1';
const FAVORITES_FOLDER_ID = 'favorites';

export type Folder = {
  id: string;
  name: string;
  color: string;
  colorNote?: string;
  tags: string[];
  avatarUri?: string;
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
  finalStatus?: 'started' | 'in_progress' | 'completed';
  completedAt?: string | null;
  // SM-2 Spaced Repetition System fields
  interval: number;
  repetition: number;
  efactor: number;
  dueDate: string;
  // Sync state management
  syncStatus?: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
  lastSyncedAt?: string | null;
  version?: number;
};

export type FlashcardType = Flashcard['type'];
export type FlashcardReviewState = Flashcard['reviewState'];
export type FlashcardFinalStatus = NonNullable<Flashcard['finalStatus']>;

export type FlashcardReviewEvent = {
  id: string;
  flashcardId: string;
  wordId: string;
  quality: number;
  reviewedAt: string;
  scheduledDueDateAfterReview: string;
};

export type FlashcardLearningSettings = {
  completionMinAverageQuality: number;
  completionMinReviewCount: number;
};

export type LibraryState = {
  folders: Folder[];
  savedWords: SavedWord[];
  searchHistory: SearchHistoryItem[];
  flashcards: Flashcard[];
  flashcardReviewEvents?: FlashcardReviewEvent[];
  flashcardLearningSettings?: FlashcardLearningSettings;
  deletedFolderIds: string[];
};

export type ExportResult = {
  ok: boolean;
  message: string;
  uri?: string;
  shared?: boolean;
};

export type FolderExportFormat = 'csv' | 'excel' | 'anki';

const folderShareMimeTypes: Record<FolderExportFormat, { mimeType: string; UTI: string }> = {
  csv: { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' },
  excel: { mimeType: 'application/vnd.ms-excel', UTI: 'com.microsoft.excel.xls' },
  anki: { mimeType: 'text/plain', UTI: 'public.plain-text' },
};

export type ImportVocabularyTarget = {
  folderId?: string;
  folderName: string;
  color?: string;
  colorNote?: string;
  tags?: string[];
  avatarUri?: string;
};

const now = () => new Date().toISOString();

export async function loadLibraryState(): Promise<LibraryState> {
  try {
    const { loadLibraryStateFromUserDatabase } = await import('./userDatabaseRuntime');
    return await loadLibraryStateFromUserDatabase();
  } catch {
    return loadLibraryStateFromAsyncStorage();
  }
}

export async function loadLibraryStateFromAsyncStorage(): Promise<LibraryState> {
  const rawState = await getStoredItem(STORAGE_KEY);

  if (!rawState) return getDefaultLibraryState();

  try {
    return normalizeLibraryState(JSON.parse(rawState) as Partial<LibraryState>);
  } catch {
    return getDefaultLibraryState();
  }
}

export async function saveLibraryState(state: LibraryState) {
  try {
    const { saveLibraryStateToUserDatabase } = await import('./userDatabaseRuntime');
    await saveLibraryStateToUserDatabase(state);
  } catch {
    // AsyncStorage remains the recoverable source when SQLite is unavailable.
  }

  await saveLibraryStateToAsyncStorage(state);
}

export async function saveLibraryStateToAsyncStorage(state: LibraryState) {
  await setStoredItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearLibraryState() {
  try {
    const { clearLibraryStateFromUserDatabase } = await import('./userDatabaseRuntime');
    await clearLibraryStateFromUserDatabase();
  } catch {
    // Local reset must still work if SQLite cannot open.
  }

  await clearLibraryStateFromAsyncStorage();
}

export async function clearLibraryStateFromAsyncStorage() {
  await removeStoredItem(STORAGE_KEY);
}


export async function createFolder(
  state: LibraryState,
  name?: string,
  options?: { color?: string; colorNote?: string; tags?: string[]; avatarUri?: string }
) {
  const createdAt = now();
  const folder: Folder = {
    id: `folder-${Date.now()}`,
    name: name?.trim() || `New folder ${state.folders.length + 1}`,
    color: options?.color || pickFolderColor(state.folders.length),
    colorNote: options?.colorNote?.trim() || '',
    tags: normalizeFolderTags(options?.tags),
    avatarUri: options?.avatarUri?.trim() || '',
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

export async function updateFolderColor(state: LibraryState, folderId: string, color: string) {
  const timestamp = now();
  const nextState = {
    ...state,
    folders: state.folders.map((folder) =>
      folder.id === folderId
        ? {
            ...folder,
            color,
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

export async function updateFlashcardReviewState(
  state: LibraryState,
  cardId: string,
  reviewState: FlashcardReviewState
): Promise<LibraryState> {
  const nextState = {
    ...state,
    flashcards: state.flashcards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            reviewState,
            syncStatus: getPendingFlashcardSyncStatus(card),
            version: (card.version || 1) + 1,
          }
        : card
    ),
  };

  await saveLibraryState(nextState);

  return nextState;
}

/**
 * SuperMemo-2 (SM-2) algorithm for flashcard spaced repetition.
 * Quality: 0-5 (0 = complete blackout, 5 = perfect response)
 */
export async function reviewFlashcard(state: LibraryState, cardId: string, quality: number): Promise<LibraryState> {
  const reviewedAt = now();
  const flashcardReviewEvents = state.flashcardReviewEvents ?? [];
  const flashcardLearningSettings = normalizeFlashcardLearningSettings(state.flashcardLearningSettings);
  let reviewEvent: FlashcardReviewEvent | null = null;
  const nextState: LibraryState = {
    ...state,
    flashcardLearningSettings,
    flashcardReviewEvents,
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
      const nextDueDate = nextDue.toISOString();
      
      const reviewState: Flashcard['reviewState'] = q < 3 ? 'learning' : (interval > 14 ? 'reviewed' : 'learning');
      reviewEvent = {
        id: `flashcard-review-${card.id}-${reviewedAt}`,
        flashcardId: card.id,
        wordId: card.wordId,
        quality: q,
        reviewedAt,
        scheduledDueDateAfterReview: nextDueDate,
      };
      const cardEvents = [...flashcardReviewEvents.filter((event) => event.flashcardId === card.id), reviewEvent];
      const averageQuality = cardEvents.reduce((sum, event) => sum + event.quality, 0) / cardEvents.length;
      const alreadyCompleted = card.finalStatus === 'completed';
      const shouldComplete =
        averageQuality >= flashcardLearningSettings.completionMinAverageQuality &&
        cardEvents.length >= flashcardLearningSettings.completionMinReviewCount;

      return {
        ...card,
        completedAt: alreadyCompleted ? card.completedAt ?? reviewedAt : shouldComplete ? reviewedAt : card.completedAt ?? null,
        interval,
        repetition,
        efactor,
        dueDate: nextDueDate,
        finalStatus: alreadyCompleted || shouldComplete ? 'completed' : 'in_progress',
        reviewState,
        syncStatus: getPendingFlashcardSyncStatus(card),
        version: (card.version || 1) + 1,
      };
    }),
  };

  if (reviewEvent) {
    nextState.flashcardReviewEvents = [...flashcardReviewEvents, reviewEvent];
  }

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
    ? {
        ...existingFolder,
        color: targetConfig.color || existingFolder.color,
        colorNote: targetConfig.colorNote ?? existingFolder.colorNote ?? '',
        tags: targetConfig.tags ? normalizeFolderTags(targetConfig.tags) : existingFolder.tags,
        avatarUri: targetConfig.avatarUri?.trim() ?? existingFolder.avatarUri ?? '',
        updatedAt: timestamp,
      }
    : {
        id: `folder-${Date.now()}`,
        name: targetConfig.folderName.trim() || `Imported ${state.folders.length + 1}`,
        color: targetConfig.color || pickFolderColor(state.folders.length),
        colorNote: targetConfig.colorNote?.trim() || '',
        tags: normalizeFolderTags(targetConfig.tags),
        avatarUri: targetConfig.avatarUri?.trim() || '',
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

  return { ok: true, message: `Đã xuất ${words.length} từ ra file CSV trên thiết bị.`, uri: file.uri };
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

  return { ok: true, message: `Đã xuất ${words.length} từ sang Excel trên thiết bị.`, uri: file.uri };
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

  return { ok: true, message: `Đã xuất ${words.length} từ sang định dạng Anki trên thiết bị.`, uri: file.uri };
}

export async function shareFolder(
  state: LibraryState,
  folderId: string,
  format: FolderExportFormat
): Promise<ExportResult> {
  const exportResult =
    format === 'excel'
      ? await exportFolderToExcel(state, folderId)
      : format === 'anki'
        ? await exportFolderToAnkiTsv(state, folderId)
        : await exportFolderToCsv(state, folderId);

  if (!exportResult.ok || !exportResult.uri) return exportResult;

  if (!(await Sharing.isAvailableAsync())) {
    return {
      ok: true,
      shared: false,
      uri: exportResult.uri,
      message:
        'Thiết bị hoặc trình duyệt này chưa hỗ trợ hộp thoại chia sẻ hệ thống. File đã được tạo; bạn có thể dùng mục Download để lưu file trên thiết bị.',
    };
  }

  const shareConfig = folderShareMimeTypes[format];
  await Sharing.shareAsync(exportResult.uri, shareConfig);

  const formatLabel = format === 'excel' ? 'Excel' : format === 'anki' ? 'Anki' : 'CSV';

  return {
    ok: true,
    shared: true,
    uri: exportResult.uri,
    message: `Đã mở hộp thoại chia sẻ file ${formatLabel}.`,
  };
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

  return { ok: true, message: `Đã xuất ${cards.length} thẻ ra file trên thiết bị.`, uri: file.uri };
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

export function getPendingFlashcards(state: LibraryState) {
  return state.flashcards.filter((card) => card.syncStatus && card.syncStatus !== 'synced');
}

export async function markFlashcardSynced(state: LibraryState, cardId: string, timestamp: string) {
  const nextState = {
    ...state,
    flashcards: state.flashcards.flatMap((card) => {
      if (card.id !== cardId) return [card];
      if (card.syncStatus === 'pending_delete') return []; // Physically delete when synced

      return [
        {
          ...card,
          syncStatus: 'synced' as const,
          lastSyncedAt: timestamp,
        },
      ];
    }),
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function deleteFlashcard(state: LibraryState, cardId: string) {
  const card = state.flashcards.find((c) => c.id === cardId);
  if (!card) return state;

  const nextState = {
    ...state,
    flashcards: state.flashcards.map((c) =>
      c.id === cardId
        ? {
            ...c,
            syncStatus: 'pending_delete' as const,
            version: (c.version || 1) + 1,
          }
        : c
    ),
  };

  await saveLibraryState(nextState);

  return nextState;
}

function getPendingFlashcardSyncStatus(card: Flashcard): NonNullable<Flashcard['syncStatus']> {
  return card.syncStatus === 'pending_create' ? 'pending_create' : 'pending_update';
}

export function getDefaultLibraryState(): LibraryState {
  const timestamp = now();

  return {
    folders: savedFolders.map((folder) => ({
      id: slugify(folder.name) || `folder-${folder.name.length}`,
      name: folder.name,
      color: folder.color,
      colorNote: (folder as any).colorNote ?? '',
      tags: [],
      avatarUri: '',
      isFavorite: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    savedWords: [],
    searchHistory: [],
    flashcards: [],
    flashcardReviewEvents: [],
    flashcardLearningSettings: getDefaultFlashcardLearningSettings(),
    deletedFolderIds: [],
  };
}

export function getDefaultFlashcardLearningSettings(): FlashcardLearningSettings {
  return {
    completionMinAverageQuality: 4,
    completionMinReviewCount: 3,
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

export function normalizeLibraryState(state: Partial<LibraryState>): LibraryState {
  const defaultState = getDefaultLibraryState();
  const deletedFolderIds = state.deletedFolderIds ?? [];
  const folders = mergeFolders(defaultState.folders, state.folders ?? []).filter(
    (folder) => !deletedFolderIds.includes(folder.id)
  );

  return {
    folders,
    savedWords: state.savedWords ?? [],
    searchHistory: state.searchHistory ?? [],
    flashcards: (state.flashcards ?? []).map(normalizeFlashcard),
    flashcardReviewEvents: (state.flashcardReviewEvents ?? [])
      .map(normalizeFlashcardReviewEvent)
      .filter((event): event is FlashcardReviewEvent => Boolean(event)),
    flashcardLearningSettings: normalizeFlashcardLearningSettings(state.flashcardLearningSettings),
    deletedFolderIds,
  };
}

function normalizeFlashcard(card: Partial<Flashcard>): Flashcard {
  const timestamp = now();
  const reviewState = card.reviewState ?? 'new';
  const completedAt = card.completedAt ?? null;

  return {
    id: card.id ?? `flashcard-${Date.now()}`,
    wordId: card.wordId ?? '',
    type: card.type ?? 'bilingual',
    front: card.front ?? '',
    back: card.back ?? '',
    createdAt: card.createdAt ?? timestamp,
    reviewState,
    finalStatus: card.finalStatus ?? (completedAt ? 'completed' : reviewState === 'new' ? 'started' : 'in_progress'),
    completedAt,
    interval: card.interval ?? 0,
    repetition: card.repetition ?? 0,
    efactor: card.efactor ?? 2.5,
    dueDate: card.dueDate ?? card.createdAt ?? timestamp,
    syncStatus: card.syncStatus,
    lastSyncedAt: card.lastSyncedAt ?? null,
    version: card.version ?? 1,
  };
}

function normalizeFlashcardReviewEvent(event: Partial<FlashcardReviewEvent>): FlashcardReviewEvent | null {
  if (!event.flashcardId || !event.wordId || typeof event.quality !== 'number') return null;
  const reviewedAt = event.reviewedAt ?? now();

  return {
    id: event.id ?? `flashcard-review-${event.flashcardId}-${reviewedAt}`,
    flashcardId: event.flashcardId,
    wordId: event.wordId,
    quality: Math.max(0, Math.min(5, Math.round(event.quality))),
    reviewedAt,
    scheduledDueDateAfterReview: event.scheduledDueDateAfterReview ?? reviewedAt,
  };
}

function normalizeFlashcardLearningSettings(settings?: Partial<FlashcardLearningSettings>): FlashcardLearningSettings {
  const defaults = getDefaultFlashcardLearningSettings();

  return {
    completionMinAverageQuality: clampNumber(settings?.completionMinAverageQuality, 1, 5, defaults.completionMinAverageQuality),
    completionMinReviewCount: clampNumber(settings?.completionMinReviewCount, 1, 50, defaults.completionMinReviewCount),
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
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
    colorNote: folder.colorNote || '',
    tags: normalizeFolderTags(folder.tags),
    avatarUri: folder.avatarUri?.trim() || '',
    isFavorite: Boolean(folder.isFavorite),
    createdAt: folder.createdAt ?? timestamp,
    updatedAt: folder.updatedAt ?? folder.createdAt ?? timestamp,
  };
}

export async function updateFolderColorAndNote(state: LibraryState, folderId: string, color: string, colorNote?: string) {
  const timestamp = now();
  const nextState = {
    ...state,
    folders: state.folders.map((folder) =>
      folder.id === folderId
        ? {
            ...folder,
            color,
            colorNote: colorNote ?? folder.colorNote ?? '',
            updatedAt: timestamp,
          }
        : folder
    ),
  };

  await saveLibraryState(nextState);

  return nextState;
}

export async function updateFolderMetadata(
  state: LibraryState,
  folderId: string,
  metadata: { color?: string; colorNote?: string; tags?: string[]; avatarUri?: string }
) {
  const timestamp = now();
  const nextState = {
    ...state,
    folders: state.folders.map((folder) =>
      folder.id === folderId
        ? {
            ...folder,
            color: metadata.color || folder.color,
            colorNote: metadata.colorNote ?? folder.colorNote ?? '',
            tags: metadata.tags ? normalizeFolderTags(metadata.tags) : folder.tags,
            avatarUri: metadata.avatarUri?.trim() ?? folder.avatarUri ?? '',
            updatedAt: timestamp,
          }
        : folder
    ),
  };

  await saveLibraryState(nextState);

  return nextState;
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
    finalStatus: 'started',
    completedAt: null,
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    dueDate: createdAt,
    syncStatus: 'pending_create',
    lastSyncedAt: null,
    version: 1,
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

function normalizeFolderTags(tags?: string[]) {
  return Array.from(new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))).slice(0, 8);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
