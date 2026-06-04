import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { ComponentProps, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  GestureResponderEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Screen from '@/components/app/Screen';
import { DictionaryEntry } from '@/data/dictionary';
import {
  LibraryState,
  createFlashcardsFromWordIds,
  getDefaultLibraryState,
  getFavoriteFolderId,
  loadLibraryState,
  saveWordToFolder,
} from '@/data/libraryStore';
import {
  ReaderSettings,
  ReaderState,
  getDefaultReaderState,
  loadReaderState,
  selectReaderDocument,
  updateReaderSettings,
} from '@/data/readerStore';
import { loadUserProfile } from '@/data/profileStore';
import { getStoredItem, setStoredItem } from '@/data/storageAdapter';
import { TranslationPanel } from '@/components/TranslationPanel';
import { loadAppColorSchemePreference, resolveAppColorScheme } from '@/data/appThemePreference';
import { getLanguageByCode, languageOptions, type LanguageCode } from '@/data/languages';
import { getReaderBackgroundPreset, readerBackgroundPresets, type ReaderBackgroundPresetId, type ReaderThemeMode } from '@/data/readerTheme';

// Extra Local Preferences Storage Keys
const PREFS_STORAGE_KEY = 'dictionary-mobile.reader-prefs.v1';

type VoiceProfile = 'female' | 'male' | 'child' | 'old';
type ReaderSheet = 'settings' | 'toc' | null;

type ReaderPreferences = {
  theme: ReaderThemeMode;
  backgroundPresetId: ReaderBackgroundPresetId;
  ttsVoice: VoiceProfile;
  ttsSpeed: number;
};

const defaultPrefs: ReaderPreferences = {
  backgroundPresetId: 'auto',
  theme: 'system',
  ttsVoice: 'female',
  ttsSpeed: 1.0,
};

const fontOptions: { label: string; value: ReaderSettings['fontFamily'] }[] = [
  { label: 'System', value: 'system' },
  { label: 'Serif (Classic)', value: 'serif' },
  { label: 'Mono (Clean)', value: 'mono' },
];

const themeOptions: { label: string; value: ReaderThemeMode; name: string }[] = [
  { label: 'Theo hệ thống', value: 'system', name: 'phone-portrait-outline' },
  { label: 'Sáng', value: 'light', name: 'sunny-outline' },
  { label: 'Ấm', value: 'sepia', name: 'cafe-outline' },
  { label: 'Tối', value: 'dark', name: 'moon-outline' },
];

const voiceProfiles: { label: string; value: VoiceProfile; desc: string }[] = [
  { label: 'Nữ 👩', value: 'female', desc: 'Cao, truyền cảm' },
  { label: 'Nam 👨', value: 'male', desc: 'Trầm, ấm áp' },
  { label: 'Trẻ em 👧', value: 'child', desc: 'Trong sáng, nhanh' },
  { label: 'Người già 👴', value: 'old', desc: 'Chậm rãi, từ tốn' },
];

const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

type ReaderThemeColors = {
  bg: string;
  text: string;
  secondaryText: string;
  cardBg: string;
  border: string;
  accent: string;
  accentLight: string;
  accentText: string;
  highlightBg: string;
  highlightText: string;
  shadow: string;
};

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
  const isRtl = useMemo(() => /[\u0600-\u06FF\u0590-\u05FF]/.test(selectedDocument?.content ?? ''), [selectedDocument?.content]);

  // Compute sentences inside the document content
  const sentences = useMemo(() => {
    if (!selectedDocument?.content) return [];
    // Split by sentence ending punctuation followed by spacing
    return selectedDocument.content
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 0);
  }, [selectedDocument?.content]);

  // Map each token's index to its corresponding sentence index
  const tokenToSentenceMap = useMemo(() => {
    if (!selectedDocument?.content) return [];
    const mapping: number[] = [];

    sentences.forEach((sentence, sIdx) => {
      const sentenceTokens = tokenizeReaderText(sentence);
      for (let i = 0; i < sentenceTokens.length; i++) {
        mapping.push(sIdx);
      }
    });
    return mapping;
  }, [sentences, selectedDocument?.content]);

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
    <Screen style={{ backgroundColor: activeTheme.bg }}>
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
            <View style={[styles.readerTextWrap, isRtl && { flexDirection: 'row-reverse' }]}>
              {readerTokens.map((token, index) => {
                const isWord = /[A-Za-zÀ-ÿ\u0600-\u06FF\u0590-\u05FF\u1000-\u109F\u0F00-\u0FFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/.test(token);
                const inSelection = selectionRange ? index >= selectionRange.start && index <= selectionRange.end : false;
                const shouldShowInlinePanel = selectionRange && selectedHighlightText && index === selectionRange.end;

                // Highlight active sentence currently being read by AI
                const tokenSentenceIdx = tokenToSentenceMap[index];
                const isActiveSentence = activeSentenceIndex !== null && tokenSentenceIdx === activeSentenceIndex;

                return (
                  <Fragment key={`${token}-${index}`}>
                    {isWord ? (
                      <TouchableOpacity
                        activeOpacity={0.72}
                        onPress={() => handleTokenPress(index)}
                        style={[
                          inSelection && styles.selectedRangeWord,
                          isActiveSentence && { backgroundColor: activeTheme.highlightBg, borderRadius: 2 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.readerWord,
                            { color: readerPageTextColor },
                            getReaderTextStyle(readerState.settings),
                            inSelection && { color: activeTheme.highlightText },
                            isActiveSentence && { color: activeTheme.highlightText },
                          ]}
                        >
                          {token}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text
                        style={[
                          styles.readerWord,
                          { color: readerPageTextColor },
                          getReaderTextStyle(readerState.settings),
                          isActiveSentence && { backgroundColor: activeTheme.highlightBg, color: activeTheme.highlightText, borderRadius: 2 },
                        ]}
                      >
                        {token}
                      </Text>
                    )}
                    {shouldShowInlinePanel ? (
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
                  </Fragment>
                );
              })}
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
              <TouchableOpacity activeOpacity={0.82} onPress={handlePrevSentence} style={styles.audioSeekButton}>
                <Ionicons name="play-skip-back" size={18} color={activeTheme.accent} />
              </TouchableOpacity>
              <View
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
              <TouchableOpacity activeOpacity={0.82} onPress={handleNextSentence} style={styles.audioSeekButton}>
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

function ReaderDockButton({
  icon,
  isActive = false,
  isPrimary = false,
  label,
  onPress,
  theme,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  isActive?: boolean;
  isPrimary?: boolean;
  label: string;
  onPress: () => void;
  theme: ReaderThemeColors;
}) {
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        styles.readerDockButton,
        { backgroundColor: isPrimary ? theme.accent : theme.bg, borderColor: theme.border },
        isActive && { backgroundColor: theme.accentLight, borderColor: theme.accent },
        isPrimary && styles.readerDockPrimaryButton,
      ]}>
      <Ionicons name={icon} size={isPrimary ? 23 : 21} color={isPrimary ? '#FFFFFF' : theme.accent} />
    </TouchableOpacity>
  );
}

function ReaderHighlightPanel({
  activeTheme,
  quickNote,
  readerSaveMessage,
  selectedHighlightText,
  sourceLanguageCode,
  targetLanguageCode,
  onClose,
  onCreateFlashcard,
  onLookup,
  onSave,
  onSelectLanguage,
  onUpdateNote,
}: {
  activeTheme: ReaderThemeColors;
  quickNote: string;
  readerSaveMessage: string;
  selectedHighlightText: string;
  sourceLanguageCode: LanguageCode;
  targetLanguageCode: LanguageCode;
  onClose: () => void;
  onCreateFlashcard: () => void;
  onLookup: () => void;
  onSave: () => void;
  onSelectLanguage: (field: 'source' | 'target', languageCode: LanguageCode) => void;
  onUpdateNote: (note: string) => void;
}) {
  const sourceLanguage = getLanguageByCode(sourceLanguageCode, 'en');
  const targetLanguage = getLanguageByCode(targetLanguageCode, 'vi');
  const selectableLanguages = languageOptions.filter((language) => language.dictionaryStatus !== 'unavailable').slice(0, 12);

  return (
    <View style={[styles.readerActionPanel, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
      <View style={styles.readerActionHeader}>
        <View>
          <Text style={[styles.readerActionKicker, { color: activeTheme.secondaryText }]}>Highlight</Text>
          <Text style={[styles.readerActionWord, { color: activeTheme.text }]}>{selectedHighlightText}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.75} onPress={onClose} style={[styles.readerActionClose, { backgroundColor: activeTheme.bg }]}>
          <Ionicons name="close" size={18} color={activeTheme.secondaryText} />
        </TouchableOpacity>
      </View>

      <View style={styles.readerLanguageRow}>
        <ReaderInlineLanguageMenu
          activeTheme={activeTheme}
          label="Ngôn ngữ gốc"
          languages={selectableLanguages}
          selectedLanguageCode={sourceLanguage.code}
          onSelect={(languageCode) => onSelectLanguage('source', languageCode)}
        />
        <ReaderInlineLanguageMenu
          activeTheme={activeTheme}
          label="Dịch sang"
          languages={selectableLanguages}
          selectedLanguageCode={targetLanguage.code}
          onSelect={(languageCode) => onSelectLanguage('target', languageCode)}
        />
      </View>

      <TranslationPanel sourceText={selectedHighlightText} sourceLang={sourceLanguage.code.toUpperCase()} targetLang={targetLanguage.code.toUpperCase()} />

      <TextInput
        multiline
        onChangeText={onUpdateNote}
        placeholder="Ghi chú cho cụm từ..."
        placeholderTextColor={activeTheme.secondaryText}
        style={[styles.quickNoteInput, { backgroundColor: activeTheme.bg, borderColor: activeTheme.border, color: activeTheme.text }]}
        value={quickNote}
      />
      {readerSaveMessage ? <Text style={styles.readerSaveMessage}>{readerSaveMessage}</Text> : null}
      <View style={styles.readerActionButtons}>
        <TouchableOpacity activeOpacity={0.82} onPress={onLookup} style={[styles.lookupActionButton, { backgroundColor: activeTheme.bg }]}>
          <Ionicons name="search" size={17} color={activeTheme.accent} />
          <Text style={[styles.lookupActionText, { color: activeTheme.accent }]}>Tra nghĩa</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.82} onPress={onSave} style={[styles.saveActionButton, { backgroundColor: activeTheme.accent }]}>
          <Ionicons name="bookmark-outline" size={17} color="#FFFFFF" />
          <Text style={styles.saveActionText}>Lưu</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.82} onPress={onCreateFlashcard} style={[styles.saveActionButton, { backgroundColor: activeTheme.accent }]}>
          <Ionicons name="albums-outline" size={17} color="#FFFFFF" />
          <Text style={styles.saveActionText}>Tạo thẻ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ReaderInlineLanguageMenu({
  activeTheme,
  label,
  languages,
  selectedLanguageCode,
  onSelect,
}: {
  activeTheme: ReaderThemeColors;
  label: string;
  languages: typeof languageOptions;
  selectedLanguageCode: LanguageCode;
  onSelect: (languageCode: LanguageCode) => void;
}) {
  const selectedLanguage = getLanguageByCode(selectedLanguageCode, 'en');

  return (
    <View style={styles.readerInlineLanguageBox}>
      <Text style={[styles.readerInlineLanguageLabel, { color: activeTheme.secondaryText }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.readerInlineLanguageList}>
        {languages.map((language) => {
          const isSelected = language.code === selectedLanguage.code;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={`${label}-${language.code}`}
              onPress={() => onSelect(language.code)}
              style={[
                styles.readerInlineLanguageChip,
                { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
              ]}>
              <Text style={[styles.readerInlineLanguageText, { color: isSelected ? activeTheme.accent : activeTheme.text }]}>
                {language.code.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ReaderSettingsSheet({
  activeTheme,
  backgroundOptions,
  fontOptions,
  handleSelectBackground,
  handleUpdateSettings,
  handleNextSentence,
  handlePlayPause,
  handlePrevSentence,
  handleStop,
  isSpeaking,
  preferences,
  readerState,
  speedOptions,
  themeOptions,
  updatePreferences,
  voiceProfiles,
}: {
  activeTheme: ReaderThemeColors;
  backgroundOptions: typeof readerBackgroundPresets;
  fontOptions: { label: string; value: ReaderSettings['fontFamily'] }[];
  handleSelectBackground: (presetId: ReaderBackgroundPresetId) => void;
  handleUpdateSettings: (settings: Partial<ReaderSettings>) => void;
  handleNextSentence: () => void;
  handlePlayPause: () => void;
  handlePrevSentence: () => void;
  handleStop: () => void;
  isSpeaking: boolean;
  preferences: ReaderPreferences;
  readerState: ReaderState;
  speedOptions: number[];
  themeOptions: { label: string; value: ReaderThemeMode; name: string }[];
  updatePreferences: (newPrefs: Partial<ReaderPreferences>) => Promise<void>;
  voiceProfiles: { label: string; value: VoiceProfile; desc: string }[];
}) {
  return (
    <>
      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Cỡ chữ</Text>
      <View style={styles.sheetRow}>
        <Text style={[styles.sheetRowText, { color: activeTheme.text }]}>Kích thước</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => handleUpdateSettings({ fontSize: Math.max(14, readerState.settings.fontSize - 1) })}
            style={[styles.stepButton, { backgroundColor: activeTheme.bg }]}>
            <Ionicons name="remove" size={17} color={activeTheme.accent} />
          </TouchableOpacity>
          <Text style={[styles.stepValue, { color: activeTheme.text }]}>{readerState.settings.fontSize}</Text>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => handleUpdateSettings({ fontSize: Math.min(32, readerState.settings.fontSize + 1) })}
            style={[styles.stepButton, { backgroundColor: activeTheme.bg }]}>
            <Ionicons name="add" size={17} color={activeTheme.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Chế độ màu</Text>
      <View style={styles.sheetOptionGrid}>
        {themeOptions.map((option) => {
          const isSelected = preferences.theme === option.value;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={option.value}
              onPress={() => {
                handleUpdateSettings({ themeMode: option.value });
                updatePreferences({ theme: option.value });
              }}
              style={[
                styles.sheetOptionButton,
                { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
              ]}>
              <Ionicons name={option.name as ComponentProps<typeof Ionicons>['name']} size={15} color={isSelected ? activeTheme.accent : activeTheme.secondaryText} />
              <Text style={[styles.optionText, { color: activeTheme.secondaryText }, isSelected && { color: activeTheme.accent }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Màu nền trang sách</Text>
      <View style={styles.bgOptionContainer}>
        {backgroundOptions.map((option) => {
          const isSelected = readerState.settings.backgroundPresetId === option.id;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={option.id}
              onPress={() => handleSelectBackground(option.id)}
              style={[
                styles.bgCircleButton,
                { backgroundColor: option.color, borderColor: activeTheme.border },
                isSelected && { borderColor: activeTheme.accent, borderWidth: 2 },
              ]}>
              <Text style={[styles.bgCircleText, { color: option.textColor }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Phông chữ</Text>
      <View style={styles.sheetOptionGrid}>
        {fontOptions.map((option) => {
          const isSelected = readerState.settings.fontFamily === option.value;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={option.value}
              onPress={() => handleUpdateSettings({ fontFamily: option.value })}
              style={[
                styles.sheetOptionButton,
                { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
              ]}>
              <Text style={[styles.optionText, { color: activeTheme.secondaryText }, isSelected && { color: activeTheme.accent }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Thiết lập audio</Text>
      <View style={styles.ttsControlBar}>
        <TouchableOpacity activeOpacity={0.8} onPress={handlePrevSentence} style={[styles.ttsIconButton, { backgroundColor: activeTheme.bg }]}>
          <Ionicons name="play-skip-back" size={20} color={activeTheme.accent} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={handlePlayPause} style={[styles.ttsPlayButton, { backgroundColor: activeTheme.accent }]}>
          <Ionicons name={isSpeaking ? 'pause' : 'play'} size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={handleStop} style={[styles.ttsIconButton, { backgroundColor: activeTheme.bg }]}>
          <Ionicons name="stop" size={20} color="#DC2626" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={handleNextSentence} style={[styles.ttsIconButton, { backgroundColor: activeTheme.bg }]}>
          <Ionicons name="play-skip-forward" size={20} color={activeTheme.accent} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Chọn giọng AI</Text>
      <View style={styles.voiceOptionRow}>
        {voiceProfiles.map((profile) => {
          const isSelected = preferences.ttsVoice === profile.value;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={profile.value}
              onPress={() => updatePreferences({ ttsVoice: profile.value })}
              style={[
                styles.voiceCard,
                { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
              ]}>
              <Text style={[styles.voiceCardLabel, { color: activeTheme.text }]}>{profile.label}</Text>
              <Text style={[styles.voiceCardDesc, { color: activeTheme.secondaryText }]}>{profile.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Tốc độ đọc</Text>
      <View style={styles.speedOptionRow}>
        {speedOptions.map((speed) => {
          const isSelected = preferences.ttsSpeed === speed;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={speed}
              onPress={() => updatePreferences({ ttsSpeed: speed })}
              style={[
                styles.speedButton,
                { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                isSelected && { backgroundColor: activeTheme.accent, borderColor: activeTheme.accent },
              ]}>
              <Text style={[styles.speedButtonText, { color: activeTheme.text }, isSelected && { color: '#FFFFFF' }]}>
                {speed}x
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

function ReaderTocSheet({
  activeTheme,
  documents,
  handleJumpToProgress,
  handleSelectDocument,
  selectedDocumentId,
}: {
  activeTheme: ReaderThemeColors;
  documents: ReaderState['documents'];
  handleJumpToProgress: (pct: number) => void;
  handleSelectDocument: (documentId: string) => void;
  selectedDocumentId: string;
}) {
  const readingAnchors = [
    { label: 'Đầu tài liệu', pct: 0 },
    { label: '25%', pct: 25 },
    { label: '50%', pct: 50 },
    { label: '75%', pct: 75 },
    { label: 'Cuối tài liệu', pct: 100 },
  ];

  return (
    <>
      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Tài liệu</Text>
      <View style={styles.tocDocumentList}>
        {documents.map((document) => {
          const isSelected = document.id === selectedDocumentId;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={document.id}
              onPress={() => handleSelectDocument(document.id)}
              style={[
                styles.tocRow,
                { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
              ]}>
              <Text style={[styles.tocRowText, { color: isSelected ? activeTheme.accent : activeTheme.text }]} numberOfLines={1}>
                {document.title}
              </Text>
              <Text style={[styles.tocRowMeta, { color: activeTheme.secondaryText }]}>{(document.sourceFormat ?? 'txt').toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Vị trí đọc nhanh</Text>
      {readingAnchors.map((anchor) => (
        <TouchableOpacity
          activeOpacity={0.82}
          key={anchor.label}
          onPress={() => handleJumpToProgress(anchor.pct)}
          style={[styles.tocRow, { backgroundColor: activeTheme.bg, borderColor: activeTheme.border }]}>
          <Text style={[styles.tocRowText, { color: activeTheme.text }]}>
            {anchor.label}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );
}

function tokenizeReaderText(text: string) {
  if (!text) return [];

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const hasCjkOrBurmeseOrTibetanOrTamilOrTeluguOrKannadaOrMalayalam = /[\u4e00-\u9fa5\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af\u1000-\u109F\u0F00-\u0FFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/.test(text);
      if (hasCjkOrBurmeseOrTibetanOrTamilOrTeluguOrKannadaOrMalayalam) {
        let locale = 'zh';
        if (/[\u1000-\u109F]/.test(text)) {
          locale = 'my';
        } else if (/[\u0F00-\u0FFF]/.test(text)) {
          locale = 'bo';
        } else if (/[\u0B80-\u0BFF]/.test(text)) {
          locale = 'ta';
        } else if (/[\u0C00-\u0C7F]/.test(text)) {
          locale = 'te';
        } else if (/[\u0C80-\u0CFF]/.test(text)) {
          locale = 'kn';
        } else if (/[\u0D00-\u0D7F]/.test(text)) {
          locale = 'ml';
        }
        const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
        return Array.from(segmenter.segment(text), (s) => s.segment);
      }
    } catch {
      // Fallback
    }
  }

  const regex = /[A-Za-zÀ-ÿ\u0600-\u06FF\u0590-\u05FF][A-Za-zÀ-ÿ\u0600-\u06FF\u0590-\u05FF'-]*|[\u4e00-\u9fa5\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af\u1000-\u109F]|[\u0B80-\u0BFF]+|[\u0C00-\u0C7F]+|[\u0C80-\u0CFF]+|[\u0D00-\u0D7F]+|[\u0F00-\u0F0A\u0F0C-\u0FFF]+\u0F0B?|[^A-Za-zÀ-ÿ\u0600-\u06FF\u0590-\u05FF\u4e00-\u9fa5\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af\u1000-\u109F\u0F00-\u0FFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]+/g;
  return text.replace(/\s+/g, ' ').match(regex) ?? [];
}

function getReaderTextStyle(settings: ReaderSettings) {
  return {
    fontFamily: getFontFamily(settings.fontFamily),
    fontSize: settings.fontSize,
    lineHeight: Math.round(settings.fontSize * 1.55),
  };
}

function getFontFamily(fontFamily: ReaderSettings['fontFamily']) {
  if (fontFamily === 'serif') return 'Georgia';
  if (fontFamily === 'mono') return 'Courier New';
  return undefined;
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

const styles = StyleSheet.create({
  content: {
    paddingBottom: 190,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 20,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 29,
    fontWeight: '700',
    marginTop: 4,
  },
  documentRow: {
    gap: 8,
    paddingVertical: 14,
  },
  documentChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeDocumentChipText: {
    color: '#FFFFFF',
  },
  documentChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  documentFormatText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeDocumentFormatText: {
    color: '#E2E8F0',
  },
  settingsPanel: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
    boxShadow: '0px 2px 10px rgba(15, 23, 42, 0.08)',
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  stepButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepValue: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  optionButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 9,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 18,
    textTransform: 'uppercase',
  },
  bgOptionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    paddingVertical: 4,
  },
  bgCircleButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  bgCircleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  readerPage: {
    borderRadius: 12,
    marginTop: 14,
    padding: 16,
    boxShadow: '0px 1px 8px rgba(15, 23, 42, 0.05)',
  },
  readerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  readerTextWrap: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  readerWord: {
    marginHorizontal: 1,
  },
  selectedRangeWord: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  readerActionPanel: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  readerActionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readerActionKicker: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  readerActionWord: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  readerActionClose: {
    alignItems: 'center',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  readerLanguageRow: {
    gap: 10,
    marginTop: 12,
  },
  readerInlineLanguageBox: {
    gap: 7,
  },
  readerInlineLanguageLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  readerInlineLanguageList: {
    gap: 7,
    paddingRight: 8,
  },
  readerInlineLanguageChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  readerInlineLanguageText: {
    fontSize: 11,
    fontWeight: '900',
  },
  quickNoteInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    minHeight: 76,
    padding: 11,
    textAlignVertical: 'top',
  },
  readerSaveMessage: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 9,
  },
  readerActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  lookupActionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  lookupActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveActionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  saveActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  // TTS styles
  ttsControlBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 12,
  },
  ttsIconButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  ttsPlayButton: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  voiceOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  voiceCard: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
    padding: 10,
  },
  voiceCardLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  voiceCardDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  speedOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  speedButton: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    minWidth: '28%',
    paddingVertical: 6,
  },
  speedButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Scrubber styles
  scrubberPanel: {
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
    boxShadow: '0px -2px 10px rgba(15, 23, 42, 0.1)',
  },
  scrubberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scrubberPercentage: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrubberSentences: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrubberTouchArea: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  scrubberTrack: {
    borderRadius: 3,
    height: 5,
    width: '100%',
  },
  scrubberProgressLine: {
    borderRadius: 3,
    height: '100%',
  },
  scrubberThumbCircle: {
    borderRadius: 8,
    borderWidth: 2,
    height: 14,
    marginTop: -7,
    position: 'absolute',
    top: '50%',
    width: 14,
  },
  audioProgressPanel: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  audioSeekButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  audioScrubberTouchArea: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  audioScrubberTrack: {
    borderRadius: 3,
    height: 4,
    overflow: 'hidden',
  },
  audioScrubberProgress: {
    borderRadius: 3,
    height: '100%',
  },
  audioProgressText: {
    fontSize: 11,
    fontWeight: '800',
    minWidth: 42,
    textAlign: 'center',
  },
  readerDockControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  readerDockButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  readerDockPrimaryButton: {
    borderWidth: 0,
    height: 50,
    width: 50,
  },
  sheetBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdropTouch: {
    flex: 1,
  },
  readerSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    maxHeight: '86%',
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheetCloseButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sheetHeaderSpacer: {
    width: 36,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  sheetContent: {
    paddingBottom: 32,
    paddingTop: 12,
  },
  sheetSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 18,
    textTransform: 'uppercase',
  },
  sheetRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sheetRowText: {
    fontSize: 17,
    fontWeight: '700',
  },
  sheetOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  sheetOptionButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minWidth: '31%',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tocDocumentList: {
    gap: 8,
    marginTop: 10,
  },
  tocRow: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  tocRowText: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  tocRowMeta: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
});
