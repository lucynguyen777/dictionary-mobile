import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Modal, Platform, ScrollView, Text, View } from 'react-native';
import Touchable from '@/components/app/Touchable';
import Screen from '@/components/app/Screen';
import { LibraryState, getDefaultLibraryState, loadLibraryState } from '@/data/libraryStore';
import { ReaderSettings, ReaderState, getDefaultReaderState, loadReaderState, selectReaderDocument, updateReaderSettings } from '@/data/readerStore';
import { loadUserProfile } from '@/data/profileStore';
import { getStoredItem, setStoredItem } from '@/data/storageAdapter';
import { loadAppColorSchemePreference, resolveAppColorScheme } from '@/data/appThemePreference';
import { type LanguageCode } from '@/data/languages';
import { buildTokenSentenceMap, groupReaderParagraphs, splitReaderSentences, tokenizeReaderText, type ReaderParagraphRange } from '@/data/readerText';
import { getReaderBackgroundPreset, readerBackgroundPresets, type ReaderBackgroundPresetId } from '@/data/readerTheme';

import { buildReaderTocItems, defaultPrefs, fontOptions, getReaderTextStyle, speedOptions, themeOptions, voiceProfiles, type ReaderPreferences, type ReaderSheet } from '@/components/reader/readerOptions';
import { ReaderParagraph } from '@/components/reader/ReaderParagraph';
import { ReaderDockButton } from '@/components/reader/ReaderDockButton';
import { ReaderHighlightPanel } from '@/components/reader/ReaderHighlightPanel';
import { ReaderSettingsSheet, ReaderTocSheet } from '@/components/reader/ReaderSheets';
import { styles } from '@/components/reader/styles';
import { READER_THEME_COLORS } from '@/constants/readerThemes';
import { useReaderScroll } from '@/components/reader/useReaderScroll';
import { saveReaderSelection } from '@/data/readerSave';
import { useReaderSpeech } from '@/components/reader/useReaderSpeech';
import { ReaderAudioPanel } from '@/components/reader/ReaderAudioPanel';
import SkeletonBlock from '@/components/app/SkeletonBlock';

const PREFS_STORAGE_KEY = 'dictionary-mobile.reader-prefs.v1';

