import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, GestureResponderEvent, Modal, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Screen from '@/components/app/Screen';
import { DictionaryEntry } from '@/data/dictionary';
import { LibraryState, createFlashcardsFromWordIds, getDefaultLibraryState, getFavoriteFolderId, loadLibraryState, saveWordToFolder } from '@/data/libraryStore';
import { ReaderSettings, ReaderState, getDefaultReaderState, loadReaderState, selectReaderDocument, updateReaderSettings } from '@/data/readerStore';
import { loadUserProfile } from '@/data/profileStore';
import { getStoredItem, setStoredItem } from '@/data/storageAdapter';
import { loadAppColorSchemePreference, resolveAppColorScheme } from '@/data/appThemePreference';
import { type LanguageCode } from '@/data/languages';
import { buildTokenSentenceMap, groupReaderParagraphs, splitReaderSentences, tokenizeReaderText } from '@/data/readerText';
import { getReaderBackgroundPreset, readerBackgroundPresets, type ReaderBackgroundPresetId } from '@/data/readerTheme';

import { buildReaderTocItems, defaultPrefs, fontOptions, getReaderTextStyle, speedOptions, themeOptions, voiceProfiles, type ReaderPreferences, type ReaderSheet, type VoiceProfile } from '@/components/reader/readerOptions';
import { ReaderParagraph } from '@/components/reader/ReaderParagraph';
import { ReaderDockButton } from '@/components/reader/ReaderDockButton';
import { ReaderHighlightPanel } from '@/components/reader/ReaderHighlightPanel';
import { ReaderSettingsSheet, ReaderTocSheet } from '@/components/reader/ReaderSheets';
import { styles } from '@/components/reader/styles';

const PREFS_STORAGE_KEY = 'dictionary-mobile.reader-prefs.v1';

