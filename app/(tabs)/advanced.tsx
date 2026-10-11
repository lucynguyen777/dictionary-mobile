import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Screen from '@/components/app/Screen';
import { useToken } from '@/hooks/use-token';
import { Flashcard, FlashcardReviewState, FlashcardType, LibraryState, createFlashcardsFromSavedWords, exportFlashcardsToAnkiText, getDefaultLibraryState, loadLibraryState, reviewFlashcard, saveLibraryState } from '@/data/libraryStore';
import { countDueFlashcards } from '@/data/studyStats';
import { extractReaderDocument, getReaderImportFormat, getUnsupportedReaderImportMessage, isEnabledReaderImportFormat } from '@/data/readerImport';
import { ReaderState, getDefaultReaderState, importReaderText, loadReaderState, selectReaderDocument } from '@/data/readerStore';

import { FilterChip, flashcardModeOptions, flashcardOptions, formatFlashcardType, formatReviewState, reviewFilterOptions, typeFilterOptions, type FlashcardMode, type LearningToolId } from '@/components/training/shared';
import { ImportToolPanel } from '@/components/training/ImportToolPanel';
import { ExportToolPanel, useGoogleSheetsReturnParams } from '@/components/training/ExportToolPanel';
import { LearningToolPanel, ToolTab, learningTools } from '@/components/training/LearningTools';
import { SpecializedTranslationToolPanel } from '@/components/training/SpecializedTranslationToolPanel';
import { ReaderLibraryToolPanel } from '@/components/training/ReaderLibraryToolPanel';
import { AnalyticsStat, FlashcardStatusDonut, getFlashcardAnalytics } from '@/components/training/FlashcardAnalytics';
import { styles } from '@/components/training/styles';

