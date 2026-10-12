import { Text } from 'react-native';
import Touchable from '@/components/app/Touchable';
import { FlashcardReviewState, FlashcardType } from '@/data/libraryStore';

import { useTrainingStyles } from '@/components/training/styles';

export const flashcardOptions: { type: FlashcardType; label: string; description: string }[] = [
  { type: 'bilingual', label: 'Song ngữ', description: 'Từ + nghĩa + ghi chú' },
  { type: 'word-definition', label: 'Từ → nghĩa', description: 'Nhìn từ, nhớ định nghĩa' },
  { type: 'definition-word', label: 'Nghĩa → từ', description: 'Nhìn định nghĩa, nhớ từ' },
  { type: 'word-pronunciation', label: 'Từ → phát âm', description: 'Nhìn từ, nhớ IPA' },
];

export const reviewFilterOptions: { value: FlashcardReviewState | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'new', label: 'Mới' },
  { value: 'learning', label: 'Đang học' },
  { value: 'reviewed', label: 'Đã nhớ' },
];

export const typeFilterOptions: { value: FlashcardType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả loại thẻ' },
  ...flashcardOptions.map((option) => ({ value: option.type, label: option.label })),
];

export type LearningToolId = 'flashcards' | 'ai-chat' | 'specialized-translation' | 'import' | 'reader' | 'export';

export type FlashcardMode = 'dashboard' | 'study' | 'manage';

export const flashcardModeOptions: { value: FlashcardMode; label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'study', label: 'Study' },
  { value: 'manage', label: 'Manage' },
];

export function formatFlashcardType(type: FlashcardType) {
  const option = flashcardOptions.find((item) => item.type === type);

  return option?.label ?? type;
}

export function formatReviewState(state: FlashcardReviewState) {
  if (state === 'reviewed') return 'Đã nhớ';
  if (state === 'learning') return 'Đang học';

  return 'Mới';
}

export function FilterChip({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
  const styles = useTrainingStyles();
  return (
    <Touchable activeOpacity={0.78} onPress={onPress} style={[styles.filterChip, isSelected && styles.filterChipActive]}>
      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Touchable>
  );
}