export default function ReaderScreen() {
  const [readerState, setReaderState] = useState<ReaderState>(getDefaultReaderState());
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
  const scrollViewRef = useRef<ScrollView>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [scrubberWidth, setScrubberWidth] = useState(0);
  const [audioScrubberWidth, setAudioScrubberWidth] = useState(0);

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [activeSheet, setActiveSheet] = useState<ReaderSheet>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [showAudioProgress, setShowAudioProgress] = useState(false);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    if (!isAutoScrolling) {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
      return;
    }

    autoScrollTimerRef.current = setInterval(() => {
      if (!scrollViewRef.current || contentHeight <= scrollViewHeight) return;

      setScrollOffset((currentOffset) => {
        const maxOffset = Math.max(0, contentHeight - scrollViewHeight);
        const nextOffset = Math.min(maxOffset, currentOffset + Math.max(2, preferences.ttsSpeed * 3));
        scrollViewRef.current?.scrollTo({ y: nextOffset, animated: false });
        if (nextOffset >= maxOffset) setIsAutoScrolling(false);
        return nextOffset;
      });
    }, 80);

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    };
  }, [contentHeight, isAutoScrolling, preferences.ttsSpeed, scrollViewHeight]);

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

  const activeTheme = useMemo(() => {
    const themeMode = activeReaderThemeMode;
    if (themeMode === 'dark') {
      return {
        bg: '#0F0E17',
        text: '#E2E8F7',
        secondaryText: '#94A3B8',
        cardBg: '#1C1A27',
        border: '#2A273F',
        accent: '#A998F4',
        accentLight: '#2C254A',
        accentText: '#C5BAFF',
        highlightBg: '#3B2F5C',
        highlightText: '#FFD0FF',
        shadow: 'rgba(0, 0, 0, 0.3)',
      };
    } else if (themeMode === 'sepia') {
      return {
        bg: '#FDF6E3',
        text: '#5C4033',
        secondaryText: '#8D6E63',
        cardBg: '#F5EBD0',
        border: '#E5D8B6',
        accent: '#8B5A2B',
        accentLight: '#F3E5AB',
        accentText: '#5C4033',
        highlightBg: '#F5DEB3',
        highlightText: '#8B4513',
        shadow: 'rgba(92, 64, 51, 0.08)',
      };
    } else {
      return {
        bg: '#F8FAFC',
        text: '#0F172A',
        secondaryText: '#64748B',
        cardBg: '#FFFFFF',
        border: '#E2E8F0',
        accent: '#7C3AED',
        accentLight: '#F5F3FF',
        accentText: '#7C3AED',
        highlightBg: '#FEF3C7',
        highlightText: '#92400E',
        shadow: 'rgba(15, 23, 42, 0.05)',
      };
    }
  }, [activeReaderThemeMode]);

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
    Speech.stop();
    setIsSpeaking(false);
    setActiveSentenceIndex(null);
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

  const handleCreateFlashcardFromSelection = () => {
    if (!selectedHighlightText) return;

    const folderId = getReaderSaveFolderId(libraryState);

    saveWordToFolder(libraryState, createReaderDictionaryEntry(selectedHighlightText), folderId, quickNote)
      .then((nextState) => {
        const savedWordId = `word-${selectedHighlightText.toLowerCase()}`;
        return createFlashcardsFromWordIds(nextState, [savedWordId], ['bilingual']);
      })
      .then((finalState) => {
        setLibraryState(finalState);
        setReaderSaveMessage(`Đã tạo flashcard cho "${selectedHighlightText}".`);
        setQuickNote('');
      })
      .catch((err) => {
        Alert.alert('Lỗi tạo flashcard', err instanceof Error ? err.message : 'Không thể tạo flashcard.');
      });
  };

  const handleSaveSelection = () => {
    if (!selectedHighlightText) return;

    const folderId = getReaderSaveFolderId(libraryState);

    saveWordToFolder(libraryState, createReaderDictionaryEntry(selectedHighlightText), folderId, quickNote)
      .then((nextState) => {
        setLibraryState(nextState);
        setReaderSaveMessage(`Đã lưu cụm từ "${selectedHighlightText}".`);
        setQuickNote('');
      })
      .catch((err) => {
        Alert.alert('Lỗi lưu', err instanceof Error ? err.message : 'Không thể lưu cụm từ.');
      });
  };

  // ----------------------------------------------------
  // READING PROGRESS SCRUBBER LOGIC
  // ----------------------------------------------------
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollOffset(event.nativeEvent.contentOffset.y);
  };

  const progress = useMemo(() => {
    if (contentHeight <= scrollViewHeight) return 0;
    return Math.min(100, Math.max(0, (scrollOffset / (contentHeight - scrollViewHeight)) * 100));
  }, [scrollOffset, contentHeight, scrollViewHeight]);

  const handleProgressChange = (pct: number) => {
    if (scrollViewRef.current && contentHeight > scrollViewHeight) {
      const targetY = (pct / 100) * (contentHeight - scrollViewHeight);
      scrollViewRef.current.scrollTo({ y: targetY, animated: false });
    }
  };

  const handleScrubberTouch = (event: GestureResponderEvent) => {
    const touchX = event.nativeEvent.locationX;
    const pct = Math.min(100, Math.max(0, (touchX / scrubberWidth) * 100));
    handleProgressChange(pct);
  };

  const handleNextPage = () => {
    if (!scrollViewRef.current) return;
    setIsAutoScrolling(false);
    const nextOffset = Math.min(Math.max(0, contentHeight - scrollViewHeight), scrollOffset + scrollViewHeight * 0.82);
    scrollViewRef.current.scrollTo({ y: nextOffset, animated: true });
  };

  const handlePrevPage = () => {
    if (!scrollViewRef.current) return;
    setIsAutoScrolling(false);
    const prevOffset = Math.max(0, scrollOffset - scrollViewHeight * 0.82);
    scrollViewRef.current.scrollTo({ y: prevOffset, animated: true });
  };

  const handleJumpToProgress = (pct: number) => {
    setActiveSheet(null);
    setIsAutoScrolling(false);
    handleProgressChange(pct);
  };

  const handleSelectDocumentFromToc = (documentId: string) => {
    handleSelectDocument(documentId);
    setActiveSheet(null);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // ----------------------------------------------------
  // AI VOICE READER (TTS) LOGIC
  // ----------------------------------------------------
  const scrollToActiveSentence = (index: number) => {
    if (scrollViewRef.current && sentences.length > 0 && contentHeight > 0) {
      const fraction = index / sentences.length;
      const targetY = fraction * contentHeight - 140; // Offset to center the highlighted text
      scrollViewRef.current.scrollTo({ y: Math.max(0, targetY), animated: true });
    }
  };

  const startSpeaking = (index: number, speed: number, voiceType: VoiceProfile) => {
    if (index < 0 || index >= sentences.length) {
      setIsSpeaking(false);
      return;
    }

    Speech.stop();
    setActiveSentenceIndex(index);
    scrollToActiveSentence(index);

    const textToRead = sentences[index];

    // Compute voice variables
    let pitch = 1.0;
    let rate = speed;

    if (voiceType === 'female') {
      pitch = 1.15;
    } else if (voiceType === 'male') {
      pitch = 0.85;
    } else if (voiceType === 'child') {
      pitch = 1.45;
    } else if (voiceType === 'old') {
      pitch = 0.7;
      rate = speed * 0.8; // Old voices read slightly slower
    }

    const isVi = /[À-ÿ]/.test(textToRead);
    const language = isVi ? 'vi-VN' : 'en-US';

    setIsSpeaking(true);
    Speech.speak(textToRead, {
      language,
      pitch,
      rate,
      onDone: () => {
        if (index + 1 < sentences.length) {
          startSpeaking(index + 1, speed, voiceType);
        } else {
          setIsSpeaking(false);
          setActiveSentenceIndex(null);
        }
      },
      onStopped: () => {
        setIsSpeaking(false);
      },
      onError: () => {
        setIsSpeaking(false);
      },
    });
  };

  const handlePlayPause = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      const startIndex = activeSentenceIndex ?? 0;
      startSpeaking(startIndex, preferences.ttsSpeed, preferences.ttsVoice);
    }
  };

  const handleAutoScrollToggle = () => {
    if (contentHeight <= scrollViewHeight) return;
    setIsAutoScrolling((value) => !value);
  };

  const handleStop = () => {
    Speech.stop();
    setIsSpeaking(false);
    setActiveSentenceIndex(null);
  };

  const handleNextSentence = () => {
    const nextIdx = (activeSentenceIndex ?? -1) + 1;
    if (nextIdx < sentences.length) {
      startSpeaking(nextIdx, preferences.ttsSpeed, preferences.ttsVoice);
    }
  };

  const handlePrevSentence = () => {
    const prevIdx = (activeSentenceIndex ?? 0) - 1;
    if (prevIdx >= 0) {
      startSpeaking(prevIdx, preferences.ttsSpeed, preferences.ttsVoice);
    }
  };

  const audioProgress = useMemo(() => {
    if (!sentences.length) return 0;
    return Math.min(100, Math.max(0, (((activeSentenceIndex ?? 0) + 1) / sentences.length) * 100));
  }, [activeSentenceIndex, sentences.length]);

  const handleAudioScrubberTouch = (event: GestureResponderEvent) => {
    if (!sentences.length || audioScrubberWidth <= 0) return;
    const pct = Math.min(100, Math.max(0, (event.nativeEvent.locationX / audioScrubberWidth) * 100));
    const index = Math.min(sentences.length - 1, Math.max(0, Math.floor((pct / 100) * sentences.length)));
    startSpeaking(index, preferences.ttsSpeed, preferences.ttsVoice);
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']} style={{ backgroundColor: activeTheme.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={(_, height) => setContentHeight(height)}
        onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="Quay lại"
            accessibilityRole="button"
            activeOpacity={0.82}
            onPress={() => router.back()}
            style={[styles.iconButton, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}
          >
            <Ionicons name="chevron-back" size={22} color={activeTheme.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.kicker, { color: activeTheme.secondaryText }]}>Trình đọc Novel</Text>
        <Text style={[styles.title, { color: activeTheme.text }]}>Đọc sách & tra từ AI</Text>

        {/* Selected Documents */}
        {readerState.documents.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.documentRow}>
            {readerState.documents.map((document) => {
              const isSelected = document.id === readerState.selectedDocumentId;

              return (
                <TouchableOpacity
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
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Reader Book Content display */}
        {selectedDocument ? (
          <View style={[styles.readerPage, { backgroundColor: readerPageBackground }]}>
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
            <View style={styles.readerTextWrap}>
              {readerParagraphs.map((paragraph) => (
                <ReaderParagraph
                  key={paragraph.start}
                  activeSentenceIndex={paragraph.sentenceIndexes.has(activeSentenceIndex ?? -1) ? activeSentenceIndex : null}
                  end={paragraph.end}
                  highlightBackground={activeTheme.highlightBg}
                  highlightText={activeTheme.highlightText}
                  isRtl={isRtl}
                  onTokenPress={handleTokenPressStable}
                  selectionEnd={selectionRange && selectionRange.start <= paragraph.end && selectionRange.end >= paragraph.start ? selectionRange.end : null}
                  selectionStart={selectionRange && selectionRange.start <= paragraph.end && selectionRange.end >= paragraph.start ? selectionRange.start : null}
                  start={paragraph.start}
                  textColor={readerPageTextColor}
                  textStyle={readerTextStyle}
                  tokenToSentenceMap={tokenToSentenceMap}
                  tokens={readerTokens}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
            <Ionicons name="reader-outline" size={28} color={activeTheme.secondaryText} />
            <Text style={[styles.emptyTitle, { color: activeTheme.text }]}>Chưa có văn bản</Text>
            <Text style={[styles.emptyText, { color: activeTheme.secondaryText }]}>
              Vào Luyện tập → Đọc sách kèm tra từ để nhập tài liệu. Sau khi mở file, bấm vào từ hoặc cụm từ để tra nghĩa, lưu từ và tạo flashcard.
            </Text>
          </View>
        )}
      </ScrollView>

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
            <View style={[styles.audioProgressPanel, { backgroundColor: activeTheme.bg, borderColor: activeTheme.border }]}>
              <TouchableOpacity accessibilityLabel="Câu trước" accessibilityRole="button" activeOpacity={0.82} onPress={handlePrevSentence} style={styles.audioSeekButton}>
                <Ionicons name="play-skip-back" size={18} color={activeTheme.accent} />
              </TouchableOpacity>
              <View
                accessible
                accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                accessibilityLabel="Vị trí đọc to"
                accessibilityRole="adjustable"
                aria-valuemax={sentences.length}
                aria-valuemin={1}
                aria-valuenow={(activeSentenceIndex ?? 0) + 1}
                aria-valuetext={`Câu ${(activeSentenceIndex ?? 0) + 1}/${sentences.length}`}
                onAccessibilityAction={(event) => {
                  if (event.nativeEvent.actionName === 'increment') handleNextSentence();
                  else handlePrevSentence();
                }}
                style={styles.audioScrubberTouchArea}
                onLayout={(e) => setAudioScrubberWidth(e.nativeEvent.layout.width)}
                onTouchMove={handleAudioScrubberTouch}
                onTouchStart={handleAudioScrubberTouch}>
                <View style={[styles.audioScrubberTrack, { backgroundColor: activeTheme.border }]}>
                  <View style={[styles.audioScrubberProgress, { backgroundColor: activeTheme.accent, width: `${audioProgress}%` }]} />
                </View>
              </View>
              <Text style={[styles.audioProgressText, { color: activeTheme.secondaryText }]}>
                {sentences.length ? `${Math.min(sentences.length, (activeSentenceIndex ?? 0) + 1)}/${sentences.length}` : '0/0'}
              </Text>
              <TouchableOpacity activeOpacity={0.82} onPress={handlePlayPause} style={styles.audioSeekButton}>
                <Ionicons name={isSpeaking ? 'pause' : 'play'} size={18} color={activeTheme.accent} />
              </TouchableOpacity>
              <TouchableOpacity accessibilityLabel="Câu sau" accessibilityRole="button" activeOpacity={0.82} onPress={handleNextSentence} style={styles.audioSeekButton}>
                <Ionicons name="play-skip-forward" size={18} color={activeTheme.accent} />
              </TouchableOpacity>
            </View>
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
          <TouchableOpacity activeOpacity={1} onPress={() => setActiveSheet(null)} style={styles.sheetBackdropTouch} />
          <View style={[styles.readerSheet, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => setActiveSheet(null)}
                style={[styles.sheetCloseButton, { backgroundColor: activeTheme.bg }]}>
                <Ionicons name="close" size={20} color={activeTheme.accent} />
              </TouchableOpacity>
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

function getReaderSaveFolderId(libraryState: LibraryState) {
  const dailyReviewFolder = libraryState.folders.find((folder) => folder.name.toLowerCase() === 'daily review');
  return dailyReviewFolder?.id ?? getFavoriteFolderId();
}

function createReaderDictionaryEntry(word: string): DictionaryEntry {
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
