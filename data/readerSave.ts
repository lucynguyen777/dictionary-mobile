// Saving a Reader highlight to the library (and optionally as a flashcard).
import type { DictionaryEntry } from './dictionary';
import { type LibraryState, createFlashcardsFromWordIds, getFavoriteFolderId, saveWordToFolder } from './libraryStore';

export async function saveReaderSelection(
  libraryState: LibraryState,
  text: string,
  note: string,
  { withFlashcard }: { withFlashcard: boolean }
): Promise<LibraryState> {
  const saved = await saveWordToFolder(libraryState, createReaderDictionaryEntry(text), getReaderSaveFolderId(libraryState), note);
  return withFlashcard ? createFlashcardsFromWordIds(saved, [`word-${text.toLowerCase()}`], ['bilingual']) : saved;
}

export function getReaderSaveFolderId(libraryState: LibraryState) {
  const dailyReviewFolder = libraryState.folders.find((folder) => folder.name.toLowerCase() === 'daily review');
  return dailyReviewFolder?.id ?? getFavoriteFolderId();
}

export function createReaderDictionaryEntry(word: string): DictionaryEntry {
  return {
    word,
    ipa: '',
    audio: '',
    level: 'TXT',
    topic: 'Reader',
    vietnamese: 'Reader highlight',
    shortDefinition: 'Saved from Reader.',
    definitions: [
      {
        partOfSpeech: 'reader',
        meaning: 'Saved from Reader.',
        vietnamese: 'Từ được lưu khi đọc văn bản.',
        examples: [],
      },
    ],
    synonyms: [],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [],
    etymology: '',
    pronunciationTips: [],
  };
}
