import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import {
  Flashcard,
  FlashcardReviewState,
  FlashcardType,
  LibraryState,
  createFlashcardsFromSavedWords,
  getDefaultLibraryState,
  loadLibraryState,
  updateFlashcardReviewState,
} from '@/data/libraryStore';

const flashcardOptions: { type: FlashcardType; label: string; description: string }[] = [
  { type: 'bilingual', label: 'Song ngữ', description: 'Từ + nghĩa + ghi chú' },
  { type: 'word-definition', label: 'Từ -> nghĩa', description: 'Nhìn từ, nhớ định nghĩa' },
  { type: 'definition-word', label: 'Nghĩa -> từ', description: 'Nhìn định nghĩa, nhớ từ' },
  { type: 'word-pronunciation', label: 'Từ -> phát âm', description: 'Nhìn từ, nhớ IPA' },
];

const reviewFilterOptions: { value: FlashcardReviewState | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'new', label: 'Mới' },
  { value: 'learning', label: 'Đang học' },
  { value: 'reviewed', label: 'Đã nhớ' },
];

const typeFilterOptions: { value: FlashcardType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả loại thẻ' },
  ...flashcardOptions.map((option) => ({ value: option.type, label: option.label })),
];

const features = [
  {
    title: 'AI hội thoại',
    description: 'Luyện phản xạ bằng giọng nói hoặc tin nhắn với gợi ý sửa câu.',
    icon: 'chatbubbles-outline' as const,
    accent: '#EAF1FF',
  },
  {
    title: 'Dịch chuyên ngành',
    description: 'Dịch đoạn văn theo thuật ngữ cá nhân và ngữ cảnh học thuật.',
    icon: 'language-outline' as const,
    accent: '#EAF8F0',
  },
  {
    title: 'Nhập dữ liệu',
    description: 'Nhập CSV, highlight từ sách hoặc danh sách từ từ lớp học.',
    icon: 'cloud-upload-outline' as const,
    accent: '#FFF1E8',
  },
  {
    title: 'Đọc sách kèm tra từ',
    description: 'Highlight, tra nghĩa, lưu ghi chú và tạo flashcard ngay khi đọc.',
    icon: 'reader-outline' as const,
    accent: '#F1ECFF',
  },
  {
    title: 'Flashcard thông minh',
    description: 'Tạo thẻ song ngữ, cloze test, phát âm và lịch ôn giãn cách.',
    icon: 'albums-outline' as const,
    accent: '#FFEFF3',
  },
  {
    title: 'Xuất bộ từ',
    description: 'Xuất sang CSV, Google Sheets hoặc Anki khi cần học ngoài app.',
    icon: 'download-outline' as const,
    accent: '#EAF7FA',
  },
];

