import { getStoredItem, removeStoredItem, setStoredItem } from '@/data/storageAdapter';
import type { EnabledReaderImportFormat } from '@/data/readerImport';
import type { LanguageCode } from '@/data/languages';
import {
  normalizeReaderBackgroundPresetId,
  normalizeReaderThemeMode,
  type ReaderBackgroundPresetId,
  type ReaderThemeMode,
} from './readerTheme';

const STORAGE_KEY = 'dictionary-mobile.reader.v1';

export type ReaderDocument = {
  id: string;
  title: string;
  content: string;
  sourceFormat?: EnabledReaderImportFormat;
  createdAt: string;
  updatedAt: string;
};

export type ReaderSettings = {
  fontSize: number;
  fontFamily: 'system' | 'serif' | 'mono';
  backgroundColor: string;
  backgroundPresetId: ReaderBackgroundPresetId;
  themeMode: ReaderThemeMode;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
};

export type ReaderState = {
  documents: ReaderDocument[];
  selectedDocumentId: string;
  settings: ReaderSettings;
};

const now = () => new Date().toISOString();

export async function loadReaderState(): Promise<ReaderState> {
  try {
    const { loadReaderStateFromUserDatabase } = await import('./userDatabaseRuntime');
    return await loadReaderStateFromUserDatabase();
  } catch {
    return loadReaderStateFromAsyncStorage();
  }
}

export async function loadReaderStateFromAsyncStorage(): Promise<ReaderState> {
  const rawState = await getStoredItem(STORAGE_KEY);
  if (!rawState) return getDefaultReaderState();

  try {
    return normalizeReaderState(JSON.parse(rawState) as Partial<ReaderState>);
  } catch {
    return getDefaultReaderState();
  }
}

export async function importReaderText(
  state: ReaderState,
  title: string,
  content: string,
  sourceFormat: ReaderDocument['sourceFormat'] = 'txt'
) {
  const timestamp = now();
  const document: ReaderDocument = {
    id: `reader-${Date.now()}`,
    title: title.trim() || `Reader text ${state.documents.length + 1}`,
    content: content.trim(),
    sourceFormat,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const nextState = {
    ...state,
    documents: [document, ...state.documents],
    selectedDocumentId: document.id,
  };

  await saveReaderState(nextState);

  return nextState;
}

export async function updateReaderSettings(state: ReaderState, settings: Partial<ReaderSettings>) {
  const nextState = {
    ...state,
    settings: {
      ...state.settings,
      ...settings,
    },
  };

  await saveReaderState(nextState);

  return nextState;
}

export async function selectReaderDocument(state: ReaderState, documentId: string) {
  const nextState = {
    ...state,
    selectedDocumentId: documentId,
  };

  await saveReaderState(nextState);

  return nextState;
}

export function getDefaultReaderState(): ReaderState {
  return {
    documents: [],
    selectedDocumentId: '',
    settings: {
      fontSize: 18,
      fontFamily: 'system',
      backgroundColor: '#F8FAFC',
      backgroundPresetId: 'auto',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      themeMode: 'system',
    },
  };
}

async function saveReaderState(state: ReaderState) {
  try {
    const { saveReaderStateToUserDatabase } = await import('./userDatabaseRuntime');
    await saveReaderStateToUserDatabase(state);
  } catch {
    // AsyncStorage remains the recoverable source when SQLite is unavailable.
  }

  await saveReaderStateToAsyncStorage(state);
}

export async function saveReaderStateToAsyncStorage(state: ReaderState) {
  await setStoredItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearReaderState() {
  try {
    const { clearReaderStateFromUserDatabase } = await import('./userDatabaseRuntime');
    await clearReaderStateFromUserDatabase();
  } catch {
    // Local reset must still work if SQLite cannot open.
  }

  await removeReaderStateFromAsyncStorage();
}

export async function removeReaderStateFromAsyncStorage() {
  await removeStoredItem(STORAGE_KEY);
}

export function normalizeReaderState(
  state: Partial<Omit<ReaderState, 'settings'>> & { settings?: Partial<ReaderSettings> }
): ReaderState {
  const defaultState = getDefaultReaderState();
  const documents = state.documents ?? [];
  const selectedDocumentId = documents.some((document) => document.id === state.selectedDocumentId)
    ? state.selectedDocumentId ?? ''
    : documents[0]?.id ?? '';

  return {
    documents,
    selectedDocumentId,
    settings: {
      ...defaultState.settings,
      ...state.settings,
      backgroundPresetId: normalizeReaderBackgroundPresetId(
        state.settings?.backgroundPresetId,
        state.settings?.backgroundColor
      ),
      sourceLanguage: state.settings?.sourceLanguage ?? defaultState.settings.sourceLanguage,
      targetLanguage: state.settings?.targetLanguage ?? defaultState.settings.targetLanguage,
      themeMode: normalizeReaderThemeMode(state.settings?.themeMode),
    },
  };
}