export default function AdvancedScreen() {
  const router = useRouter();
  const { colors, radius, shadows } = useToken();
  const themed = useMemo(
    () =>
      StyleSheet.create({
        activeChip: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.accentPrimary,
        },
        activeChipText: {
          color: colors.accentPrimary,
        },
        card: {
          backgroundColor: colors.surface,
          borderColor: colors.borderDefault,
          ...shadows.sm,
        },
        hero: {
          backgroundColor: colors.surfaceHero,
          borderColor: colors.borderMuted,
          borderWidth: 1,
          ...shadows.md,
        },
        input: {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.borderDefault,
          color: colors.textPrimary,
        },
        mutedPanel: {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.borderDefault,
        },
        mutedText: {
          color: colors.textSecondary,
        },
        primaryButton: {
          backgroundColor: colors.accentPrimary,
          borderRadius: radius.md,
          ...shadows.glow,
        },
        primaryText: {
          color: colors.textPrimary,
        },
        screen: {
          backgroundColor: colors.canvasAlt,
        },
        softBadge: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.focusRing,
        },
      }),
    [colors, radius.md, shadows.glow, shadows.md, shadows.sm]
  );
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [readerState, setReaderState] = useState<ReaderState>(getDefaultReaderState());
  const [isImportingReaderDocument, setIsImportingReaderDocument] = useState(false);
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
  const googleSheetsReturn = useGoogleSheetsReturnParams();
  const [activeToolId, setActiveToolId] = useState<LearningToolId | null>(googleSheetsReturn ? 'export' : null);
  const [flashcardMode, setFlashcardMode] = useState<FlashcardMode>('dashboard');

  useEffect(() => {
    if (googleSheetsReturn) setActiveToolId('export');
  }, [googleSheetsReturn]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      Promise.all([loadLibraryState(), loadReaderState()]).then(([nextLibraryState, nextReaderState]) => {
        if (!isMounted) return;
        setLibraryState(nextLibraryState);
        setReaderState(nextReaderState);
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

  const dueFlashcards = useMemo(() => countDueFlashcards(libraryState.flashcards), [libraryState.flashcards]);
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

  const handleImportReaderDocument = async () => {
    if (isImportingReaderDocument) return;

    setIsImportingReaderDocument(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          'text/plain',
          'text/html',
          'application/xhtml+xml',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/epub+zip',
          'application/pdf',
        ],
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const format = getReaderImportFormat(asset.name, asset.mimeType);
      if (!isEnabledReaderImportFormat(format)) {
        Alert.alert('Định dạng chưa hỗ trợ', getUnsupportedReaderImportMessage(format));
        return;
      }

      const pickedFile = asset.file ?? new File(asset.uri);
      const rawContent = format === 'docx' || format === 'epub' || format === 'pdf'
        ? await pickedFile.arrayBuffer()
        : await pickedFile.text();
      const extracted = await extractReaderDocument(asset.name, rawContent, asset.mimeType);

      const nextState = await importReaderText(
        readerState,
        extracted.title,
        extracted.content,
        extracted.sourceFormat
      );
      setReaderState(nextState);
      Alert.alert('Đã nhập tài liệu', `"${extracted.title}" đã sẵn sàng trong thư viện đọc.`);
    } catch (error) {
      Alert.alert('Không thể nhập file', error instanceof Error ? error.message : 'Vui lòng thử lại với file khác.');
    } finally {
      setIsImportingReaderDocument(false);
    }
  };

  const handleOpenReaderDocument = async (documentId: string) => {
    const nextState = await selectReaderDocument(readerState, documentId);
    setReaderState(nextState);
    router.push('/reader');
  };

  return (
    <Screen style={themed.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, themed.mutedText]}>Phòng luyện tập</Text>
        <Text style={[styles.title, themed.primaryText]}>Công cụ học nâng cao</Text>
        {(!activeToolId || activeToolId === 'flashcards') ? (
          <View style={[styles.challengeCard, themed.hero]}>
            <View style={[styles.challengeIcon, { backgroundColor: colors.accentPrimary }]}>
              <Ionicons name="flash" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.challengeCopy}>
              <Text style={[styles.challengeTitle, { color: colors.textOnHero }]}>{dueFlashcards} thẻ cần ôn</Text>
              <Text style={[styles.challengeText, { color: colors.textOnHeroMuted }]}>Lọc theo bộ từ, loại thẻ hoặc trạng thái để ôn đúng nhóm cần học.</Text>
            </View>
          </View>
        ) : null}

        {activeTool ? (
          <View style={[styles.toolDetailHeader, themed.card]}>
            <TouchableOpacity
              activeOpacity={0.78}
              accessibilityLabel="Quay lại danh sách luyện tập"
              onPress={() => setActiveToolId(null)}
              style={[styles.toolBackButton, themed.softBadge]}>
              <Ionicons name="chevron-back" size={18} color={colors.accentPrimary} />
            </TouchableOpacity>
            <View style={[styles.toolDetailHeaderIcon, { backgroundColor: activeTool.accent }]}>
              <Ionicons name={activeTool.icon} size={18} color="#0F172A" />
            </View>
            <Text style={[styles.toolDetailTitle, themed.primaryText]} numberOfLines={1}>{activeTool.title}</Text>
          </View>
        ) : (
          <View style={styles.toolList}>
            {learningTools.map((tool) => (
              <ToolTab
                key={tool.id}
                tool={tool}
                onPress={() => (tool.id === 'ai-chat' ? router.push('/ai-assistant' as Href) : setActiveToolId(tool.id))}
              />
            ))}
          </View>
        )}

        {activeToolId === 'flashcards' ? (
          <View style={[styles.flashcardPanel, themed.card]}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={[styles.panelKicker, themed.mutedText]}>Flashcard local</Text>
              <Text style={[styles.panelTitle, themed.primaryText]}>{filteredFlashcards.length} / {libraryState.flashcards.length} thẻ</Text>
            </View>
            <View style={[styles.savedWordPill, themed.softBadge]}>
              <Text style={[styles.savedWordPillText, themed.activeChipText]}>{libraryState.savedWords.length} từ</Text>
            </View>
          </View>

          <View style={[styles.flashcardModeTabs, themed.mutedPanel]}>
            {flashcardModeOptions.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                activeOpacity={0.82}
                onPress={() => setFlashcardMode(mode.value)}
                style={[styles.flashcardModeTab, flashcardMode === mode.value && styles.flashcardModeTabActive, flashcardMode === mode.value && themed.primaryButton]}>
                <Text style={[styles.flashcardModeTabText, themed.mutedText, flashcardMode === mode.value && styles.flashcardModeTabTextActive]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {flashcardMode === 'dashboard' ? (
            <>
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

          <View style={[styles.flashcardSettingsPanel, themed.mutedPanel]}>
            <View style={styles.settingInputGroup}>
              <Text style={[styles.filterLabel, themed.mutedText]}>Điểm TB để completed</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => handleUpdateCompletionSetting('completionMinAverageQuality', value)}
                style={[styles.settingInput, themed.input]}
                value={`${libraryState.flashcardLearningSettings?.completionMinAverageQuality ?? 4}`}
              />
            </View>
            <View style={styles.settingInputGroup}>
              <Text style={[styles.filterLabel, themed.mutedText]}>Số lần test tối thiểu</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => handleUpdateCompletionSetting('completionMinReviewCount', value)}
                style={[styles.settingInput, themed.input]}
                value={`${libraryState.flashcardLearningSettings?.completionMinReviewCount ?? 3}`}
              />
            </View>
          </View>
            </>
          ) : null}

          {flashcardMode === 'manage' ? (
            <>
          <View style={styles.checklist}>
            {flashcardOptions.map((option) => {
              const isSelected = selectedTypes[option.type];

              return (
                <TouchableOpacity
                  key={option.type}
                  activeOpacity={0.82}
                  onPress={() => handleToggleFlashcardType(option.type)}
                  style={[styles.checkItem, themed.mutedPanel, isSelected && styles.checkItemActive, isSelected && themed.activeChip]}>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={21}
                    color={isSelected ? colors.accentPrimary : colors.textTertiary}
                  />
                  <View style={styles.checkCopy}>
                    <Text style={[styles.checkLabel, themed.primaryText]}>{option.label}</Text>
                    <Text style={[styles.checkDescription, themed.mutedText]}>{option.description}</Text>
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
              themed.primaryButton,
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

          <View style={[styles.filterBlock, themed.mutedPanel]}>
            <Text style={[styles.filterLabel, themed.mutedText]}>Bộ từ</Text>
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
            <Text style={[styles.filterLabel, themed.mutedText]}>Loại thẻ</Text>
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
            <Text style={[styles.filterLabel, themed.mutedText]}>Trạng thái</Text>
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
            </>
          ) : null}

          {flashcardMode === 'study' ? (
          activeCard ? (
            <View style={[styles.reviewCard, themed.mutedPanel]}>
              <Text style={[styles.reviewType, themed.mutedText]}>{formatFlashcardType(activeCard.type)} · {formatReviewState(activeCard.reviewState)}</Text>
              <TouchableOpacity activeOpacity={0.86} onPress={() => setShowBack((value) => !value)} style={styles.flashcardFace}>
                <Text style={styles.faceLabel}>{showBack ? 'Back' : 'Front'}</Text>
                <Text style={styles.faceText}>{showBack ? activeCard.back : activeCard.front}</Text>
              </TouchableOpacity>
              <View style={styles.reviewActions}>
                <TouchableOpacity activeOpacity={0.82} onPress={() => handleReviewCard(activeCard, 1)} style={styles.againButton}>
                  <Text style={styles.againButtonText}>Lại</Text>
                  <Text style={styles.reviewButtonHint}>Không nhớ</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.82} onPress={() => handleReviewCard(activeCard, 3)} style={styles.hardButton}>
                  <Text style={styles.hardButtonText}>Khó</Text>
                  <Text style={styles.reviewButtonHint}>Nhớ chậm</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.82} onPress={() => handleReviewCard(activeCard, 4)} style={styles.goodButton}>
                  <Text style={styles.goodButtonText}>Tốt</Text>
                  <Text style={styles.reviewButtonHint}>Nhớ được</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.82} onPress={() => handleReviewCard(activeCard, 5)} style={styles.easyButton}>
                  <Text style={styles.easyButtonText}>Dễ</Text>
                  <Text style={styles.reviewButtonHint}>Rất nhanh</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.emptyFlashcard, themed.mutedPanel]}>
              <Ionicons name="albums-outline" size={23} color={colors.textTertiary} />
              <Text style={[styles.emptyFlashcardTitle, themed.primaryText]}>{libraryState.flashcards.length ? 'Không có thẻ phù hợp' : 'Chưa có flashcard'}</Text>
              <Text style={[styles.emptyFlashcardText, themed.mutedText]}>
                {libraryState.flashcards.length
                  ? 'Đổi bộ lọc để xem nhóm thẻ khác.'
                  : 'Lưu vài từ trong tab Tra cứu, chọn loại thẻ, rồi tạo flashcard tại đây.'}
              </Text>
            </View>
          )
          ) : null}
          </View>
        ) : activeToolId === 'specialized-translation' ? (
          <SpecializedTranslationToolPanel />
        ) : activeToolId === 'import' ? (
          <ImportToolPanel libraryState={libraryState} />
        ) : activeToolId === 'reader' ? (
          <ReaderLibraryToolPanel
            isImporting={isImportingReaderDocument}
            onImport={handleImportReaderDocument}
            onOpenDocument={handleOpenReaderDocument}
            readerState={readerState}
          />
        ) : activeToolId === 'export' ? (
          <ExportToolPanel libraryState={libraryState} />
        ) : activeTool ? (
          <LearningToolPanel tool={activeTool} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
