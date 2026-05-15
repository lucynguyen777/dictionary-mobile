import { getStoredItem, setStoredItem } from '@/data/storageAdapter';

const STORAGE_KEY = 'dictionary-mobile.reader.v1';

export type ReaderDocument = {
  id: string;
  title: string;
  content: string;
  sourceFormat?: 'txt' | 'html';
  createdAt: string;
  updatedAt: string;
};

export type ReaderSettings = {
  fontSize: number;
  fontFamily: 'system' | 'serif' | 'mono';
  backgroundColor: '#F8FAFC' | '#FFF7ED' | '#ECFDF5';
};

export type ReaderState = {
  documents: ReaderDocument[];
  selectedDocumentId: string;
  settings: ReaderSettings;
};

const now = () => new Date().toISOString();

export async function loadReaderState(): Promise<ReaderState> {
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
    },
  };
}

async function saveReaderState(state: ReaderState) {
  await setStoredItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeReaderState(state: Partial<ReaderState>): ReaderState {
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
    },
  };
}
