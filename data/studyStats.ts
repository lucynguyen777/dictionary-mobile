import { calculateActivityStreaks, getLocalDateKey, type ActivityState } from './activityStore';
import type { Flashcard, LibraryState } from './libraryStore';

export type StudyStats = {
  dueToday: number;
  mastered: number;
  savedWords: number;
  streak: number;
};

// A card is due once its SM-2 due date falls on or before the end of the local day, until it is completed.
export function isFlashcardDue(card: Flashcard, now: Date = new Date()) {
  if (card.finalStatus === 'completed') return false;
  const dueAt = new Date(card.dueDate).getTime();
  if (!Number.isFinite(dueAt)) return true;
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  return dueAt < endOfDay;
}

export function countDueFlashcards(cards: Flashcard[], now: Date = new Date()) {
  return cards.filter((card) => isFlashcardDue(card, now)).length;
}

export function isFlashcardMastered(card: Flashcard) {
  return card.finalStatus === 'completed' || card.reviewState === 'reviewed';
}

// The streak stays alive through today until the day ends, so count back from yesterday if today has no activity yet.
export function getLiveStreak(activity: Pick<ActivityState, 'activeDays'>, now: Date = new Date()) {
  const today = getLocalDateKey(now);
  const yesterday = getLocalDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const anchor = activity.activeDays.includes(today) ? today : yesterday;
  return calculateActivityStreaks(activity.activeDays, anchor).currentStreak;
}

export function getStudyStats(
  library: Pick<LibraryState, 'flashcards' | 'savedWords'>,
  activity: Pick<ActivityState, 'activeDays'>,
  now: Date = new Date()
): StudyStats {
  return {
    dueToday: countDueFlashcards(library.flashcards, now),
    mastered: library.flashcards.filter(isFlashcardMastered).length,
    savedWords: library.savedWords.length,
    streak: getLiveStreak(activity, now),
  };
}
