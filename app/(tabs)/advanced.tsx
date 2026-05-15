import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect, type Href } from 'expo-router';
import { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import {
  Flashcard,
  FlashcardReviewState,
  FlashcardType,
  LibraryState,
  createFlashcardsFromSavedWords,
  exportFlashcardsToAnkiText,
  getDefaultLibraryState,
  loadLibraryState,
  reviewFlashcard,
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

type LearningToolId = 'flashcards' | 'ai-chat' | 'specialized-translation' | 'import' | 'reader' | 'export';

const learningTools: {
  id: LearningToolId;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accent: string;
  status: string;
}[] = [
  {
    id: 'flashcards',
    title: 'Flashcard local',
    description: 'Tạo, lọc và ôn thẻ từ các từ đã lưu.',
    icon: 'albums-outline',
    accent: '#FFEFF3',
    status: 'Đang dùng được',
  },
  {
    id: 'ai-chat',
    title: 'AI hội thoại',
    description: 'Luyện phản xạ bằng giọng nói hoặc tin nhắn với gợi ý sửa câu.',
    icon: 'chatbubbles-outline',
    accent: '#EAF1FF',
    status: 'Thiết kế UI trước',
  },
  {
    id: 'specialized-translation',
    title: 'Dịch chuyên ngành',
    description: 'Dịch đoạn văn theo thuật ngữ cá nhân và ngữ cảnh học thuật.',
    icon: 'language-outline',
    accent: '#EAF8F0',
    status: 'Thiết kế UI trước',
  },
  {
    id: 'import',
    title: 'Nhập dữ liệu',
    description: 'Nhập CSV, highlight từ sách hoặc danh sách từ từ lớp học.',
    icon: 'cloud-upload-outline',
    accent: '#FFF1E8',
    status: 'CSV/TSV đã có',
  },
  {
    id: 'reader',
    title: 'Đọc sách kèm tra từ',
    description: 'Highlight, tra nghĩa, lưu ghi chú và tạo flashcard ngay khi đọc.',
    icon: 'reader-outline',
    accent: '#F1ECFF',
    status: 'TXT/HTML đã có',
  },
  {
    id: 'export',
    title: 'Xuất bộ từ',
    description: 'Xuất sang CSV, Google Sheets hoặc Anki khi cần học ngoài app.',
    icon: 'download-outline',
    accent: '#EAF7FA',
    status: 'CSV/Excel/Anki text',
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
  const [isExporting, setIsExporting] = useState(false);
  const [folderFilterId, setFolderFilterId] = useState('all');
  const [typeFilter, setTypeFilter] = useState<FlashcardType | 'all'>('all');
  const [reviewFilter, setReviewFilter] = useState<FlashcardReviewState | 'all'>('all');
  const [activeToolId, setActiveToolId] = useState<LearningToolId>('flashcards');

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
    const now = new Date();
    return libraryState.flashcards.filter((card) => {
      const savedWord = savedWordsById.get(card.wordId);
      const matchesFolder = folderFilterId === 'all' || savedWord?.folderIds.includes(folderFilterId);
      const matchesType = typeFilter === 'all' || card.type === typeFilter;
      
      let matchesReview = false;
      if (reviewFilter === 'all') matchesReview = true;
      else if (reviewFilter === 'new') matchesReview = card.reviewState === 'new';
      else if (reviewFilter === 'learning') matchesReview = card.reviewState === 'learning';
      else if (reviewFilter === 'reviewed') {
        // Here we use 'reviewed' filter to show cards that are actually Due for review today
        matchesReview = new Date(card.dueDate) <= now || card.reviewState === 'reviewed';
      }

      return matchesFolder && matchesType && matchesReview;
    });
  }, [folderFilterId, libraryState.flashcards, reviewFilter, savedWordsById, typeFilter]);

  const dueFlashcards = useMemo(() => {
    const now = new Date();
    return libraryState.flashcards.filter((card) => new Date(card.dueDate) <= now || card.reviewState !== 'reviewed').length;
  }, [libraryState.flashcards]);

  const activeCard = filteredFlashcards[activeCardIndex];
  const activeTool = learningTools.find((tool) => tool.id === activeToolId) ?? learningTools[0];

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

  const handleExportAnki = async () => {
    if (!filteredFlashcards.length) return;
    try {
      setIsExporting(true);
      const cardIds = filteredFlashcards.map((c) => c.id);
      const result = await exportFlashcardsToAnkiText(libraryState, cardIds);
      if (result.ok) {
        Alert.alert('Đã xuất', result.message);
      } else {
        Alert.alert('Lỗi xuất', result.message);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể xuất flashcards.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReviewCard = (card: Flashcard, quality: number) => {
    reviewFlashcard(libraryState, card.id, quality).then((nextState) => {
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolTabs}>
          {learningTools.map((tool) => (
            <ToolTab
              key={tool.id}
              isSelected={activeToolId === tool.id}
              tool={tool}
              onPress={() => setActiveToolId(tool.id)}
            />
          ))}
        </ScrollView>

        {activeToolId === 'flashcards' ? (
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

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!filteredFlashcards.length || isExporting}
            onPress={handleExportAnki}
            style={[
              styles.exportButton,
              (!filteredFlashcards.length || isExporting) && styles.exportButtonDisabled,
            ]}>
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>{isExporting ? 'Đang xuất...' : 'Xuất Anki (text)'}</Text>
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
                <TouchableOpacity activeOpacity={0.82} onPress={() => handleReviewCard(activeCard, 1)} style={styles.againButton}>
                  <Text style={styles.againButtonText}>Lại</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.82} onPress={() => handleReviewCard(activeCard, 3)} style={styles.hardButton}>
                  <Text style={styles.hardButtonText}>Khó</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.82} onPress={() => handleReviewCard(activeCard, 4)} style={styles.goodButton}>
                  <Text style={styles.goodButtonText}>Tốt</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.82} onPress={() => handleReviewCard(activeCard, 5)} style={styles.easyButton}>
                  <Text style={styles.easyButtonText}>Dễ</Text>
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
        ) : (
          <LearningToolPanel tool={activeTool} />
        )}
      </ScrollView>
    </Screen>
  );
}

function ToolTab({
  isSelected,
  onPress,
  tool,
}: {
  isSelected: boolean;
  onPress: () => void;
  tool: (typeof learningTools)[number];
}) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={[styles.toolTab, isSelected && styles.toolTabActive]}>
      <View style={[styles.toolTabIcon, { backgroundColor: tool.accent }]}>
        <Ionicons name={tool.icon} size={18} color="#0F172A" />
      </View>
      <Text style={[styles.toolTabText, isSelected && styles.toolTabTextActive]} numberOfLines={1}>
        {tool.title}
      </Text>
    </TouchableOpacity>
  );
}