export default function AdvancedScreen() {
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [selectedTypes, setSelectedTypes] = useState<Record<FlashcardType, boolean>>({
    bilingual: true,
    'word-definition': true,
    'definition-word': false,
    'word-pronunciation': false,
  });
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [folderFilterId, setFolderFilterId] = useState('all');
  const [typeFilter, setTypeFilter] = useState<FlashcardType | 'all'>('all');
  const [reviewFilter, setReviewFilter] = useState<FlashcardReviewState | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      loadLibraryState().then((state) => {
        if (isMounted) setLibraryState(state);
      });

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const selectedFlashcardTypes = useMemo(() => {
    return flashcardOptions.filter((option) => selectedTypes[option.type]).map((option) => option.type);
  }, [selectedTypes]);

  const savedWordsById = useMemo(() => {
    return new Map(libraryState.savedWords.map((word) => [word.id, word]));
  }, [libraryState.savedWords]);

  const filteredFlashcards = useMemo(() => {
    return libraryState.flashcards.filter((card) => {
      const savedWord = savedWordsById.get(card.wordId);
      const matchesFolder = folderFilterId === 'all' || savedWord?.folderIds.includes(folderFilterId);
      const matchesType = typeFilter === 'all' || card.type === typeFilter;
      const matchesReview = reviewFilter === 'all' || card.reviewState === reviewFilter;

      return matchesFolder && matchesType && matchesReview;
    });
  }, [folderFilterId, libraryState.flashcards, reviewFilter, savedWordsById, typeFilter]);

  const dueFlashcards = useMemo(() => {
    return libraryState.flashcards.filter((card) => card.reviewState !== 'reviewed').length;
  }, [libraryState.flashcards]);

  const activeCard = filteredFlashcards[activeCardIndex];

  useEffect(() => {
    setActiveCardIndex((index) => {
      if (!filteredFlashcards.length) return 0;

      return Math.min(index, filteredFlashcards.length - 1);
    });
    setShowBack(false);
  }, [filteredFlashcards.length]);

  const handleToggleFlashcardType = (type: FlashcardType) => {
    setSelectedTypes((current) => ({ ...current, [type]: !current[type] }));
  };

  const handleCreateFlashcards = () => {
    createFlashcardsFromSavedWords(libraryState, selectedFlashcardTypes).then((nextState) => {
      setLibraryState(nextState);
      setActiveCardIndex(0);
      setShowBack(false);
    });
  };

  const handleReviewCard = (card: Flashcard, reviewState: FlashcardReviewState) => {
    updateFlashcardReviewState(libraryState, card.id, reviewState).then((nextState) => {
      setLibraryState(nextState);
      setShowBack(false);
      setActiveCardIndex((index) => {
        if (filteredFlashcards.length <= 1) return 0;

        return Math.min(index + 1, filteredFlashcards.length - 1);
      });
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Phòng luyện tập</Text>
        <Text style={styles.title}>Công cụ học nâng cao</Text>
        <View style={styles.challengeCard}>
          <View style={styles.challengeIcon}>
            <Ionicons name="flash" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.challengeCopy}>
            <Text style={styles.challengeTitle}>{dueFlashcards} thẻ cần ôn</Text>
            <Text style={styles.challengeText}>Lọc theo bộ từ, loại thẻ hoặc trạng thái để ôn đúng nhóm cần học.</Text>
          </View>
        </View>

        <View style={styles.flashcardPanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelKicker}>Flashcard local</Text>
              <Text style={styles.panelTitle}>{filteredFlashcards.length} / {libraryState.flashcards.length} thẻ</Text>
            </View>
            <View style={styles.savedWordPill}>
              <Text style={styles.savedWordPillText}>{libraryState.savedWords.length} từ</Text>
            </View>
          </View>

          <View style={styles.checklist}>
            {flashcardOptions.map((option) => {
              const isSelected = selectedTypes[option.type];

              return (
                <TouchableOpacity
                  key={option.type}
                  activeOpacity={0.82}
                  onPress={() => handleToggleFlashcardType(option.type)}
                  style={[styles.checkItem, isSelected && styles.checkItemActive]}>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={21}
                    color={isSelected ? '#2563EB' : '#94A3B8'}
                  />
                  <View style={styles.checkCopy}>
                    <Text style={styles.checkLabel}>{option.label}</Text>
                    <Text style={styles.checkDescription}>{option.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!selectedFlashcardTypes.length || !libraryState.savedWords.length}
            onPress={handleCreateFlashcards}
            style={[
              styles.generateButton,
              (!selectedFlashcardTypes.length || !libraryState.savedWords.length) && styles.generateButtonDisabled,
            ]}>
            <Ionicons name="albums-outline" size={18} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>Tạo flashcard từ từ đã lưu</Text>
          </TouchableOpacity>

          <View style={styles.filterBlock}>
            <Text style={styles.filterLabel}>Bộ từ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              <FilterChip label="Tất cả" isSelected={folderFilterId === 'all'} onPress={() => setFolderFilterId('all')} />
              {libraryState.folders.map((folder) => (
                <FilterChip
                  key={folder.id}
                  label={folder.name}
                  isSelected={folderFilterId === folder.id}
                  onPress={() => setFolderFilterId(folder.id)}
                />
              ))}
            </ScrollView>
            <Text style={styles.filterLabel}>Loại thẻ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {typeFilterOptions.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  isSelected={typeFilter === option.value}
                  onPress={() => setTypeFilter(option.value)}
                />
              ))}
            </ScrollView>
            <Text style={styles.filterLabel}>Trạng thái</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {reviewFilterOptions.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  isSelected={reviewFilter === option.value}
                  onPress={() => setReviewFilter(option.value)}
                />
              ))}
            </ScrollView>
          </View>

          {activeCard ? (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewType}>{formatFlashcardType(activeCard.type)} · {formatReviewState(activeCard.reviewState)}</Text>
              <TouchableOpacity activeOpacity={0.86} onPress={() => setShowBack((value) => !value)} style={styles.flashcardFace}>
                <Text style={styles.faceLabel}>{showBack ? 'Back' : 'Front'}</Text>
                <Text style={styles.faceText}>{showBack ? activeCard.back : activeCard.front}</Text>
              </TouchableOpacity>
              <View style={styles.reviewActions}>
                <TouchableOpacity activeOpacity={0.82} onPress={() => handleReviewCard(activeCard, 'learning')} style={styles.learningButton}>
                  <Text style={styles.learningButtonText}>Đang học</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.82} onPress={() => handleReviewCard(activeCard, 'reviewed')} style={styles.reviewedButton}>
                  <Text style={styles.reviewedButtonText}>Đã nhớ</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyFlashcard}>
              <Ionicons name="albums-outline" size={23} color="#94A3B8" />
              <Text style={styles.emptyFlashcardTitle}>{libraryState.flashcards.length ? 'Không có thẻ phù hợp' : 'Chưa có flashcard'}</Text>
              <Text style={styles.emptyFlashcardText}>
                {libraryState.flashcards.length
                  ? 'Đổi bộ lọc để xem nhóm thẻ khác.'
                  : 'Lưu vài từ trong tab Tra cứu, chọn loại thẻ, rồi tạo flashcard tại đây.'}
              </Text>
            </View>
          )}
        </View>

        {features.map((feature) => {
          const featureContent = (
            <>
              <View style={[styles.iconWrap, { backgroundColor: feature.accent }]}>
                <Ionicons name={feature.icon} size={28} color="#0F172A" />
              </View>
              <View style={styles.copy}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.description}>{feature.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </>
          );

          if (feature.title === 'Đọc sách kèm tra từ') {
            return (
              <Link key={feature.title} href={'/reader' as Href} asChild>
                <TouchableOpacity style={styles.card} activeOpacity={0.8}>
                  {featureContent}
                </TouchableOpacity>
              </Link>
            );
          }

          return (
            <TouchableOpacity key={feature.title} style={styles.card} activeOpacity={0.8}>
              {featureContent}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

function formatFlashcardType(type: FlashcardType) {
  const option = flashcardOptions.find((item) => item.type === type);

  return option?.label ?? type;
}

function formatReviewState(state: FlashcardReviewState) {
  if (state === 'reviewed') return 'Đã nhớ';
  if (state === 'learning') return 'Đang học';

  return 'Mới';
}

function FilterChip({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={[styles.filterChip, isSelected && styles.filterChipActive]}>
      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  kicker: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 29,
    fontWeight: '900',
    marginBottom: 18,
    marginTop: 4,
  },
  challengeCard: {
    alignItems: 'center',
    backgroundColor: '#102A43',
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
  },
  flashcardPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelKicker: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  panelTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  savedWordPill: {
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedWordPillText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '900',
  },
  checklist: {
    gap: 8,
    marginTop: 14,
  },
  checkItem: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 11,
  },
  checkItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  checkCopy: {
    flex: 1,
  },
  checkLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  checkDescription: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  generateButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
  },
  generateButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  filterBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
    padding: 10,
  },
  filterLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  filterRow: {
    gap: 8,
    paddingBottom: 2,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 164,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  filterChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  filterChipTextActive: {
    color: '#2563EB',
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginTop: 12,
    padding: 12,
  },
  reviewType: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  flashcardFace: {
    alignItems: 'center',
    backgroundColor: '#102A43',
    borderRadius: 8,
    minHeight: 142,
    justifyContent: 'center',
    padding: 16,
  },
  faceLabel: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  faceText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 29,
    textAlign: 'center',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  learningButton: {
    alignItems: 'center',
    backgroundColor: '#EAF1FF',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 11,
  },
  learningButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
  },
  reviewedButton: {
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 11,
  },
  reviewedButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyFlashcard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginTop: 12,
    padding: 16,
  },
  emptyFlashcardTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 8,
  },
  emptyFlashcardText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 5,
    textAlign: 'center',
  },
  challengeIcon: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginRight: 14,
    width: 48,
  },
  challengeCopy: {
    flex: 1,
  },
  challengeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  challengeText: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 5,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 92,
    paddingHorizontal: 14,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    marginRight: 14,
    width: 52,
  },
  copy: {
    flex: 1,
  },
  featureTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  description: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 8,
  },
});
