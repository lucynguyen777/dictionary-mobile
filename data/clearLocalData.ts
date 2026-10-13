// Erases everything the app keeps on this device for the learner (library, flashcards, history,
// profile, Reader documents, offline pack install state).
import { clearLibraryState } from './libraryStore';
import { clearOfflinePackInstallState } from './offlineDictionaryPackStore';
import { clearUserProfile } from './profileStore';
import { clearReaderState } from './readerStore';

export async function clearAllLocalData() {
  await clearLibraryState();
  await clearUserProfile();
  await clearReaderState();
  await clearOfflinePackInstallState();
}