function LearningToolPanel({ tool }: { tool: (typeof learningTools)[number] }) {
  const readerHref = '/reader' as Href;
  const isReader = tool.id === 'reader';

  return (
    <View style={styles.toolPanel}>
      <View style={styles.toolPanelHeader}>
        <View style={[styles.iconWrap, { backgroundColor: tool.accent }]}>
          <Ionicons name={tool.icon} size={28} color="#0F172A" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.featureTitle}>{tool.title}</Text>
          <Text style={styles.description}>{tool.description}</Text>
        </View>
      </View>
      <View style={styles.toolStatusPill}>
        <Text style={styles.toolStatusText}>{tool.status}</Text>
      </View>
      <View style={styles.toolRoadmap}>
        <Text style={styles.toolRoadmapTitle}>Frontend/UI roadmap</Text>
        <Text style={styles.toolRoadmapText}>
          {getToolRoadmapText(tool.id)}
        </Text>
      </View>
      {isReader ? (
        <Link href={readerHref} asChild>
          <TouchableOpacity activeOpacity={0.82} style={styles.openToolButton}>
            <Ionicons name="open-outline" size={17} color="#FFFFFF" />
            <Text style={styles.openToolButtonText}>Mở Reader</Text>
          </TouchableOpacity>
        </Link>
      ) : null}
    </View>
  );
}

function getToolRoadmapText(toolId: LearningToolId) {
  if (toolId === 'ai-chat') {
    return 'Thiết kế tab hội thoại gồm danh sách hội thoại, khung chat realtime, trạng thái ghi âm, transcript và feedback sửa câu. Backend/AI vẫn blocked cho tới khi chọn auth, streaming và cost controls.';
  }
  if (toolId === 'specialized-translation') {
    return 'Thiết kế UI nhập chuyên ngành/chủ đề, vùng paste/import văn bản, glossary user và kết quả dịch theo thuật ngữ. Translation production cần backend/API riêng.';
  }
  if (toolId === 'import') {
    return 'Polish flow import dataset: preview, mapping cột/hàng, chọn folder đích, validate trùng/trống và tạo flashcard từ dataset.';
  }
  if (toolId === 'reader') {
    return 'Reader đã có TXT/HTML, highlight, save/note/flashcard. Bước tiếp theo là chọn parser cho EPUB/PDF/DOCX và UI xử lý lỗi định dạng.';
  }

  return 'Chuẩn hóa xuất CSV/Excel/Anki text; Google Sheets vẫn cần OAuth, còn Anki .apkg cần parser/package riêng.';
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
  exportButton: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
  },
  exportButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  exportButtonText: {
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
  againButton: {
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 11,
  },
  againButtonText: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '900',
  },
  hardButton: {
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 11,
  },
  hardButtonText: {
    color: '#EA580C',
    fontSize: 13,
    fontWeight: '900',
  },
  goodButton: {
    alignItems: 'center',
    backgroundColor: '#EAF1FF',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 11,
  },
  goodButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
  },
  easyButton: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 11,
  },
  easyButtonText: {
    color: '#16A34A',
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
  toolTabs: {
    gap: 10,
    paddingBottom: 14,
  },
  toolTab: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: 154,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  toolTabActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  toolTabIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  toolTabText: {
    color: '#64748B',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  toolTabTextActive: {
    color: '#2563EB',
  },
  toolPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  toolPanelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  toolStatusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  toolStatusText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '900',
  },
  toolRoadmap: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  toolRoadmapTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  toolRoadmapText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 5,
  },
  openToolButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  openToolButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
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
