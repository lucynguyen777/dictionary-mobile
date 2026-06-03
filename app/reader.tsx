import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  GestureResponderEvent,
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
import { getStoredItem, setStoredItem } from '@/data/storageAdapter';
import { TranslationPanel } from '@/components/TranslationPanel';

// Extra Local Preferences Storage Keys
const PREFS_STORAGE_KEY = 'dictionary-mobile.reader-prefs.v1';

type ReaderTheme = 'light' | 'dark' | 'sepia';
type VoiceProfile = 'female' | 'male' | 'child' | 'old';

type ReaderPreferences = {
  theme: ReaderTheme;
  ttsVoice: VoiceProfile;
  ttsSpeed: number;
};

const defaultPrefs: ReaderPreferences = {
  theme: 'light',
  ttsVoice: 'female',
  ttsSpeed: 1.0,
};

const fontOptions: { label: string; value: ReaderSettings['fontFamily'] }[] = [
  { label: 'System', value: 'system' },
  { label: 'Serif (Classic)', value: 'serif' },
  { label: 'Mono (Clean)', value: 'mono' },
];

const themeOptions: { label: string; value: ReaderTheme; name: string }[] = [
  { label: 'Sáng', value: 'light', name: 'sunny-outline' },
  { label: 'Ấm (Sepia)', value: 'sepia', name: 'cafe-outline' },
  { label: 'Tối', value: 'dark', name: 'moon-outline' },
];

const backgroundOptions = [
  // Warm tones
  { label: 'Ấm Cream', value: '#FDF6E3', text: '#5C4033', name: 'sepia' },
  { label: 'Ấm Cam', value: '#FFF7ED', text: '#431407', name: 'sepia' },
  // Cool tones
  { label: 'Mint Mát', value: '#ECFDF5', text: '#064E3B', name: 'light' },
  { label: 'Sáng Xám', value: '#F1F5F9', text: '#0F172A', name: 'light' },
  { label: 'Sáng Trắng', value: '#F8FAFC', text: '#0F172A', name: 'light' },
  // Dark tones
  { label: 'Tối Đen', value: '#121016', text: '#E2E8F7', name: 'dark' },
  { label: 'Tối Than', value: '#1E1E24', text: '#CCCCCC', name: 'dark' },
];

const voiceProfiles: { label: string; value: VoiceProfile; desc: string }[] = [
  { label: 'Nữ 👩', value: 'female', desc: 'Cao, truyền cảm' },
  { label: 'Nam 👨', value: 'male', desc: 'Trầm, ấm áp' },
  { label: 'Trẻ em 👧', value: 'child', desc: 'Trong sáng, nhanh' },
  { label: 'Người già 👴', value: 'old', desc: 'Chậm rãi, từ tốn' },
];

