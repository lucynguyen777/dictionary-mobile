import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect, type Href } from 'expo-router';
import { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import Screen from '@/components/app/Screen';
import {
  Flashcard,
  FlashcardReviewState,
  FlashcardType,
  FolderExportFormat,
  LibraryState,
  createFlashcardsFromSavedWords,
  exportFlashcardsToAnkiText,
  exportFolderToAnkiTsv,
  exportFolderToCsv,
  exportFolderToExcel,
  getFavoriteFolderId,
  getDefaultLibraryState,
  loadLibraryState,
  reviewFlashcard,
  saveLibraryState,
} from '@/data/libraryStore';

const flashcardOptions: { type: FlashcardType; label: string; description: string }[] = [
  { type: 'bilingual', label: 'Song ngữ', description: 'Từ + nghĩa + ghi chú' },
  { type: 'word-definition', label: 'Từ → nghĩa', description: 'Nhìn từ, nhớ định nghĩa' },
  { type: 'definition-word', label: 'Nghĩa → từ', description: 'Nhìn định nghĩa, nhớ từ' },
  { type: 'word-pronunciation', label: 'Từ → phát âm', description: 'Nhìn từ, nhớ IPA' },
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
type ImportSourceId = 'csv-tsv' | 'reader-highlights' | 'class-list';
type ExportActionId = FolderExportFormat | 'google-sheets';
type ExportHistoryItem = {
  id: string;
  action: ExportActionId;
  folderName: string;
  message: string;
  status: 'success' | 'failed' | 'blocked';
  createdAt: string;
};

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
    status: 'UI shell sẵn sàng',
  },
  {
    id: 'specialized-translation',
    title: 'Dịch chuyên ngành',
    description: 'Dịch đoạn văn theo thuật ngữ cá nhân và ngữ cảnh học thuật.',
    icon: 'language-outline',
    accent: '#EAF8F0',
    status: 'UI shell sẵn sàng',
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

const importSourceOptions: {
  id: ImportSourceId;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  status: string;
}[] = [
  {
    id: 'csv-tsv',
    title: 'CSV / TSV',
    description: 'File bảng từ vựng có word, definition, ipa, note, tags.',
    icon: 'document-attach-outline',
    status: 'Đã hỗ trợ trong Library',
  },
  {
    id: 'reader-highlights',
    title: 'Highlight Reader',
    description: 'Từ và ghi chú đã lưu khi đọc TXT/HTML.',
    icon: 'reader-outline',
    status: 'Dùng qua Reader',
  },
  {
    id: 'class-list',
    title: 'Danh sách lớp học',
    description: 'Paste danh sách từ, mỗi dòng một mục để chuẩn hóa sau.',
    icon: 'clipboard-outline',
    status: 'UI chuẩn bị',
  },
];

const importMappingPreview: Record<ImportSourceId, { source: string; target: string; note: string }[]> = {
  'csv-tsv': [
    { source: 'word / term', target: 'word', note: 'Bắt buộc' },
    { source: 'definition / meaning', target: 'definition', note: 'Tự nhận diện header' },
    { source: 'ipa / pronunciation', target: 'ipa', note: 'Tùy chọn' },
    { source: 'note, tags', target: 'note, tags', note: 'Gộp vào metadata' },
  ],
  'reader-highlights': [
    { source: 'highlight text', target: 'word', note: 'Từ hoặc cụm từ đã chọn' },
    { source: 'reader note', target: 'note', note: 'Ghi chú khi đọc' },
    { source: 'document title', target: 'tags', note: 'Nguồn ngữ cảnh' },
  ],
  'class-list': [
    { source: 'line 1..n', target: 'word', note: 'Một từ mỗi dòng' },
    { source: 'word - meaning', target: 'definition', note: 'Tách nghĩa nếu có dấu phân cách' },
    { source: '#tag', target: 'tags', note: 'Chuẩn hóa topic' },
  ],
};

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
  const [activeToolId, setActiveToolId] = useState<LearningToolId | null>(null);

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
  const flashcardAnalytics = useMemo(() => getFlashcardAnalytics(libraryState, dueFlashcards), [dueFlashcards, libraryState]);

  const activeCard = filteredFlashcards[activeCardIndex];
  const activeTool = activeToolId ? learningTools.find((tool) => tool.id === activeToolId) ?? null : null;

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

  const handleUpdateCompletionSetting = (
    key: 'completionMinAverageQuality' | 'completionMinReviewCount',
    value: string
  ) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;

    const nextState: LibraryState = {
      ...libraryState,
      flashcardLearningSettings: {
        completionMinAverageQuality: libraryState.flashcardLearningSettings?.completionMinAverageQuality ?? 4,
        completionMinReviewCount: libraryState.flashcardLearningSettings?.completionMinReviewCount ?? 3,
        [key]: key === 'completionMinReviewCount' ? Math.max(1, Math.round(numericValue)) : Math.max(1, Math.min(5, numericValue)),
      },
    };

    setLibraryState(nextState);
    saveLibraryState(nextState);
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

        {activeTool ? (
          <View style={styles.toolDetailHeader}>
            <TouchableOpacity
              activeOpacity={0.78}
              accessibilityLabel="Quay lại danh sách luyện tập"
              onPress={() => setActiveToolId(null)}
              style={styles.toolBackButton}>
              <Ionicons name="chevron-back" size={18} color="#2563EB" />
            </TouchableOpacity>
            <View style={[styles.toolDetailHeaderIcon, { backgroundColor: activeTool.accent }]}>
              <Ionicons name={activeTool.icon} size={18} color="#0F172A" />
            </View>
            <Text style={styles.toolDetailTitle} numberOfLines={1}>{activeTool.title}</Text>
          </View>
        ) : (
          <View style={styles.toolList}>
            {learningTools.map((tool) => (
              <ToolTab
                key={tool.id}
                tool={tool}
                onPress={() => setActiveToolId(tool.id)}
              />
            ))}
          </View>
        )}

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

          <View style={styles.flashcardAnalyticsGrid}>
            <AnalyticsStat label="Tổng thẻ" value={flashcardAnalytics.totalCards} />
            <AnalyticsStat label="Đến hạn" value={flashcardAnalytics.dueToday} />
            <AnalyticsStat label="Lượt test" value={flashcardAnalytics.totalReviews} />
            <AnalyticsStat label="Điểm TB" value={flashcardAnalytics.averageScoreLabel} />
          </View>

          <View style={styles.flashcardStatusPanel}>
            <FlashcardStatusDonut
              completed={flashcardAnalytics.completed}
              inProgress={flashcardAnalytics.inProgress}
              started={flashcardAnalytics.started}
            />
            <View style={styles.flashcardStatusCopy}>
              <Text style={styles.flashcardStatusTitle}>Final status</Text>
              <Text style={styles.flashcardStatusText}>
                {flashcardAnalytics.completed} completed · {flashcardAnalytics.inProgress} in progress · {flashcardAnalytics.started} started
              </Text>
              <Text style={styles.flashcardStatusText}>
                Trung bình {flashcardAnalytics.averageDaysToCompleteLabel} ngày để hoàn thành.
              </Text>
            </View>
          </View>

          <View style={styles.flashcardSettingsPanel}>
            <View style={styles.settingInputGroup}>
              <Text style={styles.filterLabel}>Điểm TB để completed</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => handleUpdateCompletionSetting('completionMinAverageQuality', value)}
                style={styles.settingInput}
                value={`${libraryState.flashcardLearningSettings?.completionMinAverageQuality ?? 4}`}
              />
            </View>
            <View style={styles.settingInputGroup}>
              <Text style={styles.filterLabel}>Số lần test tối thiểu</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => handleUpdateCompletionSetting('completionMinReviewCount', value)}
                style={styles.settingInput}
                value={`${libraryState.flashcardLearningSettings?.completionMinReviewCount ?? 3}`}
              />
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
        ) : activeToolId === 'ai-chat' ? (
          <AiConversationToolPanel />
        ) : activeToolId === 'specialized-translation' ? (
          <SpecializedTranslationToolPanel />
        ) : activeToolId === 'import' ? (
          <ImportToolPanel libraryState={libraryState} />
        ) : activeToolId === 'export' ? (
          <ExportToolPanel libraryState={libraryState} />
        ) : activeTool ? (
          <LearningToolPanel tool={activeTool} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ToolTab({
  onPress,
  tool,
}: {
  onPress: () => void;
  tool: (typeof learningTools)[number];
}) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={styles.toolTab}>
      <View style={[styles.toolTabIcon, { backgroundColor: tool.accent }]}>
        <Ionicons name={tool.icon} size={18} color="#0F172A" />
      </View>
      <View style={styles.toolTabCopy}>
        <Text style={styles.toolTabText} numberOfLines={1}>{tool.title}</Text>
        <Text style={styles.toolTabDescription} numberOfLines={2}>{tool.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

type AiChatPreviewState = 'empty' | 'loading' | 'ready' | 'error';
type VoiceRecordingState = 'idle' | 'recording' | 'processing';

const aiChatThreads = [
  { id: 'travel', title: 'Đặt phòng khách sạn', preview: 'I would like to book a room...' },
  { id: 'work', title: 'Email công việc', preview: 'Please find attached the report...' },
];

const translationDomains = [
  { id: 'general', label: 'Chung' },
  { id: 'medical', label: 'Y khoa' },
  { id: 'legal', label: 'Pháp lý' },
  { id: 'tech', label: 'CNTT' },
  { id: 'academic', label: 'Học thuật' },
];

function AiConversationToolPanel() {
  const [previewState, setPreviewState] = useState<AiChatPreviewState>('empty');
  const [activeThreadId, setActiveThreadId] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceRecordingState>('idle');
  const [draftMessage, setDraftMessage] = useState('');
  const [transcript, setTranscript] = useState('');

  const activeThread = aiChatThreads.find((thread) => thread.id === activeThreadId);

  const handleOpenThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setPreviewState('loading');
    setVoiceState('idle');
    setTranscript('');
    setDraftMessage('');

    setTimeout(() => {
      setPreviewState('ready');
      setDraftMessage(aiChatThreads.find((thread) => thread.id === threadId)?.preview ?? '');
      setTranscript('Bản ghi âm và transcript sẽ hiển thị tại đây khi backend AI sẵn sàng.');
    }, 500);
  };

  const handleSimulateError = () => {
    setActiveThreadId('');
    setPreviewState('error');
    setVoiceState('idle');
    setTranscript('');
    setDraftMessage('');
  };

  const handleToggleRecording = () => {
    if (previewState !== 'ready') return;

    if (voiceState === 'idle') {
      setVoiceState('recording');
      setTranscript('Đang ghi âm... (UI preview)');
      return;
    }

    if (voiceState === 'recording') {
      setVoiceState('processing');
      setTranscript('Đang xử lý giọng nói... (UI preview)');
      setTimeout(() => {
        setVoiceState('idle');
        setTranscript('I would like to book a room for two nights, please.');
      }, 700);
    }
  };

  return (
    <View style={styles.toolPanel}>
      <View style={styles.toolPanelHeader}>
        <View style={[styles.iconWrap, { backgroundColor: '#EAF1FF' }]}>
          <Ionicons name="chatbubbles-outline" size={28} color="#0F172A" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.featureTitle}>AI hội thoại</Text>
          <Text style={styles.description}>Luyện phản xạ bằng giọng nói hoặc tin nhắn. Backend AI chưa kết nối — đây là UI shell.</Text>
        </View>
      </View>

      <View style={styles.blockedNotice}>
        <Ionicons name="lock-closed-outline" size={16} color="#B45309" />
        <Text style={styles.blockedNoticeText}>Cần backend streaming, auth và cost controls trước khi chat thật.</Text>
      </View>

      <Text style={styles.toolSectionLabel}>Danh sách hội thoại</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {aiChatThreads.map((thread) => (
          <FilterChip
            key={thread.id}
            isSelected={activeThreadId === thread.id}
            label={thread.title}
            onPress={() => handleOpenThread(thread.id)}
          />
        ))}
        <FilterChip isSelected={previewState === 'error'} label="Lỗi mẫu" onPress={handleSimulateError} />
      </ScrollView>

      {previewState === 'empty' ? (
        <View style={styles.toolStateCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#94A3B8" />
          <Text style={styles.toolStateTitle}>Chưa chọn hội thoại</Text>
          <Text style={styles.toolStateText}>Chọn một chủ đề ở trên để xem khung chat, ghi âm và feedback.</Text>
        </View>
      ) : null}

      {previewState === 'loading' ? (
        <View style={styles.toolStateCard}>
          <Text style={styles.toolStateTitle}>Đang tải hội thoại...</Text>
          <Text style={styles.toolStateText}>Chuẩn bị khung chat và transcript.</Text>
        </View>
      ) : null}

      {previewState === 'error' ? (
        <View style={[styles.toolStateCard, styles.toolStateCardError]}>
          <Ionicons name="alert-circle-outline" size={22} color="#DC2626" />
          <Text style={styles.toolStateTitle}>Không tải được hội thoại</Text>
          <Text style={styles.toolStateText}>Kiểm tra kết nối hoặc thử lại sau khi backend AI sẵn sàng.</Text>
          <TouchableOpacity activeOpacity={0.82} onPress={() => setPreviewState('empty')} style={styles.toolRetryButton}>
            <Text style={styles.toolRetryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {previewState === 'ready' && activeThread ? (
        <>
          <View style={styles.chatSurface}>
            <Text style={styles.chatBubbleLabel}>Chủ đề · {activeThread.title}</Text>
            <View style={styles.chatBubbleAssistant}>
              <Text style={styles.chatBubbleText}>Xin chào! Hãy luyện tập câu mở đầu cho tình huống này.</Text>
            </View>
            <View style={styles.chatBubbleUser}>
              <Text style={styles.chatBubbleTextUser}>{draftMessage || '...'}</Text>
            </View>
          </View>

          <View style={styles.voiceRow}>
            <TouchableOpacity
              activeOpacity={0.82}
              disabled={voiceState === 'processing'}
              onPress={handleToggleRecording}
              style={[
                styles.voiceButton,
                voiceState === 'recording' && styles.voiceButtonRecording,
                voiceState === 'processing' && styles.voiceButtonDisabled,
              ]}>
              <Ionicons
                name={voiceState === 'recording' ? 'stop-circle' : 'mic-outline'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.voiceButtonText}>
                {voiceState === 'idle' ? 'Ghi âm' : voiceState === 'recording' ? 'Dừng' : 'Đang xử lý...'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.voiceStateText}>
              {voiceState === 'idle' ? 'Sẵn sàng ghi âm' : voiceState === 'recording' ? 'Đang ghi...' : 'Đang xử lý...'}
            </Text>
          </View>

          <View style={styles.transcriptCard}>
            <Text style={styles.toolSectionLabel}>Transcript</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>

          <View style={styles.feedbackCard}>
            <Text style={styles.toolSectionLabel}>Correction / Feedback</Text>
            <Text style={styles.feedbackText}>
              Gợi ý: thay &quot;I want book room&quot; bằng &quot;I would like to book a room&quot; để tự nhiên hơn.
            </Text>
          </View>

          <TextInput
            editable={false}
            multiline
            placeholder="Nhập tin nhắn (chờ backend)..."
            placeholderTextColor="#94A3B8"
            style={styles.toolTextArea}
            value={draftMessage}
          />
        </>
      ) : null}
    </View>
  );
}

function SpecializedTranslationToolPanel() {
  const [domainId, setDomainId] = useState('general');
  const [glossaryText, setGlossaryText] = useState('MRI → cộng hưởng từ\nCT scan → chụp cắt lớp');
  const [sourceText, setSourceText] = useState('The patient underwent an MRI after the initial screening.');
  const [isTranslating, setIsTranslating] = useState(false);

  const glossaryTerms = glossaryText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [source, target] = line.split(/->|→/).map((part) => part.trim());
      return { source: source ?? line, target: target ?? '' };
    });

  const highlightedTerms = glossaryTerms.filter((term) => sourceText.toLowerCase().includes(term.source.toLowerCase()));

  const handleTranslatePreview = () => {
    setIsTranslating(true);
    setTimeout(() => setIsTranslating(false), 600);
  };

  return (
    <View style={styles.toolPanel}>
      <View style={styles.toolPanelHeader}>
        <View style={[styles.iconWrap, { backgroundColor: '#EAF8F0' }]}>
          <Ionicons name="language-outline" size={28} color="#0F172A" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.featureTitle}>Dịch chuyên ngành</Text>
          <Text style={styles.description}>Dịch theo glossary và ngữ cảnh chuyên ngành. Production translation cần backend riêng.</Text>
        </View>
      </View>

      <View style={styles.blockedNotice}>
        <Ionicons name="cloud-offline-outline" size={16} color="#B45309" />
        <Text style={styles.blockedNoticeText}>Backend dịch chuyên ngành chưa kết nối. UI preview không phải bản dịch production.</Text>
      </View>

      <Text style={styles.toolSectionLabel}>Chuyên ngành / chủ đề</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {translationDomains.map((domain) => (
          <FilterChip
            key={domain.id}
            isSelected={domainId === domain.id}
            label={domain.label}
            onPress={() => setDomainId(domain.id)}
          />
        ))}
      </ScrollView>

      <Text style={styles.toolSectionLabel}>Glossary (mỗi dòng: thuật ngữ → bản dịch)</Text>
      <TextInput
        multiline
        onChangeText={setGlossaryText}
        placeholder="term → bản dịch"
        placeholderTextColor="#94A3B8"
        style={styles.toolTextArea}
        value={glossaryText}
      />

      <Text style={styles.toolSectionLabel}>Văn bản nguồn</Text>
      <TextInput
        multiline
        onChangeText={setSourceText}
        placeholder="Nhập đoạn cần dịch..."
        placeholderTextColor="#94A3B8"
        style={styles.toolTextArea}
        value={sourceText}
      />

      {highlightedTerms.length ? (
        <View style={styles.terminologyCard}>
          <Text style={styles.toolSectionLabel}>Thuật ngữ nhận diện</Text>
          <View style={styles.terminologyRow}>
            {highlightedTerms.map((term) => (
              <View key={term.source} style={styles.terminologyChip}>
                <Text style={styles.terminologyChipText}>
                  {term.source}
                  {term.target ? ` → ${term.target}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isTranslating || !sourceText.trim()}
        onPress={handleTranslatePreview}
        style={[styles.generateButton, (isTranslating || !sourceText.trim()) && styles.generateButtonDisabled]}>
        <Ionicons name="language-outline" size={18} color="#FFFFFF" />
        <Text style={styles.generateButtonText}>{isTranslating ? 'Đang mô phỏng...' : 'Xem preview dịch (local)'}</Text>
      </TouchableOpacity>

      <View style={styles.translationOutputCard}>
        <Text style={styles.toolSectionLabel}>Kết quả dịch</Text>
        {isTranslating ? (
          <Text style={styles.toolStateText}>Đang xử lý theo glossary và domain {translationDomains.find((d) => d.id === domainId)?.label}...</Text>
        ) : (
          <Text style={styles.translationOutputText}>
            Bệnh nhân đã được chụp cộng hưởng từ sau khi sàng lọc ban đầu. (Preview UI — không dùng làm dữ liệu production.)
          </Text>
        )}
      </View>
    </View>
  );
}

function ImportToolPanel({ libraryState }: { libraryState: LibraryState }) {
  const libraryHref = '/library' as Href;
  const [sourceId, setSourceId] = useState<ImportSourceId>('csv-tsv');
  const [destinationMode, setDestinationMode] = useState<'new' | 'existing'>('new');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [flashcardChecks, setFlashcardChecks] = useState<Record<FlashcardType, boolean>>({
    bilingual: true,
    'word-definition': true,
    'definition-word': false,
    'word-pronunciation': false,
  });

  const targetFolders = useMemo(
    () => libraryState.folders.filter((folder) => folder.id !== getFavoriteFolderId()),
    [libraryState.folders]
  );
  const selectedSource = importSourceOptions.find((source) => source.id === sourceId) ?? importSourceOptions[0];
  const selectedFolder = targetFolders.find((folder) => folder.id === selectedFolderId);
  const importedWordCount = libraryState.savedWords.filter((word) => word.source === 'import').length;
  const enabledFlashcardCount = Object.values(flashcardChecks).filter(Boolean).length;

  useEffect(() => {
    if (!selectedFolderId && targetFolders.length) {
      setSelectedFolderId(targetFolders[0].id);
    }
  }, [selectedFolderId, targetFolders]);

  const handleToggleFlashcardCheck = (type: FlashcardType) => {
    setFlashcardChecks((current) => ({ ...current, [type]: !current[type] }));
  };

  return (
    <View style={styles.toolPanel}>
      <View style={styles.toolPanelHeader}>
        <View style={[styles.iconWrap, { backgroundColor: '#FFF1E8' }]}>
          <Ionicons name="cloud-upload-outline" size={28} color="#0F172A" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.featureTitle}>Nhập dữ liệu</Text>
          <Text style={styles.description}>Chuẩn bị nguồn, mapping, validate và flashcard trước khi mở flow import thật trong Library.</Text>
        </View>
      </View>

      <Text style={styles.toolSectionLabel}>Nguồn dữ liệu</Text>
      <View style={styles.importSourceGrid}>
        {importSourceOptions.map((source) => {
          const isSelected = sourceId === source.id;

          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={source.id}
              onPress={() => setSourceId(source.id)}
              style={[styles.importSourceCard, isSelected && styles.importSourceCardActive]}>
              <View style={styles.importSourceHeader}>
                <Ionicons name={source.icon} size={18} color={isSelected ? '#2563EB' : '#64748B'} />
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={isSelected ? '#2563EB' : '#CBD5E1'}
                />
              </View>
              <Text style={[styles.importSourceTitle, isSelected && styles.importSourceTitleActive]}>{source.title}</Text>
              <Text style={styles.importSourceText}>{source.description}</Text>
              <Text style={styles.importSourceStatus}>{source.status}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.importPreviewPanel}>
        <View style={styles.importPreviewHeader}>
          <Text style={styles.importPreviewTitle}>Mapping preview</Text>
          <Text style={styles.importPreviewBadge}>{selectedSource.title}</Text>
        </View>
        {importMappingPreview[sourceId].map((item) => (
          <View key={`${item.source}-${item.target}`} style={styles.importMappingPreviewRow}>
            <Text style={styles.importMappingSource} numberOfLines={1}>{item.source}</Text>
            <Ionicons name="arrow-forward" size={15} color="#94A3B8" />
            <Text style={styles.importMappingTarget} numberOfLines={1}>{item.target}</Text>
            <Text style={styles.importMappingNote} numberOfLines={1}>{item.note}</Text>
          </View>
        ))}
      </View>

      <View style={styles.importValidationGrid}>
        <ImportValidationStat label="Nguồn" value={selectedSource.status} />
        <ImportValidationStat label="Đã nhập local" value={`${importedWordCount} từ`} />
        <ImportValidationStat
          label="Bộ từ đích"
          value={destinationMode === 'new' ? 'Tạo bộ mới' : selectedFolder?.name ?? 'Chọn bộ từ'}
        />
        <ImportValidationStat label="Flashcard" value={`${enabledFlashcardCount} loại thẻ`} />
      </View>

      <View style={styles.importValidationNote}>
        <Ionicons name="checkmark-circle-outline" size={17} color="#16A34A" />
        <Text style={styles.importValidationText}>
          Flow thật trong Library đã kiểm tra file trống, thiếu khóa chính và từ trùng trước khi import.
        </Text>
      </View>

      <Text style={styles.toolSectionLabel}>Bộ từ đích</Text>
      <View style={styles.importDestinationRow}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => setDestinationMode('new')}
          style={[styles.importDestinationButton, destinationMode === 'new' && styles.importDestinationButtonActive]}>
          <Ionicons
            name={destinationMode === 'new' ? 'radio-button-on' : 'radio-button-off'}
            size={17}
            color={destinationMode === 'new' ? '#2563EB' : '#94A3B8'}
          />
          <Text style={[styles.importDestinationText, destinationMode === 'new' && styles.importDestinationTextActive]}>
            Bộ từ mới theo tên file
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => {
            setDestinationMode('existing');
            setSelectedFolderId((current) => current || targetFolders[0]?.id || '');
          }}
          style={[styles.importDestinationButton, destinationMode === 'existing' && styles.importDestinationButtonActive]}>
          <Ionicons
            name={destinationMode === 'existing' ? 'radio-button-on' : 'radio-button-off'}
            size={17}
            color={destinationMode === 'existing' ? '#2563EB' : '#94A3B8'}
          />
          <Text style={[styles.importDestinationText, destinationMode === 'existing' && styles.importDestinationTextActive]}>
            Bộ từ có sẵn
          </Text>
        </TouchableOpacity>
      </View>

      {destinationMode === 'existing' ? (
        targetFolders.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.importFolderPickerRow}>
            {targetFolders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;

              return (
                <FilterChip
                  key={folder.id}
                  isSelected={isSelected}
                  label={folder.name}
                  onPress={() => setSelectedFolderId(folder.id)}
                />
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.toolStateCard}>
            <Ionicons name="folder-open-outline" size={22} color="#94A3B8" />
            <Text style={styles.toolStateTitle}>Chưa có bộ từ đích</Text>
            <Text style={styles.toolStateText}>Tạo bộ từ mới khi import hoặc tạo folder trước trong Library.</Text>
          </View>
        )
      ) : null}

      <Text style={styles.toolSectionLabel}>Checklist tạo flashcard</Text>
      <View style={styles.importFlashcardGrid}>
        {flashcardOptions.map((option) => {
          const isSelected = flashcardChecks[option.type];

          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={option.type}
              onPress={() => handleToggleFlashcardCheck(option.type)}
              style={[styles.importFlashcardPlanItem, isSelected && styles.importFlashcardPlanItemActive]}>
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={20}
                color={isSelected ? '#2563EB' : '#94A3B8'}
              />
              <View style={styles.importFlashcardPlanCopy}>
                <Text style={styles.importFlashcardPlanTitle}>{option.label}</Text>
                <Text style={styles.importFlashcardPlanText}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Link href={libraryHref} asChild>
        <TouchableOpacity activeOpacity={0.85} style={styles.generateButton}>
          <Ionicons name="open-outline" size={18} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>Mở Library để import file</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

function ImportValidationStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.importValidationStat}>
      <Text style={styles.importValidationValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.importValidationLabel}>{label}</Text>
    </View>
  );
}

const exportActions: {
  id: ExportActionId;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  status: string;
}[] = [
  {
    id: 'csv',
    title: 'CSV',
    description: 'Bảng từ vựng cơ bản, dễ mở bằng Sheets hoặc Excel.',
    icon: 'document-text-outline',
    status: 'Sẵn sàng',
  },
  {
    id: 'excel',
    title: 'Excel .xls',
    description: 'File HTML-compatible để mở nhanh trong Excel.',
    icon: 'grid-outline',
    status: 'Sẵn sàng',
  },
  {
    id: 'anki',
    title: 'Anki text',
    description: 'TSV text deck với front, back và tags.',
    icon: 'albums-outline',
    status: 'Sẵn sàng',
  },
  {
    id: 'google-sheets',
    title: 'Google Sheets',
    description: 'Cần OAuth và Google API trước khi xuất trực tiếp.',
    icon: 'cloud-offline-outline',
    status: 'Bị chặn',
  },
];

function ExportToolPanel({ libraryState }: { libraryState: LibraryState }) {
  const libraryHref = '/library' as Href;
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [activeActionId, setActiveActionId] = useState<ExportActionId>('csv');
  const [isRunningExport, setIsRunningExport] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Chọn bộ từ và định dạng để xuất file local.');
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);

  const exportFolders = useMemo(
    () => libraryState.folders.filter((folder) => folder.id !== getFavoriteFolderId()),
    [libraryState.folders]
  );
  const selectedFolder = exportFolders.find((folder) => folder.id === selectedFolderId);
  const selectedFolderWordCount = selectedFolder
    ? libraryState.savedWords.filter((word) => word.folderIds.includes(selectedFolder.id)).length
    : 0;
  const canExport = Boolean(selectedFolder && selectedFolderWordCount && activeActionId !== 'google-sheets');

  useEffect(() => {
    if (!selectedFolderId && exportFolders.length) {
      setSelectedFolderId(exportFolders[0].id);
      return;
    }

    if (selectedFolderId && !exportFolders.some((folder) => folder.id === selectedFolderId)) {
      setSelectedFolderId(exportFolders[0]?.id ?? '');
    }
  }, [exportFolders, selectedFolderId]);

  const addHistoryItem = (item: Omit<ExportHistoryItem, 'id' | 'createdAt'>) => {
    setHistory((current) => [
      {
        ...item,
        id: `${item.action}-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 5));
  };

  const handleRunExport = async () => {
    if (activeActionId === 'google-sheets') {
      const message = 'Google Sheets cần OAuth và Google API flow, nên chưa thể xuất trực tiếp.';
      setStatusMessage(message);
      addHistoryItem({
        action: activeActionId,
        folderName: selectedFolder?.name ?? 'Chưa chọn bộ từ',
        message,
        status: 'blocked',
      });
      return;
    }

    if (!selectedFolder) {
      const message = 'Chọn một bộ từ trước khi xuất.';
      setStatusMessage(message);
      addHistoryItem({ action: activeActionId, folderName: 'Chưa chọn bộ từ', message, status: 'failed' });
      return;
    }

    if (!selectedFolderWordCount) {
      const message = 'Bộ từ này chưa có từ đã lưu để xuất.';
      setStatusMessage(message);
      addHistoryItem({ action: activeActionId, folderName: selectedFolder.name, message, status: 'failed' });
      return;
    }

    try {
      setIsRunningExport(true);
      setStatusMessage(`Đang xuất ${selectedFolder.name} sang ${formatExportActionLabel(activeActionId)}...`);
      const result =
        activeActionId === 'excel'
          ? await exportFolderToExcel(libraryState, selectedFolder.id)
          : activeActionId === 'anki'
            ? await exportFolderToAnkiTsv(libraryState, selectedFolder.id)
            : await exportFolderToCsv(libraryState, selectedFolder.id);

      setStatusMessage(result.message);
      addHistoryItem({
        action: activeActionId,
        folderName: selectedFolder.name,
        message: result.message,
        status: result.ok ? 'success' : 'failed',
      });

      Alert.alert(result.ok ? 'Đã xuất' : 'Chưa thể xuất', result.message);
    } catch {
      const message = 'Không thể xuất bộ từ này.';
      setStatusMessage(message);
      addHistoryItem({ action: activeActionId, folderName: selectedFolder.name, message, status: 'failed' });
      Alert.alert('Lỗi xuất dữ liệu', message);
    } finally {
      setIsRunningExport(false);
    }
  };

  return (
    <View style={styles.toolPanel}>
      <View style={styles.toolPanelHeader}>
        <View style={[styles.iconWrap, { backgroundColor: '#EAF7FA' }]}>
          <Ionicons name="download-outline" size={28} color="#0F172A" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.featureTitle}>Xuất bộ từ</Text>
          <Text style={styles.description}>Xuất bộ từ local sang CSV, Excel-compatible hoặc Anki text để học ngoài app.</Text>
        </View>
      </View>

      <View style={styles.blockedNotice}>
        <Ionicons name="lock-closed-outline" size={16} color="#B45309" />
        <Text style={styles.blockedNoticeText}>Google Sheets export vẫn bị chặn cho tới khi chọn OAuth và Google API flow.</Text>
      </View>

      <Text style={styles.toolSectionLabel}>Bộ từ cần xuất</Text>
      {exportFolders.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.importFolderPickerRow}>
          {exportFolders.map((folder) => (
            <FilterChip
              key={folder.id}
              isSelected={selectedFolderId === folder.id}
              label={folder.name}
              onPress={() => setSelectedFolderId(folder.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.toolStateCard}>
          <Ionicons name="folder-open-outline" size={22} color="#94A3B8" />
          <Text style={styles.toolStateTitle}>Chưa có bộ từ để xuất</Text>
          <Text style={styles.toolStateText}>Tạo folder và lưu vài từ trong Library trước khi xuất file.</Text>
          <Link href={libraryHref} asChild>
            <TouchableOpacity activeOpacity={0.82} style={styles.toolRetryButton}>
              <Text style={styles.toolRetryButtonText}>Mở Library</Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}

      <View style={styles.exportSummaryGrid}>
        <ImportValidationStat label="Bộ từ" value={selectedFolder?.name ?? 'Chưa chọn'} />
        <ImportValidationStat label="Số từ" value={`${selectedFolderWordCount} từ`} />
      </View>

      <Text style={styles.toolSectionLabel}>Định dạng</Text>
      <View style={styles.exportActionGrid}>
        {exportActions.map((action) => {
          const isSelected = activeActionId === action.id;
          const isBlocked = action.id === 'google-sheets';

          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={action.id}
              onPress={() => setActiveActionId(action.id)}
              style={[
                styles.exportActionCard,
                isSelected && styles.exportActionCardActive,
                isBlocked && styles.exportActionCardBlocked,
              ]}>
              <View style={styles.importSourceHeader}>
                <Ionicons name={action.icon} size={18} color={isBlocked ? '#B45309' : isSelected ? '#2563EB' : '#64748B'} />
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={isSelected ? '#2563EB' : '#CBD5E1'}
                />
              </View>
              <Text style={[styles.importSourceTitle, isSelected && styles.importSourceTitleActive]}>{action.title}</Text>
              <Text style={styles.importSourceText}>{action.description}</Text>
              <Text style={[styles.importSourceStatus, isBlocked && styles.exportBlockedStatus]}>{action.status}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isRunningExport || (!canExport && activeActionId !== 'google-sheets')}
        onPress={handleRunExport}
        style={[
          styles.exportButton,
          (isRunningExport || (!canExport && activeActionId !== 'google-sheets')) && styles.exportButtonDisabled,
        ]}>
        <Ionicons name={activeActionId === 'google-sheets' ? 'lock-closed-outline' : 'download-outline'} size={18} color="#FFFFFF" />
        <Text style={styles.exportButtonText}>
          {isRunningExport ? 'Đang xuất...' : activeActionId === 'google-sheets' ? 'Xem trạng thái bị chặn' : 'Xuất file'}
        </Text>
      </TouchableOpacity>

      <View style={styles.exportStatusCard}>
        <Text style={styles.toolSectionLabel}>Trạng thái</Text>
        <Text style={styles.exportStatusText}>{statusMessage}</Text>
      </View>

      <Text style={styles.toolSectionLabel}>Lịch sử phiên này</Text>
      {history.length ? (
        <View style={styles.exportHistoryList}>
          {history.map((item) => (
            <View key={item.id} style={styles.exportHistoryRow}>
              <Ionicons
                name={item.status === 'success' ? 'checkmark-circle-outline' : item.status === 'blocked' ? 'lock-closed-outline' : 'alert-circle-outline'}
                size={18}
                color={item.status === 'success' ? '#16A34A' : item.status === 'blocked' ? '#B45309' : '#DC2626'}
              />
              <View style={styles.exportHistoryCopy}>
                <Text style={styles.exportHistoryTitle} numberOfLines={1}>
                  {formatExportActionLabel(item.action)} · {item.folderName}
                </Text>
                <Text style={styles.exportHistoryMessage} numberOfLines={2}>{item.message}</Text>
              </View>
              <Text style={styles.exportHistoryTime}>{formatExportTimestamp(item.createdAt)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.toolStateCard}>
          <Ionicons name="time-outline" size={22} color="#94A3B8" />
          <Text style={styles.toolStateTitle}>Chưa có lượt xuất</Text>
          <Text style={styles.toolStateText}>Kết quả xuất file trong phiên này sẽ hiện ở đây.</Text>
        </View>
      )}
    </View>
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

function AnalyticsStat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.analyticsStat}>
      <Text style={styles.analyticsStatValue}>{value}</Text>
      <Text style={styles.analyticsStatLabel}>{label}</Text>
    </View>
  );
}

function FlashcardStatusDonut({
  completed,
  inProgress,
  started,
}: {
  completed: number;
  inProgress: number;
  started: number;
}) {
  const total = Math.max(1, completed + inProgress + started);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { color: '#16A34A', value: completed },
    { color: '#2563EB', value: inProgress },
    { color: '#F59E0B', value: started },
  ];
  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <Svg height={86} width={86} viewBox="0 0 86 86">
        <Circle cx="43" cy="43" fill="none" r={radius} stroke="#E2E8F0" strokeWidth="10" />
        {segments.map((segment) => {
          const dash = (segment.value / total) * circumference;
          const strokeDashoffset = -offset;
          offset += dash;

          return (
            <Circle
              key={segment.color}
              cx="43"
              cy="43"
              fill="none"
              r={radius}
              rotation="-90"
              origin="43,43"
              stroke={segment.color}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="10"
            />
          );
        })}
      </Svg>
      <Text style={styles.donutCenter}>{completed}</Text>
    </View>
  );
}

function getFlashcardAnalytics(state: LibraryState, dueToday: number) {
  const reviewEvents = state.flashcardReviewEvents ?? [];
  const totalReviews = reviewEvents.length;
  const averageScore = totalReviews ? reviewEvents.reduce((sum, event) => sum + event.quality, 0) / totalReviews : 0;
  const completedCards = state.flashcards.filter((card) => card.finalStatus === 'completed');
  const completedDurations = completedCards.flatMap((card) => {
    if (!card.completedAt) return [];
    const createdAt = new Date(card.createdAt).getTime();
    const completedAt = new Date(card.completedAt).getTime();
    if (!Number.isFinite(createdAt) || !Number.isFinite(completedAt)) return [];

    return [Math.max(0, Math.ceil((completedAt - createdAt) / 86_400_000))];
  });
  const averageDaysToComplete = completedDurations.length
    ? completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length
    : 0;

  return {
    averageDaysToCompleteLabel: completedDurations.length ? averageDaysToComplete.toFixed(1) : '0',
    averageScoreLabel: totalReviews ? averageScore.toFixed(1) : '0',
    completed: completedCards.length,
    dueToday,
    inProgress: state.flashcards.filter((card) => card.finalStatus === 'in_progress').length,
    started: state.flashcards.filter((card) => !card.finalStatus || card.finalStatus === 'started').length,
    totalCards: state.flashcards.length,
    totalReviews,
  };
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

function formatExportActionLabel(actionId: ExportActionId) {
  if (actionId === 'excel') return 'Excel';
  if (actionId === 'anki') return 'Anki text';
  if (actionId === 'google-sheets') return 'Google Sheets';

  return 'CSV';
}

function formatExportTimestamp(value: string) {
  const date = new Date(value);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${hours}:${minutes}`;
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
  flashcardAnalyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  analyticsStat: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
    padding: 10,
  },
  analyticsStatValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  analyticsStatLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  flashcardStatusPanel: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    padding: 12,
  },
  flashcardStatusCopy: {
    flex: 1,
    minWidth: 0,
  },
  flashcardStatusTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  flashcardStatusText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 4,
  },
  donutWrap: {
    alignItems: 'center',
    height: 86,
    justifyContent: 'center',
    width: 86,
  },
  donutCenter: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    position: 'absolute',
  },
  flashcardSettingsPanel: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    padding: 10,
  },
  settingInputGroup: {
    flex: 1,
    minWidth: 0,
  },
  settingInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FDBA74',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  toolList: {
    gap: 10,
    marginBottom: 16,
  },
  toolTab: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  toolTabIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  toolTabCopy: {
    flex: 1,
    minWidth: 0,
  },
  toolTabText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  toolTabDescription: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 3,
  },
  toolDetailHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    padding: 10,
  },
  toolBackButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  toolDetailHeaderIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  toolDetailTitle: {
    color: '#0F172A',
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    minWidth: 0,
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
  importSourceGrid: {
    gap: 8,
    marginTop: 10,
  },
  importSourceCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 11,
  },
  importSourceCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  importSourceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  importSourceTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  importSourceTitleActive: {
    color: '#2563EB',
  },
  importSourceText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 4,
  },
  importSourceStatus: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  importPreviewPanel: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 11,
  },
  importPreviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  importPreviewTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  importPreviewBadge: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '900',
  },
  importMappingPreviewRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 7,
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 9,
  },
  importMappingSource: {
    color: '#475569',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  importMappingTarget: {
    color: '#0F172A',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  importMappingNote: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 104,
  },
  importValidationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  importValidationStat: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    width: '48%',
  },
  importValidationValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  importValidationLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  importValidationNote: {
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    padding: 10,
  },
  importValidationText: {
    color: '#166534',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  importDestinationRow: {
    gap: 8,
    marginTop: 10,
  },
  importDestinationButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 11,
  },
  importDestinationButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  importDestinationText: {
    color: '#64748B',
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  importDestinationTextActive: {
    color: '#2563EB',
  },
  importFolderPickerRow: {
    gap: 8,
    marginTop: 10,
    paddingBottom: 2,
  },
  importFlashcardGrid: {
    gap: 8,
    marginTop: 10,
  },
  importFlashcardPlanItem: {
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 11,
  },
  importFlashcardPlanItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  importFlashcardPlanCopy: {
    flex: 1,
  },
  importFlashcardPlanTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  importFlashcardPlanText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 3,
  },
  exportSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  exportActionGrid: {
    gap: 8,
    marginTop: 10,
  },
  exportActionCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 11,
  },
  exportActionCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  exportActionCardBlocked: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  exportBlockedStatus: {
    color: '#B45309',
  },
  exportStatusCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  exportStatusText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 5,
  },
  exportHistoryList: {
    gap: 8,
    marginTop: 10,
  },
  exportHistoryRow: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 10,
  },
  exportHistoryCopy: {
    flex: 1,
  },
  exportHistoryTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  exportHistoryMessage: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 3,
  },
  exportHistoryTime: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
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
  blockedNotice: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 10,
  },
  blockedNoticeText: {
    color: '#92400E',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  toolSectionLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 14,
    textTransform: 'uppercase',
  },
  toolStateCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginTop: 12,
    padding: 16,
  },
  toolStateCardError: {
    backgroundColor: '#FEF2F2',
  },
  toolStateTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8,
  },
  toolStateText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 5,
    textAlign: 'center',
  },
  toolRetryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FECACA',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toolRetryButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '900',
  },
  chatSurface: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
    padding: 12,
  },
  chatBubbleLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  chatBubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    maxWidth: '92%',
    padding: 10,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    maxWidth: '92%',
    padding: 10,
  },
  chatBubbleText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  chatBubbleTextUser: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  voiceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  voiceButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  voiceButtonRecording: {
    backgroundColor: '#DC2626',
  },
  voiceButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  voiceButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  voiceStateText: {
    color: '#64748B',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  transcriptCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  transcriptText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 4,
  },
  feedbackCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  feedbackText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  toolTextArea: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
    minHeight: 88,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  terminologyCard: {
    marginTop: 4,
  },
  terminologyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  terminologyChip: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  terminologyChipText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '900',
  },
  translationOutputCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  translationOutputText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 4,
  },
});