export default function ReaderScreen() {
  const [readerState, setReaderState] = useState<ReaderState>(getDefaultReaderState());
  const [isLoaded, setIsLoaded] = useState(false);
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [quickNote, setQuickNote] = useState('');
  const [readerSaveMessage, setReaderSaveMessage] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [readerSourceLang, setReaderSourceLang] = useState<LanguageCode>('en');
  const [readerTargetLang, setReaderTargetLang] = useState<LanguageCode>('vi');
  const [resolvedAppTheme, setResolvedAppTheme] = useState<'light' | 'dark'>('light');

  // Custom Local Preferences (Theme, TTS Voice, TTS Speed)
  const [preferences, setPreferences] = useState<ReaderPreferences>(defaultPrefs);

  // Scrubber Progress & Scroll state
  // Paragraphs are virtualized: only those near the viewport are rendered, so long books stay fast.
  const listRef = useRef<FlatList<ReaderParagraphRange>>(null);
  const scrollToY = useCallback((y: number, animated: boolean) => listRef.current?.scrollToOffset({ animated, offset: y }), []);
  const {
    handleAutoScrollToggle,
    handleNextPage,
    handlePrevPage,
    handleProgressChange,
    handleScroll,
    handleScrubberTouch,
    isAutoScrolling,
    progress,
    setContentHeight,
    setIsAutoScrolling,
    setScrollViewHeight,
    setScrubberWidth,
  } = useReaderScroll(scrollToY, preferences.ttsSpeed);

  // TTS State
  const [activeSheet, setActiveSheet] = useState<ReaderSheet>(null);
  const [showAudioProgress, setShowAudioProgress] = useState(false);

  // Load preferences and state
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      Promise.all([
        loadReaderState(),
        loadLibraryState(),
        loadUserProfile(),
        loadAppColorSchemePreference(),
        getStoredItem(PREFS_STORAGE_KEY),
      ]).then(([nextReaderState, nextLibraryState, profile, appThemePreference, rawPrefs]) => {
        if (!isMounted) return;

        setReaderState(nextReaderState);
        setLibraryState(nextLibraryState);
        setResolvedAppTheme(resolveAppColorScheme(appThemePreference));
        setReaderSourceLang(nextReaderState.settings.sourceLanguage);
        setReaderTargetLang(nextReaderState.settings.targetLanguage || profile.nativeLanguage || 'vi');

        if (rawPrefs) {
          try {
            const parsedPrefs = JSON.parse(rawPrefs) as Partial<ReaderPreferences>;
            const backgroundPreset = getReaderBackgroundPreset(
              parsedPrefs.backgroundPresetId ?? nextReaderState.settings.backgroundPresetId,
              nextReaderState.settings.backgroundColor
            );
            setPreferences({
              ...defaultPrefs,
              ...parsedPrefs,
              backgroundPresetId: backgroundPreset.id,
              theme: parsedPrefs.theme ?? nextReaderState.settings.themeMode ?? defaultPrefs.theme,
            });
          } catch {
            // ignore
          }
        } else {
          setPreferences({
            ...defaultPrefs,
            backgroundPresetId: nextReaderState.settings.backgroundPresetId,
            theme: nextReaderState.settings.themeMode,
          });
        }
        setIsLoaded(true);
      }).catch(() => {
        // Defaults keep the Reader usable; the empty-library copy still waits for an answer.
        if (isMounted) setIsLoaded(true);
      });

      return () => {
        isMounted = false;
        Speech.stop();
      };
    }, [])
  );

  // Stop speech when navigating away
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const selectedDocument = readerState.documents.find((document) => document.id === readerState.selectedDocumentId);
  const readerTokens = useMemo(() => tokenizeReaderText(selectedDocument?.content ?? ''), [selectedDocument?.content]);
  const readerTocItems = useMemo(() => buildReaderTocItems(selectedDocument?.content ?? ''), [selectedDocument?.content]);
  const isRtl = useMemo(() => /[\u0600-\u06FF\u0590-\u05FF]/.test(selectedDocument?.content ?? ''), [selectedDocument?.content]);

  // Compute sentences inside the document content
  const sentences = useMemo(() => splitReaderSentences(selectedDocument?.content ?? ''), [selectedDocument?.content]);

  const tokenToSentenceMap = useMemo(
    () => buildTokenSentenceMap(readerTokens, sentences.length),
    [readerTokens, sentences.length]
  );

  const readerParagraphs = useMemo(
    () => groupReaderParagraphs(readerTokens, tokenToSentenceMap),
    [readerTokens, tokenToSentenceMap]
  );
  const readerTextStyle = useMemo(() => getReaderTextStyle(readerState.settings), [readerState.settings]);

  const selectedHighlightText = useMemo(() => {
    if (!selectionRange) return '';
    return readerTokens.slice(selectionRange.start, selectionRange.end + 1).join('').trim();
  }, [selectionRange, readerTokens]);

  const selectedBackgroundPreset = useMemo(
    () => getReaderBackgroundPreset(preferences.backgroundPresetId, readerState.settings.backgroundColor),
    [preferences.backgroundPresetId, readerState.settings.backgroundColor]
  );
  const activeReaderThemeMode = useMemo(() => {
    if (preferences.theme !== 'system') return preferences.theme;

    if (selectedBackgroundPreset.themeMode !== 'system') return selectedBackgroundPreset.themeMode;

    return resolvedAppTheme;
  }, [preferences.theme, resolvedAppTheme, selectedBackgroundPreset.themeMode]);
  const readerPageBackground = selectedBackgroundPreset.color;
  const readerPageTextColor = selectedBackgroundPreset.textColor;

  const activeTheme = READER_THEME_COLORS[activeReaderThemeMode === 'dark' || activeReaderThemeMode === 'sepia' ? activeReaderThemeMode : 'light'];

  // Save local preferences
  const updatePreferences = async (newPrefs: Partial<ReaderPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    await setStoredItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
  };

  // Adjust application background color to match specific preset background if selected
  const handleSelectBackground = (presetId: ReaderBackgroundPresetId) => {
    const preset = getReaderBackgroundPreset(presetId);
    handleUpdateSettings({
      backgroundColor: preset.color,
      backgroundPresetId: preset.id,
      themeMode: preset.themeMode,
    });
    updatePreferences({ backgroundPresetId: preset.id, theme: preset.themeMode });
  };

  const handleSelectDocument = (documentId: string) => {
    speech.stop();
    selectReaderDocument(readerState, documentId).then(setReaderState);
  };

  const handleUpdateSettings = (settings: Partial<ReaderSettings>) => {
    updateReaderSettings(readerState, settings).then(setReaderState);
  };

  const handleTokenPress = (index: number) => {
    if (!selectionRange) {
      setSelectionRange({ start: index, end: index });
      setQuickNote('');
      setReaderSaveMessage('');
      return;
    }

    const isAdjacentAfter = index === selectionRange.end + 1 || index === selectionRange.end + 2;
    const isAdjacentBefore = index === selectionRange.start - 1 || index === selectionRange.start - 2;

    if (isAdjacentAfter) {
      setSelectionRange({ start: selectionRange.start, end: index });
    } else if (isAdjacentBefore) {
      setSelectionRange({ start: index, end: selectionRange.end });
    } else {
      setSelectionRange({ start: index, end: index });
      setQuickNote('');
      setReaderSaveMessage('');
    }
  };

  // Paragraphs are memoized, so they get a stable callback that always calls the latest handler.
  const handleTokenPressRef = useRef(handleTokenPress);
  handleTokenPressRef.current = handleTokenPress;
  const handleTokenPressStable = useCallback((index: number) => handleTokenPressRef.current(index), []);

  const handleOpenLookup = () => {
    if (!selectedHighlightText) return;
    router.push({ pathname: '/word', params: { sourceLang: readerSourceLang, targetLang: readerTargetLang, word: selectedHighlightText } });
  };

  const handleReaderLanguageSelect = (field: 'source' | 'target', languageCode: LanguageCode) => {
    if (field === 'source') {
      setReaderSourceLang(languageCode);
      handleUpdateSettings({ sourceLanguage: languageCode });
      return;
    }

    setReaderTargetLang(languageCode);
    handleUpdateSettings({ targetLanguage: languageCode });
  };

  const handleCloseSelection = () => {
    setSelectionRange(null);
    setQuickNote('');
    setReaderSaveMessage('');
  };

  const handleSaveHighlight = (withFlashcard: boolean) => {
    if (!selectedHighlightText) return;
    saveReaderSelection(libraryState, selectedHighlightText, quickNote, { withFlashcard })
      .then((nextState) => {
        setLibraryState(nextState);
        setReaderSaveMessage(withFlashcard ? `Đã tạo flashcard cho "${selectedHighlightText}".` : `Đã lưu cụm từ "${selectedHighlightText}".`);
        setQuickNote('');
      })
      .catch((err) => {
        Alert.alert(
          withFlashcard ? 'Lỗi tạo flashcard' : 'Lỗi lưu',
          err instanceof Error ? err.message : withFlashcard ? 'Không thể tạo flashcard.' : 'Không thể lưu cụm từ.'
        );
      });
  };
  const handleCreateFlashcardFromSelection = () => handleSaveHighlight(true);
  const handleSaveSelection = () => handleSaveHighlight(false);

  const handleJumpToProgress = (pct: number) => {
    setActiveSheet(null);
    setIsAutoScrolling(false);
    handleProgressChange(pct);
  };

  const handleSelectDocumentFromToc = (documentId: string) => {
    handleSelectDocument(documentId);
    setActiveSheet(null);
    scrollToY(0, true);
  };

  // ----------------------------------------------------
  // AI VOICE READER (TTS) LOGIC
  // ----------------------------------------------------
  const speech = useReaderSpeech({
    onSentenceStart: (index) => scrollToActiveSentence(index),
    sentences,
    speed: preferences.ttsSpeed,
    voice: preferences.ttsVoice,
  });
  const { activeSentenceIndex, handleNextSentence, handlePlayPause, handlePrevSentence, handleStop, isSpeaking } = speech;

  function scrollToActiveSentence(index: number) {
    const paragraphIndex = readerParagraphs.findIndex((paragraph) => paragraph.sentenceIndexes.has(index));
    if (paragraphIndex >= 0) listRef.current?.scrollToIndex({ animated: true, index: paragraphIndex, viewPosition: 0.3 });
  }


  const paragraphRenderState = { activeSentenceIndex, readerPageBackground, readerPageTextColor, readerTextStyle, selectionRange, theme: activeTheme };
  const renderParagraph = ({ item: paragraph }: { item: ReaderParagraphRange }) => {
    const touchesSelection = selectionRange !== null && selectionRange.start <= paragraph.end && selectionRange.end >= paragraph.start;
    return (
      <View style={[styles.readerPageBody, { backgroundColor: readerPageBackground }]}>
        <ReaderParagraph
          activeSentenceIndex={paragraph.sentenceIndexes.has(activeSentenceIndex ?? -1) ? activeSentenceIndex : null}
          end={paragraph.end}
          highlightBackground={activeTheme.highlightBg}
          highlightText={activeTheme.highlightText}
          isRtl={isRtl}
          onTokenPress={handleTokenPressStable}
          selectionEnd={touchesSelection ? selectionRange.end : null}
          selectionStart={touchesSelection ? selectionRange.start : null}
          start={paragraph.start}
          textColor={readerPageTextColor}
          textStyle={readerTextStyle}
          tokenToSentenceMap={tokenToSentenceMap}
          tokens={readerTokens}
        />
      </View>
    );
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']} style={{ backgroundColor: activeTheme.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        ref={listRef}
        contentContainerStyle={styles.content}
        data={selectedDocument ? readerParagraphs : []}
        extraData={paragraphRenderState}
        initialNumToRender={12}
        keyExtractor={(paragraph) => String(paragraph.start)}
        maxToRenderPerBatch={10}
        onContentSizeChange={(_, height) => setContentHeight(height)}
        onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
        onScroll={handleScroll}
        onScrollToIndexFailed={({ averageItemLength, index }) => scrollToY(averageItemLength * index, true)}
        removeClippedSubviews={Platform.OS !== 'web'}
        renderItem={renderParagraph}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        windowSize={9}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Touchable
                accessibilityLabel="Quay lại"
                accessibilityRole="button"
                activeOpacity={0.82}
                onPress={() => router.back()}
                style={[styles.iconButton, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}
              >
                <Ionicons name="chevron-back" size={22} color={activeTheme.text} />
              </Touchable>
            </View>

            <Text style={[styles.kicker, { color: activeTheme.secondaryText }]}>Trình đọc Novel</Text>
            <Text style={[styles.title, { color: activeTheme.text }]}>Đọc sách & tra từ AI</Text>

            {/* Selected Documents */}
            {readerState.documents.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.documentRow}>
                {readerState.documents.map((document) => {
                  const isSelected = document.id === readerState.selectedDocumentId;

                  return (
                    <Touchable
                      key={document.id}
                      activeOpacity={0.82}
                      onPress={() => handleSelectDocument(document.id)}
                      style={[
                        styles.documentChip,
                        { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border },
                        isSelected && { backgroundColor: activeTheme.accent, borderColor: activeTheme.accent },
                      ]}
                    >
                      <Text style={[styles.documentChipText, { color: activeTheme.text }, isSelected && styles.activeDocumentChipText]}>
                        {document.title}
                      </Text>
                      <Text style={[styles.documentFormatText, { color: activeTheme.secondaryText }, isSelected && styles.activeDocumentFormatText]}>
                        {(document.sourceFormat ?? 'txt').toUpperCase()}
                      </Text>
                    </Touchable>
                  );
                })}
              </ScrollView>
            ) : null}
            {selectedDocument ? (
              <View style={[styles.readerPage, styles.readerPageTop, { backgroundColor: readerPageBackground }]}>
                <Text style={[styles.readerTitle, { color: activeTheme.text }, isRtl && { textAlign: 'right', writingDirection: 'rtl' }]}>
                  {selectedDocument.title}
                </Text>
                {selectionRange && selectedHighlightText ? (
                  <ReaderHighlightPanel
                    activeTheme={activeTheme}
                    quickNote={quickNote}
                    readerSaveMessage={readerSaveMessage}
                    selectedHighlightText={selectedHighlightText}
                    sourceLanguageCode={readerSourceLang}
                    targetLanguageCode={readerTargetLang}
                    onClose={handleCloseSelection}
                    onCreateFlashcard={handleCreateFlashcardFromSelection}
                    onLookup={handleOpenLookup}
                    onSave={handleSaveSelection}
                    onSelectLanguage={handleReaderLanguageSelect}
                    onUpdateNote={setQuickNote}
                  />
                ) : null}
              </View>
            ) : null}
          </>
        }
        ListFooterComponent={
          selectedDocument ? (
            <View style={[styles.readerPageBottom, { backgroundColor: readerPageBackground }]} />
          ) : !isLoaded ? (
            <View accessibilityLabel="Đang tải tài liệu" style={styles.readerPage}>
              <SkeletonBlock height={18} width="60%" />
              <SkeletonBlock height={14} style={{ marginTop: 12 }} />
              <SkeletonBlock height={14} style={{ marginTop: 8 }} />
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
              <Ionicons name="reader-outline" size={28} color={activeTheme.secondaryText} />
              <Text style={[styles.emptyTitle, { color: activeTheme.text }]}>Chưa có văn bản</Text>
              <Text style={[styles.emptyText, { color: activeTheme.secondaryText }]}>
                Vào Luyện tập → Đọc sách kèm tra từ để nhập tài liệu. Sau khi mở file, bấm vào từ hoặc cụm từ để tra nghĩa, lưu từ và tạo flashcard.
              </Text>
            </View>
          )
        }
      />

      {/* Novel Reading Progress Scrubber fixed to bottom */}
      {selectedDocument && (
        <View style={[styles.scrubberPanel, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
          <View style={styles.scrubberInfo}>
            <Text style={[styles.scrubberPercentage, { color: activeTheme.text }]}>{Math.round(progress)}%</Text>
            <Text style={[styles.scrubberSentences, { color: activeTheme.secondaryText }]}>Tiến trình đọc</Text>
          </View>
          
          <View
            accessible
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            accessibilityLabel="Tiến trình đọc"
            accessibilityRole="adjustable"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={`${Math.round(progress)}%`}
            // Screen readers adjust in 10% steps instead of dragging.
            onAccessibilityAction={(event) => {
              const step = event.nativeEvent.actionName === 'increment' ? 10 : -10;
              handleProgressChange(Math.min(100, Math.max(0, progress + step)));
            }}
            style={styles.scrubberTouchArea}
            onTouchStart={handleScrubberTouch}
            onTouchMove={handleScrubberTouch}
            onLayout={(e) => setScrubberWidth(e.nativeEvent.layout.width)}
          >
            <View style={[styles.scrubberTrack, { backgroundColor: activeTheme.border }]}>
              <View style={[styles.scrubberProgressLine, { width: `${progress}%`, backgroundColor: activeTheme.accent }]} />
            </View>
            <View style={[styles.scrubberThumbCircle, { left: `${Math.min(97, Math.max(0, progress))}%`, backgroundColor: activeTheme.accent, borderColor: activeTheme.cardBg }]} />
          </View>
          {showAudioProgress ? (
            <ReaderAudioPanel sentenceCount={sentences.length} speech={speech} theme={activeTheme} />
          ) : null}
          <View style={styles.readerDockControls}>
            <ReaderDockButton icon="chevron-back" label="Trang trước" onPress={handlePrevPage} theme={activeTheme} />
            <ReaderDockButton icon="settings-outline" label="Cài đặt" onPress={() => setActiveSheet('settings')} theme={activeTheme} />
            <ReaderDockButton icon={isAutoScrolling ? 'pause' : 'play'} isPrimary label="Tự động cuộn" onPress={handleAutoScrollToggle} theme={activeTheme} />
            <ReaderDockButton icon="headset-outline" isActive={showAudioProgress} label="Audio" onPress={() => setShowAudioProgress((value) => !value)} theme={activeTheme} />
            <ReaderDockButton icon="list-outline" label="Mục lục" onPress={() => setActiveSheet('toc')} theme={activeTheme} />
            <ReaderDockButton icon="chevron-forward" label="Trang sau" onPress={handleNextPage} theme={activeTheme} />
          </View>
        </View>
      )}
      <Modal
        animationType="slide"
        transparent
        visible={activeSheet !== null}
        onRequestClose={() => setActiveSheet(null)}>
        <View style={styles.sheetBackdrop}>
          <Touchable activeOpacity={1} onPress={() => setActiveSheet(null)} style={styles.sheetBackdropTouch} />
          <View style={[styles.readerSheet, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
            <View style={styles.sheetHeader}>
              <Touchable
                accessibilityLabel="Đóng"
                activeOpacity={0.82}
                onPress={() => setActiveSheet(null)}
                style={[styles.sheetCloseButton, { backgroundColor: activeTheme.bg }]}>
                <Ionicons name="close" size={20} color={activeTheme.accent} />
              </Touchable>
              <Text style={[styles.sheetTitle, { color: activeTheme.text }]}>
                {activeSheet === 'toc' ? 'Mục lục' : 'Thiết lập giao diện'}
              </Text>
              <View style={styles.sheetHeaderSpacer} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              {activeSheet === 'settings' ? (
                <ReaderSettingsSheet
                  activeTheme={activeTheme}
                  fontOptions={fontOptions}
                  backgroundOptions={readerBackgroundPresets}
                  handleSelectBackground={handleSelectBackground}
                  handleUpdateSettings={handleUpdateSettings}
                  handleNextSentence={handleNextSentence}
                  handlePlayPause={handlePlayPause}
                  handlePrevSentence={handlePrevSentence}
                  handleStop={handleStop}
                  isSpeaking={isSpeaking}
                  preferences={preferences}
                  readerState={readerState}
                  speedOptions={speedOptions}
                  themeOptions={themeOptions}
                  updatePreferences={updatePreferences}
                  voiceProfiles={voiceProfiles}
                />
              ) : null}
              {activeSheet === 'toc' ? (
                <ReaderTocSheet
                  activeTheme={activeTheme}
                  documents={readerState.documents}
                  tocItems={readerTocItems}
                  handleJumpToProgress={handleJumpToProgress}
                  handleSelectDocument={handleSelectDocumentFromToc}
                  selectedDocumentId={readerState.selectedDocumentId}
                />
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