const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export default function ReaderScreen() {
  const [readerState, setReaderState] = useState<ReaderState>(getDefaultReaderState());
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [quickNote, setQuickNote] = useState('');
  const [readerSaveMessage, setReaderSaveMessage] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  // Custom Local Preferences (Theme, TTS Voice, TTS Speed)
  const [preferences, setPreferences] = useState<ReaderPreferences>(defaultPrefs);

  // Scrubber Progress & Scroll state
  const scrollViewRef = useRef<ScrollView>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [scrubberWidth, setScrubberWidth] = useState(0);

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);

  // Load preferences and state
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      Promise.all([
        loadReaderState(),
        loadLibraryState(),
        getStoredItem(PREFS_STORAGE_KEY),
      ]).then(([nextReaderState, nextLibraryState, rawPrefs]) => {
        if (!isMounted) return;

        setReaderState(nextReaderState);
        setLibraryState(nextLibraryState);

        if (rawPrefs) {
          try {
            setPreferences({ ...defaultPrefs, ...JSON.parse(rawPrefs) });
          } catch {
            // ignore
          }
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

  const activeTheme = useMemo(() => {
    const themeMode = preferences.theme;
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
  }, [preferences.theme]);

  // Save local preferences
  const updatePreferences = async (newPrefs: Partial<ReaderPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    await setStoredItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
  };

  // Adjust application background color to match specific preset background if selected
  const handleSelectBackground = (bgColor: string, themeMode: ReaderTheme) => {
    handleUpdateSettings({ backgroundColor: bgColor as any });
    updatePreferences({ theme: themeMode });
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
    router.push({ pathname: '/word', params: { sourceLang: 'en', targetLang: 'vi', word: selectedHighlightText } });
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

        {/* Customization Settings panel */}
        <View style={[styles.settingsPanel, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
          {/* Font Sizes & Theme Modes */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: activeTheme.text }]}>Cỡ chữ</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => handleUpdateSettings({ fontSize: Math.max(14, readerState.settings.fontSize - 1) })}
                style={[styles.stepButton, { backgroundColor: activeTheme.bg }]}
              >
                <Ionicons name="remove" size={17} color={activeTheme.accent} />
              </TouchableOpacity>
              <Text style={[styles.stepValue, { color: activeTheme.text }]}>{readerState.settings.fontSize}</Text>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => handleUpdateSettings({ fontSize: Math.min(32, readerState.settings.fontSize + 1) })}
                style={[styles.stepButton, { backgroundColor: activeTheme.bg }]}
              >
                <Ionicons name="add" size={17} color={activeTheme.accent} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Theme Modes Selector */}
          <View style={styles.optionRow}>
            {themeOptions.map((option) => {
              const isSelected = preferences.theme === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.82}
                  onPress={() => updatePreferences({ theme: option.value })}
                  style={[
                    styles.optionButton,
                    { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                    isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
                  ]}
                >
                  <Ionicons name={option.name as any} size={15} color={isSelected ? activeTheme.accent : activeTheme.secondaryText} />
                  <Text style={[styles.optionText, { color: activeTheme.secondaryText }, isSelected && { color: activeTheme.accent }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Background selection (Warm vs Cool tones) */}
          <Text style={[styles.sectionHeading, { color: activeTheme.text }]}>Màu nền trang sách (Tông ấm / Lạnh)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bgOptionContainer}>
            {backgroundOptions.map((option) => {
              const isSelected = readerState.settings.backgroundColor === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.82}
                  onPress={() => handleSelectBackground(option.value, option.name as ReaderTheme)}
                  style={[
                    styles.bgCircleButton,
                    { backgroundColor: option.value, borderColor: activeTheme.border },
                    isSelected && { borderColor: activeTheme.accent, borderWidth: 2 },
                  ]}
                >
                  <Text style={[styles.bgCircleText, { color: option.text }]}>{option.label.split(' ')[1]}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Font Family selection */}
          <Text style={[styles.sectionHeading, { color: activeTheme.text }]}>Phông chữ</Text>
          <View style={styles.optionRow}>
            {fontOptions.map((option) => {
              const isSelected = readerState.settings.fontFamily === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.82}
                  onPress={() => handleUpdateSettings({ fontFamily: option.value })}
                  style={[
                    styles.optionButton,
                    { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                    isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
                  ]}
                >
                  <Text style={[styles.optionText, { color: activeTheme.secondaryText }, isSelected && { color: activeTheme.accent }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* AI Voice settings & controls */}
        {selectedDocument && (
          <View style={[styles.settingsPanel, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
            <Text style={[styles.settingLabel, { color: activeTheme.text, marginBottom: 8 }]}>Giọng đọc AI & Audio</Text>
            
            {/* Audio Action Buttons */}
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

            {/* AI Voice Selection */}
            <Text style={[styles.sectionHeading, { color: activeTheme.text }]}>Chọn giọng AI</Text>
            <View style={styles.voiceOptionRow}>
              {voiceProfiles.map((profile) => {
                const isSelected = preferences.ttsVoice === profile.value;
                return (
                  <TouchableOpacity
                    key={profile.value}
                    activeOpacity={0.82}
                    onPress={() => updatePreferences({ ttsVoice: profile.value })}
                    style={[
                      styles.voiceCard,
                      { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                      isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
                    ]}
                  >
                    <Text style={[styles.voiceCardLabel, { color: activeTheme.text }]}>{profile.label}</Text>
                    <Text style={[styles.voiceCardDesc, { color: activeTheme.secondaryText }]}>{profile.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Speed Adjust options */}
            <Text style={[styles.sectionHeading, { color: activeTheme.text }]}>Tốc độ đọc</Text>
            <View style={styles.speedOptionRow}>
              {speedOptions.map((speed) => {
                const isSelected = preferences.ttsSpeed === speed;
                return (
                  <TouchableOpacity
                    key={speed}
                    activeOpacity={0.82}
                    onPress={() => updatePreferences({ ttsSpeed: speed })}
                    style={[
                      styles.speedButton,
                      { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                      isSelected && { backgroundColor: activeTheme.accent, borderColor: activeTheme.accent },
                    ]}
                  >
                    <Text style={[styles.speedButtonText, { color: activeTheme.text }, isSelected && { color: '#FFFFFF' }]}>
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Reader Book Content display */}
        {selectedDocument ? (
          <View style={[styles.readerPage, { backgroundColor: readerState.settings.backgroundColor as any }]}>
            <Text style={[styles.readerTitle, { color: activeTheme.text }, isRtl && { textAlign: 'right', writingDirection: 'rtl' }]}>
              {selectedDocument.title}
            </Text>
            <View style={[styles.readerTextWrap, isRtl && { flexDirection: 'row-reverse' }]}>
              {readerTokens.slice(0, 900).map((token, index) => {
                const isWord = /[A-Za-zÀ-ÿ\u0600-\u06FF\u0590-\u05FF\u1000-\u109F\u0F00-\u0FFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/.test(token);
                const inSelection = selectionRange ? index >= selectionRange.start && index <= selectionRange.end : false;

                // Highlight active sentence currently being read by AI
                const tokenSentenceIdx = tokenToSentenceMap[index];
                const isActiveSentence = activeSentenceIndex !== null && tokenSentenceIdx === activeSentenceIndex;

                return isWord ? (
                  <TouchableOpacity
                    key={`${token}-${index}`}
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
                        { color: activeTheme.text },
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
                    key={`${token}-${index}`}
                    style={[
                      styles.readerWord,
                      { color: activeTheme.text },
                      getReaderTextStyle(readerState.settings),
                      isActiveSentence && { backgroundColor: activeTheme.highlightBg, color: activeTheme.highlightText, borderRadius: 2 },
                    ]}
                  >
                    {token}
                  </Text>
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

        {/* Word lookup highlight actions panel */}
        {selectionRange && selectedHighlightText ? (
          <View style={[styles.readerActionPanel, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
            <View style={styles.readerActionHeader}>
              <View>
                <Text style={[styles.readerActionKicker, { color: activeTheme.secondaryText }]}>Highlight</Text>
                <Text style={[styles.readerActionWord, { color: activeTheme.text }]}>{selectedHighlightText}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.75} onPress={handleCloseSelection} style={[styles.readerActionClose, { backgroundColor: activeTheme.bg }]}>
                <Ionicons name="close" size={18} color={activeTheme.secondaryText} />
              </TouchableOpacity>
            </View>
            <TextInput
              multiline
              onChangeText={setQuickNote}
              placeholder="Ghi chú cho cụm từ..."
              placeholderTextColor={activeTheme.secondaryText}
              style={[styles.quickNoteInput, { backgroundColor: activeTheme.bg, borderColor: activeTheme.border, color: activeTheme.text }]}
              value={quickNote}
            />
            <TranslationPanel sourceText={selectedHighlightText} targetLang="VI" />
            {readerSaveMessage ? <Text style={styles.readerSaveMessage}>{readerSaveMessage}</Text> : null}
            <View style={styles.readerActionButtons}>
              <TouchableOpacity activeOpacity={0.82} onPress={handleOpenLookup} style={[styles.lookupActionButton, { backgroundColor: activeTheme.bg }]}>
                <Ionicons name="search" size={17} color={activeTheme.accent} />
                <Text style={[styles.lookupActionText, { color: activeTheme.accent }]}>Tra nghĩa</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.82} onPress={handleSaveSelection} style={[styles.saveActionButton, { backgroundColor: activeTheme.accent }]}>
                <Ionicons name="bookmark-outline" size={17} color="#FFFFFF" />
                <Text style={styles.saveActionText}>Lưu cụm từ</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.82} onPress={handleCreateFlashcardFromSelection} style={[styles.saveActionButton, { backgroundColor: activeTheme.accent }]}>
                <Ionicons name="albums-outline" size={17} color="#FFFFFF" />
                <Text style={styles.saveActionText}>Tạo thẻ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Novel Reading Progress Scrubber fixed to bottom */}
      {selectedDocument && (
        <View style={[styles.scrubberPanel, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
          <View style={styles.scrubberInfo}>
            <Text style={[styles.scrubberPercentage, { color: activeTheme.text }]}>Tiến độ: {Math.round(progress)}%</Text>
            {sentences.length > 0 && (
              <Text style={[styles.scrubberSentences, { color: activeTheme.secondaryText }]}>
                Câu {activeSentenceIndex !== null ? activeSentenceIndex + 1 : 1}/{sentences.length}
              </Text>
            )}
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
        </View>
      )}
    </Screen>
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
    paddingBottom: 120, // Keep space for progress bar bottom dock
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
    paddingVertical: 14,
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
});
