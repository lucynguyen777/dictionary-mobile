// Sentence memory per Specialized Translation domain, kept on the device like glossaries
// (same record shape, so it syncs the same way: data/specializedSentenceSync.ts).
import { createDomainTextStore } from './specializedGlossaryStore';

export const SPECIALIZED_SENTENCE_STORAGE_KEY = 'dictionary-mobile.specialized-sentences.v1';
export const SPECIALIZED_SENTENCE_MAX_CHARS = 200_000;

export const specializedSentenceStore = createDomainTextStore({
  maxChars: SPECIALIZED_SENTENCE_MAX_CHARS,
  storageKey: SPECIALIZED_SENTENCE_STORAGE_KEY,
});
