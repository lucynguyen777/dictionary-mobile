import Ionicons from '@expo/vector-icons/Ionicons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import VoiceCapturePreview from '@/app/(tabs)/voiceCapturePreview';
import { performOCR } from '@/data/ocr';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import StickyTabBar from '@/components/word/StickyTabBar';
import TabPager from '@/components/word/TabPager';
import WordHeader from '@/components/word/WordHeader';
import { DictionaryEntry, dictionaryEntries } from '@/data/dictionary';
import {
  ApiBilingualMeaningResult,
  ApiMeaningResult,
  ApiRelatedWords,
  canUseBilingualDictionaryApi,
  canUseMonolingualDictionaryApi,
  fetchBilingualMeaning,
  fetchVietnameseSuggestions,
  isBlockedBilingualDictionaryPair,
} from '@/data/dictionaryApi';
import { lookupMonolingual, lookupRelatedWords } from '@/data/adapterRegistry';
import {
  buildLocalFixtureFallback,
  formatEtymologyWithAttribution,
  resolveEtymologyDisplay,
} from '@/data/etymologyAdapter';
import { LanguageOption, getLanguageByCode, isTranslationComingSoonPair, languageOptions } from '@/data/languages';
import {
  LibraryState,
  addSearchHistory,
  getDefaultLibraryState,
  getFavoriteFolderId,
  getSavedWord,
  loadLibraryState,
  saveWordToFolder,
  toggleFavoriteWord,
} from '@/data/libraryStore';
import {
  findLocalDictionaryEntry,
  getLocalDictionaryEntries,
  getSpellingSuggestions,
  normalizeLookupTerm,
  supportsLocalDictionary,
} from '@/data/localLexicon';
import { getMorphologyCandidates } from '@/data/morphology';
import {
  RecognitionKind,
  RecognitionPrototypeResult,
  createOcrPrototypeResult,
  createSpeechToTextPrototypeResult,
} from '@/data/recognition';
import {
  createAudioCapturePreview,
  createImageCapturePreview,
  formatCapturePreviewMeta,
} from '@/data/recognitionCapture';
import type { RecognitionCapturePreview } from '@/data/recognitionCapture';

const { width } = Dimensions.get('window');

const TABS = ['Meaning', 'Synonyms', 'Collocation & Idiom', 'Conjugation', 'Etymology', 'Pronunciation'];

type LookupStatus = 'idle' | 'loading' | 'ready' | 'error';
type LanguageField = 'source' | 'target';
type RecognitionStatus = 'idle' | 'requesting' | 'recording' | 'processing' | 'ready' | 'error';

export default function WordScreen() {
  const params = useLocalSearchParams<{ word?: string; sourceLang?: string; targetLang?: string }>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState(dictionaryEntries[0].word);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [lookupError, setLookupError] = useState('');
  const [bilingualLookupError, setBilingualLookupError] = useState('');
  const [apiMeaning, setApiMeaning] = useState<ApiMeaningResult | null>(null);
  const [apiBilingualMeaning, setApiBilingualMeaning] = useState<ApiBilingualMeaningResult | null>(null);
  const [apiRelatedWords, setApiRelatedWords] = useState<ApiRelatedWords | null>(null);
  const [externalSuggestions, setExternalSuggestions] = useState<string[]>([]);
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [showLanguageControls, setShowLanguageControls] = useState(false);
  const [activeLanguageField, setActiveLanguageField] = useState<LanguageField | null>(null);
  const [recognitionModalOpen, setRecognitionModalOpen] = useState(false);
  const [recognitionMode, setRecognitionMode] = useState<RecognitionKind>('speech');
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus>('idle');
  const [recognitionResult, setRecognitionResult] = useState<RecognitionPrototypeResult | null>(null);
  const [recognitionCapturePreview, setRecognitionCapturePreview] = useState<RecognitionCapturePreview | null>(null);
  const [recognitionError, setRecognitionError] = useState('');
  const [capturePreviewVisible, setCapturePreviewVisible] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const scrollRef = useRef<ScrollView | null>(null);
  const sourceLanguage = getLanguageByCode(getRouteParam(params.sourceLang), 'en');
  const targetLanguage = getLanguageByCode(getRouteParam(params.targetLang), 'vi');
  const shouldUseBilingualDictionary = sourceLanguage.code !== targetLanguage.code;
  const isBilingualSourceBlocked = isBlockedBilingualDictionaryPair(sourceLanguage.code, targetLanguage.code);
  const canUseBilingualDictionaryApiForPair = canUseBilingualDictionaryApi(sourceLanguage.code, targetLanguage.code);
  const canUseSourceDictionaryApi = canUseMonolingualDictionaryApi(sourceLanguage.code);
  const hasLocalDictionarySource = supportsLocalDictionary(sourceLanguage.code);
  const isTranslationComingSoon = isTranslationComingSoonPair(sourceLanguage.code, targetLanguage.code);
  const bilingualDictionaryUnavailableMessage = useMemo(
    () => getBilingualDictionaryUnavailableMessage(sourceLanguage, targetLanguage),
    [sourceLanguage, targetLanguage]
  );
  const sourceEntries = useMemo(() => getLocalDictionaryEntries(sourceLanguage.code), [sourceLanguage.code]);

  const localEntry = findLocalDictionaryEntry(sourceLanguage.code, selectedWord);
  const selectedEntry = useMemo(
    () =>
      mergeLookupEntry(
        localEntry,
        selectedWord,
        apiBilingualMeaning,
        apiMeaning,
        canUseSourceDictionaryApi,
        hasLocalDictionarySource,
        isBilingualSourceBlocked,
        sourceLanguage.label,
        targetLanguage.label
      ),
    [
      apiMeaning,
      apiBilingualMeaning,
      canUseSourceDictionaryApi,
      hasLocalDictionarySource,
      isBilingualSourceBlocked,
      localEntry,
      selectedWord,
      sourceLanguage.label,
      targetLanguage.label,
    ]
  );

  const results = useMemo(() => {
    const normalized = normalizeLookupTerm(query);
    if (!normalized) return [];

    return sourceEntries.filter((entry) => {
      const searchable = [
        entry.word,
        entry.ipa,
        entry.topic,
        entry.level,
        entry.vietnamese,
        entry.shortDefinition,
        ...entry.synonyms,
        ...entry.collocations,
      ].join(' ').toLocaleLowerCase();

      return searchable.includes(normalized);
    });
  }, [query, sourceEntries]);

  const spellingSuggestions = useMemo(() => {
    if (!query || results.length > 0) return [];
    return getSpellingSuggestions(sourceLanguage.code, query, 3);
  }, [query, results.length, sourceLanguage.code]);
  const allSpellingSuggestions = useMemo(
    () => Array.from(new Set([...spellingSuggestions, ...externalSuggestions])).slice(0, 6),
    [externalSuggestions, spellingSuggestions]
  );
  const morphologySuggestions = useMemo(() => {
    if (!query || results.length > 0) return [];
    return getMorphologyCandidates(sourceLanguage.code, query);
  }, [query, results.length, sourceLanguage.code]);

  const normalizedQuery = normalizeLookupTerm(query);
  const hasExactLocalResult = results.some((entry) => normalizeLookupTerm(entry.word) === normalizedQuery);
  const canSearchRemoteSource = canUseSourceDictionaryApi || canUseBilingualDictionaryApiForPair;
  const shouldShowApiLookup = Boolean(normalizedQuery) && canSearchRemoteSource && !hasExactLocalResult;
  const savedWord = getSavedWord(libraryState, selectedEntry.word);
  const favoriteFolderId = getFavoriteFolderId();
  const isFavorite = Boolean(savedWord?.folderIds.includes(favoriteFolderId));
  const savedFolderIds = savedWord?.folderIds ?? [];

  useEffect(() => {
    let isMounted = true;

    loadLibraryState().then((state) => {
      if (!isMounted) return;

      setLibraryState(state);
      setLibraryLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const routeWord = Array.isArray(params.word) ? params.word[0] : params.word;
    const normalizedRouteWord = routeWord ? normalizeLookupTerm(routeWord) : '';
    if (!normalizedRouteWord) return;

    setSelectedWord((currentWord) => (currentWord === normalizedRouteWord ? currentWord : normalizedRouteWord));
    setQuery('');
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [params.word]);

  useEffect(() => {
    let isCancelled = false;

    async function lookupWord() {
      if (isBilingualSourceBlocked && !canUseSourceDictionaryApi) {
        setLookupStatus('error');
        setLookupError(bilingualDictionaryUnavailableMessage);
        setBilingualLookupError(bilingualDictionaryUnavailableMessage);
        setApiMeaning(null);
        setApiBilingualMeaning(null);
        setApiRelatedWords(null);
        return;
      }

      if (!canUseSourceDictionaryApi && !shouldUseBilingualDictionary) {
        setLookupStatus('idle');
        setLookupError('');
        setBilingualLookupError('');
        setApiMeaning(null);
        setApiBilingualMeaning(null);
        setApiRelatedWords(null);
        return;
      }

      setLookupStatus('loading');
      setLookupError('');
      setBilingualLookupError(
        shouldUseBilingualDictionary && !canUseBilingualDictionaryApiForPair
          ? bilingualDictionaryUnavailableMessage
          : ''
      );
      setApiMeaning(null);
      setApiBilingualMeaning(null);
      setApiRelatedWords(null);

      const lookupTasks = [
        canUseSourceDictionaryApi ? lookupMonolingual(selectedWord, sourceLanguage.code) : Promise.resolve(null),
        canUseSourceDictionaryApi ? lookupRelatedWords(selectedWord, sourceLanguage.code) : Promise.resolve(null),
        canUseBilingualDictionaryApiForPair
          ? fetchBilingualMeaning(selectedWord, sourceLanguage.code, targetLanguage.code)
          : Promise.resolve(null),
      ] as const;
      const [meaningResult, relatedWordsResult, bilingualMeaningResult] = await Promise.allSettled(lookupTasks);

      if (isCancelled) return;

      if (meaningResult.status === 'fulfilled' && meaningResult.value) {
        setApiMeaning(meaningResult.value);
      }

      if (relatedWordsResult.status === 'fulfilled' && relatedWordsResult.value) {
        setApiRelatedWords(relatedWordsResult.value);
      }

      if (bilingualMeaningResult.status === 'fulfilled' && bilingualMeaningResult.value) {
        setApiBilingualMeaning(bilingualMeaningResult.value);
      } else if (shouldUseBilingualDictionary && bilingualMeaningResult.status === 'rejected') {
        const error = bilingualMeaningResult.reason;
        setBilingualLookupError(error instanceof Error ? error.message : 'Chưa thể tải dữ liệu từ điển song ngữ.');
      }

      if (
        (meaningResult.status === 'fulfilled' && meaningResult.value) ||
        (relatedWordsResult.status === 'fulfilled' && relatedWordsResult.value) ||
        (bilingualMeaningResult.status === 'fulfilled' && bilingualMeaningResult.value)
      ) {
        setLookupStatus('ready');
        return;
      }

      const error =
        (meaningResult.status === 'rejected' && meaningResult.reason) ||
        (bilingualMeaningResult.status === 'rejected' && bilingualMeaningResult.reason) ||
        (relatedWordsResult.status === 'rejected' && relatedWordsResult.reason);
      setLookupStatus('error');
      setLookupError(error instanceof Error ? error.message : 'Chưa thể tải dữ liệu từ điển.');
    }

    lookupWord();

    return () => {
      isCancelled = true;
    };
  }, [
    canUseSourceDictionaryApi,
    canUseBilingualDictionaryApiForPair,
    bilingualDictionaryUnavailableMessage,
    isBilingualSourceBlocked,
    selectedWord,
    shouldUseBilingualDictionary,
    sourceLanguage.code,
    targetLanguage.code,
  ]);

  useEffect(() => {
    let isCancelled = false;

    if (sourceLanguage.code !== 'vi' || !query.trim() || results.length > 0) {
      setExternalSuggestions([]);
      return;
    }

    fetchVietnameseSuggestions(query)
      .then((suggestions) => {
        if (!isCancelled) setExternalSuggestions(suggestions);
      })
      .catch(() => {
        if (!isCancelled) setExternalSuggestions([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [query, results.length, sourceLanguage.code]);

  useEffect(() => {
    if (!libraryLoaded) return;

    addSearchHistory(libraryState, selectedWord).then(setLibraryState);
    // Only record a new history row when the selected lookup word changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryLoaded, selectedWord]);

  const selectWord = (word: string) => {
    const trimmedWord = normalizeLookupTerm(word);
    if (!trimmedWord) return;

    setSelectedWord(trimmedWord);
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: true });
  };

  const handleToggleFavorite = () => {
    toggleFavoriteWord(libraryState, selectedEntry).then(setLibraryState);
  };

  const handleSaveToFolder = (folderId: string, note: string) => {
    saveWordToFolder(libraryState, selectedEntry, folderId, note).then(setLibraryState);
  };

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    scrollRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
  };

  const handleLanguageSelect = (field: LanguageField, language: LanguageOption) => {
    router.setParams({
      sourceLang: field === 'source' ? language.code : sourceLanguage.code,
      targetLang: field === 'target' ? language.code : targetLanguage.code,
    });
    setActiveLanguageField(null);
    setShowLanguageControls(true);
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  };

  const openRecognitionModal = (mode: RecognitionKind) => {
    setRecognitionMode(mode);
    setRecognitionStatus('idle');
    setRecognitionResult(null);
    setRecognitionCapturePreview(null);
    setRecognitionError('');
    setRecognitionModalOpen(true);
  };

  const closeRecognitionModal = async () => {
    await stopSpeechRecording();
    setRecognitionModalOpen(false);
  };

  const stopSpeechRecording = async () => {
    if (recognitionStatus !== 'recording') return null;

    try {
      await audioRecorder.stop();
      return audioRecorder.uri;
    } catch {
      return audioRecorder.uri;
    } finally {
      await setAudioModeAsync({ allowsRecording: false });
    }
  };

  const handleStartSpeechPrototype = async () => {
    setRecognitionStatus('requesting');
    setRecognitionError('');
    setRecognitionResult(null);

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Cần quyền microphone để thử luồng tra bằng giọng nói.');
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setRecognitionStatus('recording');
    } catch (error) {
      setRecognitionStatus('error');
      setRecognitionError(error instanceof Error ? error.message : 'Chưa thể bắt đầu ghi âm.');
    }
  };

  const handleCapture = async (uri: string) => {
    setCapturePreviewVisible(false);
    setRecognitionMode('ocr');
    setRecognitionStatus('processing');
    setRecognitionCapturePreview(createImageCapturePreview({ uri, source: 'camera' }));
    try {
      const ocrText = await performOCR(uri, sourceLanguage.code);
      const prototypeResult = createOcrPrototypeResult({ languageCode: sourceLanguage.code, imageUri: uri });
      setRecognitionResult({
        ...prototypeResult,
        text: ocrText || prototypeResult.text,
      });
      setRecognitionStatus('ready');
      setRecognitionModalOpen(true);
    } catch {
      setRecognitionError('OCR processing failed');
      setRecognitionStatus('error');
      setRecognitionModalOpen(true);
    }
  };

  const handleFinishSpeechPrototype = async () => {
    setRecognitionStatus('processing');
    setRecognitionError('');

    const durationMs = audioRecorder.getStatus().durationMillis;
    const audioUri = await stopSpeechRecording();
    setRecognitionCapturePreview(createAudioCapturePreview({ uri: audioUri, durationMs }));
    setRecognitionResult(createSpeechToTextPrototypeResult({ languageCode: sourceLanguage.code, audioUri }));
    setRecognitionStatus('ready');
  };

  const handlePickOcrPrototypeImage = async () => {
    setRecognitionStatus('requesting');
    setRecognitionError('');
    setRecognitionResult(null);
    setRecognitionCapturePreview(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Cần quyền thư viện ảnh để thử luồng OCR.');
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (pickerResult.canceled) {
        setRecognitionStatus('idle');
        return;
      }

      setRecognitionStatus('processing');
      const imageAsset = pickerResult.assets[0];
      const imageUri = imageAsset?.uri ?? null;
      setRecognitionCapturePreview(
        createImageCapturePreview({
          uri: imageUri,
          width: imageAsset?.width,
          height: imageAsset?.height,
          sizeBytes: imageAsset?.fileSize,
          source: 'library',
        })
      );
      setRecognitionResult(createOcrPrototypeResult({ languageCode: sourceLanguage.code, imageUri }));
      setRecognitionStatus('ready');
    } catch (error) {
      setRecognitionStatus('error');
      setRecognitionError(error instanceof Error ? error.message : 'Chưa thể chọn ảnh OCR.');
    }
  };

  const handleUseRecognitionText = (text: string) => {
    selectWord(text);
    setRecognitionModalOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.lookupPanel}>
        <View style={styles.lookupSearchCard}>
          <View style={styles.inputBox}>
            <Ionicons name="search" size={22} color="#2563EB" />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              placeholder="Tìm từ, nghĩa, chủ đề..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
              onFocus={() => setShowLanguageControls(true)}
              onSubmitEditing={() => selectWord(query)}
              style={[
                styles.input,
                sourceLanguage.writingDirection === 'rtl' && { textAlign: 'right', writingDirection: 'rtl' }
              ]}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => setShowLanguageControls((value) => !value)}
              style={styles.languageToggle}>
              <Ionicons name="language-outline" size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>
          <Text style={styles.languageCaption}>
            Đang tra: {sourceLanguage.label} → {targetLanguage.label}
          </Text>
          <View style={styles.recognitionActionRow}>
            <TouchableOpacity
              accessibilityLabel="Open voice search prototype"
              activeOpacity={0.82}
              onPress={() => openRecognitionModal('speech')}
              style={styles.recognitionActionButton}>
              <Ionicons name="mic-outline" size={17} color="#0F766E" />
              <Text style={styles.recognitionActionText}>Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Open OCR lookup prototype"
              activeOpacity={0.82}
              onPress={() => openRecognitionModal('ocr')}
              style={styles.recognitionActionButton}>
              <Ionicons name="image-outline" size={17} color="#0F766E" />
              <Text style={styles.recognitionActionText}>OCR</Text>
            </TouchableOpacity>
          </View>
          {showLanguageControls ? (
            <View style={styles.languageControls}>
              <LookupLanguageSelect
                active={activeLanguageField === 'source'}
                field="source"
                label="Ngôn ngữ gốc"
                selectedLanguage={sourceLanguage}
                onPress={setActiveLanguageField}
                onSelect={handleLanguageSelect}
              />
              <View style={styles.languageSwap}>
                <Ionicons name="swap-horizontal" size={17} color="#64748B" />
              </View>
              <LookupLanguageSelect
                active={activeLanguageField === 'target'}
                field="target"
                label="Tra / dịch sang"
                selectedLanguage={targetLanguage}
                onPress={setActiveLanguageField}
                onSelect={handleLanguageSelect}
              />
            </View>
          ) : null}
        </View>
        {query ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.resultRow}>
            {results.map((entry) => {
              const isSelected = entry.word === selectedEntry.word;

              return (
                <TouchableOpacity
                  key={entry.word}
                  activeOpacity={0.82}
                  onPress={() => selectWord(entry.word)}
                  style={[styles.resultChip, isSelected && styles.activeResultChip]}>
                  <Text style={[styles.resultWord, isSelected && styles.activeResultText]}>{entry.word}</Text>
                  <Text style={[styles.resultMeta, isSelected && styles.activeResultMeta]}>{entry.level} · {entry.topic}</Text>
                </TouchableOpacity>
              );
            })}
            {shouldShowApiLookup ? (
              <TouchableOpacity activeOpacity={0.82} onPress={() => selectWord(query)} style={styles.apiLookupChip}>
                <Text style={styles.apiLookupTitle}>Tra {query.trim()}</Text>
                <Text style={styles.apiLookupMeta}>
                  {isBilingualSourceBlocked ? 'Source pending' : `${sourceLanguage.label} dictionary`}
                </Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        ) : null}
        {query && results.length === 0 && !shouldShowApiLookup && allSpellingSuggestions.length === 0 ? (
          <Text style={styles.emptyText}>Nhập từ thuộc ngôn ngữ gốc rồi nhấn tìm kiếm.</Text>
        ) : null}
        {query && results.length === 0 && allSpellingSuggestions.length > 0 ? (
          <View style={styles.suggestionBlock}>
            <Text style={styles.suggestionTitle}>Có phải ý bạn là:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
              {allSpellingSuggestions.map((suggestion) => (
                <TouchableOpacity key={suggestion} activeOpacity={0.82} onPress={() => selectWord(suggestion)} style={styles.suggestionChip}>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
        {query && results.length === 0 && morphologySuggestions.length > 0 ? (
          <View style={styles.morphologyBlock}>
            <Text style={styles.morphologyTitle}>Dạng gốc có thể là:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
              {morphologySuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={`${suggestion.word}-${suggestion.reason}`}
                  activeOpacity={0.82}
                  onPress={() => selectWord(suggestion.word)}
                  style={styles.morphologyChip}>
                  <Text style={styles.morphologyText}>{suggestion.label}</Text>
                  <Text style={styles.morphologyMeta}>{suggestion.reason}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
        {!query && libraryState.searchHistory.length ? (
          <View style={styles.historyBlock}>
            <Text style={styles.historyTitle}>Recent searches</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
              {libraryState.searchHistory.map((item) => (
                <TouchableOpacity key={`${item.word}-${item.lookedUpAt}`} activeOpacity={0.82} onPress={() => selectWord(item.word)} style={styles.historyChip}>
                  <Text style={styles.historyText}>{item.word}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
      <WordHeader
        entry={selectedEntry}
        folders={libraryState.folders}
        isFavorite={isFavorite}
        isTranslationComingSoon={isTranslationComingSoon}
        languagePairLabel={`${sourceLanguage.label} to ${targetLanguage.label}`}
        note={savedWord?.note ?? ''}
        savedFolderIds={savedFolderIds}
        writingDirection={sourceLanguage.writingDirection as 'ltr' | 'rtl'}
        onSaveToFolder={handleSaveToFolder}
        onToggleFavorite={handleToggleFavorite}
      />
      <StickyTabBar tabs={TABS} activeIndex={activeIndex} onTabPress={handleTabPress} />
      <TabPager
        apiMeaning={apiMeaning}
        apiBilingualMeaning={apiBilingualMeaning}
        apiRelatedWords={apiRelatedWords}
        entry={selectedEntry}
        bilingualLookupError={bilingualLookupError}
        lookupError={lookupError}
        lookupStatus={lookupStatus}
        sourceLang={sourceLanguage.code}
        tabs={TABS}
        targetLang={targetLanguage.code}
        scrollRef={scrollRef}
        onIndexChange={setActiveIndex}
      />
      <RecognitionPrototypeModal
        error={recognitionError}
        mode={recognitionMode}
        preview={recognitionCapturePreview}
        result={recognitionResult}
        status={recognitionStatus}
        sourceLanguage={sourceLanguage}
        visible={recognitionModalOpen}
        onClose={closeRecognitionModal}
        onOpenCamera={() => setCapturePreviewVisible(true)}
        onPickImage={handlePickOcrPrototypeImage}
        onStartSpeech={handleStartSpeechPrototype}
        onStopSpeech={handleFinishSpeechPrototype}
        onUseText={handleUseRecognitionText}
      />
      <VoiceCapturePreview
        visible={capturePreviewVisible}
        onClose={() => setCapturePreviewVisible(false)}
        onCapture={handleCapture}
      />
    </View>
  );
}

function RecognitionPrototypeModal({
  error,
  mode,
  preview,
  result,
  status,
  sourceLanguage,
  visible,
  onClose,
  onOpenCamera,
  onPickImage,
  onStartSpeech,
  onStopSpeech,
  onUseText,
}: {
  error: string;
  mode: RecognitionKind;
  preview: RecognitionCapturePreview | null;
  result: RecognitionPrototypeResult | null;
  status: RecognitionStatus;
  sourceLanguage: LanguageOption;
  visible: boolean;
  onClose: () => void;
  onOpenCamera: () => void;
  onPickImage: () => void;
  onStartSpeech: () => void;
  onStopSpeech: () => void;
  onUseText: (text: string) => void;
}) {
  const isSpeechMode = mode === 'speech';
  const isBusy = status === 'requesting' || status === 'processing';

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.recognitionBackdrop}>
        <View style={styles.recognitionSheet}>
          <View style={styles.recognitionHeader}>
            <View>
              <Text style={styles.recognitionEyebrow}>{sourceLanguage.label}</Text>
              <Text style={styles.recognitionTitle}>{isSpeechMode ? 'Voice Search' : 'OCR Lookup'}</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Close recognition prototype"
              activeOpacity={0.78}
              onPress={onClose}
              style={styles.recognitionCloseButton}>
              <Ionicons name="close" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <View style={styles.recognitionStatusCard}>
            <View style={styles.recognitionStatusIcon}>
              {isBusy ? (
                <ActivityIndicator color="#0F766E" />
              ) : (
                <Ionicons
                  name={isSpeechMode ? (status === 'recording' ? 'radio-button-on' : 'mic-outline') : 'image-outline'}
                  size={24}
                  color={status === 'recording' ? '#DC2626' : '#0F766E'}
                />
              )}
            </View>
            <View style={styles.recognitionStatusCopy}>
              <Text style={styles.recognitionStatusTitle}>{getRecognitionStatusTitle(mode, status)}</Text>
              <Text style={styles.recognitionStatusText}>{getRecognitionStatusText(mode, status)}</Text>
            </View>
          </View>

          {error ? <Text style={styles.recognitionError}>{error}</Text> : null}

          {preview ? (
            <View style={styles.recognitionPreviewCard}>
              {preview.kind === 'image' ? (
                <Image source={{ uri: preview.uri }} style={styles.recognitionPreviewImage} />
              ) : (
                <View style={styles.recognitionPreviewAudio}>
                  <Ionicons name="musical-notes" size={20} color="#0F766E" />
                </View>
              )}
              <View style={styles.recognitionPreviewCopy}>
                <Text style={styles.recognitionPreviewTitle}>
                  {preview.kind === 'audio' ? 'Âm thanh đã ghi' : preview.source === 'camera' ? 'Ảnh đã chụp' : 'Ảnh đã chọn'}
                </Text>
                <Text numberOfLines={1} style={styles.recognitionPreviewMeta}>
                  {formatCapturePreviewMeta(preview)}
                </Text>
              </View>
            </View>
          ) : null}

          {result ? (
            <View style={styles.recognitionResultBlock}>
              <Text style={styles.recognitionResultLabel}>Kết quả prototype</Text>
              <Text style={styles.recognitionResultText}>{result.text}</Text>
              <Text style={styles.recognitionNotice}>{result.notice}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recognitionSuggestionRow}>
                {result.suggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    activeOpacity={0.82}
                    onPress={() => onUseText(suggestion)}
                    style={styles.recognitionSuggestionChip}>
                    <Text style={styles.recognitionSuggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.recognitionFooter}>
            {isSpeechMode ? (
              <TouchableOpacity
                accessibilityLabel={status === 'recording' ? 'Stop voice recording prototype' : 'Start voice recording prototype'}
                activeOpacity={0.84}
                disabled={isBusy}
                onPress={status === 'recording' ? onStopSpeech : onStartSpeech}
                style={[
                  styles.recognitionPrimaryButton,
                  status === 'recording' && styles.recognitionStopButton,
                  isBusy && styles.recognitionDisabledButton,
                ]}>
                <Ionicons name={status === 'recording' ? 'stop-circle' : 'mic'} size={18} color="#FFFFFF" />
                <Text style={styles.recognitionPrimaryText}>{status === 'recording' ? 'Dừng ghi' : 'Bắt đầu'}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  accessibilityLabel="Pick OCR prototype image"
                  activeOpacity={0.84}
                  disabled={isBusy}
                  onPress={onPickImage}
                  style={[styles.recognitionPrimaryButton, isBusy && styles.recognitionDisabledButton]}>
                  <Ionicons name="image" size={18} color="#FFFFFF" />
                  <Text style={styles.recognitionPrimaryText}>Chọn ảnh</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityLabel="Open OCR camera preview"
                  activeOpacity={0.82}
                  disabled={isBusy}
                  onPress={onOpenCamera}
                  style={[styles.recognitionSecondaryButton, isBusy && styles.recognitionDisabledButton]}>
                  <Ionicons name="camera" size={17} color="#0F766E" />
                  <Text style={styles.recognitionSecondaryText}>Camera</Text>
                </TouchableOpacity>
              </>
            )}
            {result ? (
              <TouchableOpacity activeOpacity={0.82} onPress={() => onUseText(result.suggestions[0] ?? result.text)} style={styles.recognitionSecondaryButton}>
                <Ionicons name="search" size={17} color="#0F766E" />
                <Text style={styles.recognitionSecondaryText}>Tra kết quả</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function LookupLanguageSelect({
  active,
  field,
  label,
  selectedLanguage,
  onPress,
  onSelect,
}: {
  active: boolean;
  field: LanguageField;
  label: string;
  selectedLanguage: LanguageOption;
  onPress: (field: LanguageField | null) => void;
  onSelect: (field: LanguageField, language: LanguageOption) => void;
}) {
  return (
    <View style={styles.languageSelectWrap}>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => onPress(active ? null : field)}
        style={[styles.languageSelect, active && styles.activeLanguageSelect]}>
        <Text style={styles.languageSelectLabel}>{label}</Text>
        <View style={styles.languageSelectValueRow}>
          <Text numberOfLines={1} style={styles.languageSelectValue}>{selectedLanguage.label}</Text>
          <Ionicons name={active ? 'chevron-up' : 'chevron-down'} size={15} color="#64748B" />
        </View>
      </TouchableOpacity>
      {active ? (
        <View style={styles.languageMenu}>
          {languageOptions.map((language) => {
            const isSelected = language.code === selectedLanguage.code;

            return (
              <TouchableOpacity
                key={`${field}-${language.code}`}
                activeOpacity={0.82}
                onPress={() => onSelect(field, language)}
                style={[styles.languageOption, isSelected && styles.activeLanguageOption]}>
                <View style={styles.languageOptionCopy}>
                  <Text style={[styles.languageOptionText, isSelected && styles.activeLanguageOptionText]}>
                    {language.label}
                  </Text>
                  <Text style={styles.languageOptionHint}>{language.hint}</Text>
                </View>
                {isSelected ? <Ionicons name="checkmark" size={16} color="#2563EB" /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function getEtymologyForEntry(
  localEntry: DictionaryEntry | undefined,
  apiMeaning: ApiMeaningResult | null,
  canUseSourceDictionaryApi: boolean,
  isBilingualLookup: boolean,
  sourceLanguageLabel: string,
  targetLanguageLabel: string
): string {
  return formatEtymologyWithAttribution(
    resolveEtymologyDisplay({
      localEtymology: localEntry?.etymology,
      sourceLanguageLabel,
      targetLanguageLabel,
      isBilingualLookup,
      hasConfiguredSource: canUseSourceDictionaryApi,
      sourceName: getEtymologySourceName(apiMeaning, sourceLanguageLabel),
    })
  );
}

function mergeLookupEntry(
  localEntry: DictionaryEntry | undefined,
  selectedWord: string,
  apiBilingualMeaning: ApiBilingualMeaningResult | null,
  apiMeaning: ApiMeaningResult | null,
  canUseSourceDictionaryApi: boolean,
  hasLocalDictionarySource: boolean,
  isBilingualSourceBlocked: boolean,
  sourceLanguageLabel: string,
  targetLanguageLabel: string
): DictionaryEntry {
  const fallbackEntry = localEntry ?? dictionaryEntries[0];
  const hasLocalEntry = Boolean(localEntry);
  const apiDefinitions = apiMeaning?.definitions.map((definition) => ({
    partOfSpeech: definition.partOfSpeech,
    meaning: definition.meaning,
    vietnamese: '',
    examples: definition.examples,
    domain: definition.domain,
    gender: definition.gender,
    level: definition.level,
  }));
  const bilingualDefinitions = apiBilingualMeaning?.definitions.map((definition) => ({
    partOfSpeech: definition.partOfSpeech,
    meaning: definition.meaning,
    vietnamese: definition.meaning,
    examples: definition.examples,
    domain: definition.domain,
    gender: definition.gender,
    level: definition.level,
  }));

  if (isBilingualSourceBlocked) {
    return createDictionaryUnavailableEntry(
      selectedWord,
      hasLocalDictionarySource,
      sourceLanguageLabel,
      targetLanguageLabel,
      `Chưa chọn nguồn dữ liệu từ điển ${sourceLanguageLabel} sang ${targetLanguageLabel} đủ tin cậy.`
    );
  }

  if (apiBilingualMeaning?.definitions.length) {
    return {
      ...fallbackEntry,
      word: apiBilingualMeaning.word,
      ipa: apiBilingualMeaning.ipa || apiMeaning?.ipa || (hasLocalEntry ? fallbackEntry.ipa : ''),
      audio: apiBilingualMeaning.audio || apiMeaning?.audio || (hasLocalEntry ? fallbackEntry.audio : ''),
      level: hasLocalEntry ? fallbackEntry.level : 'EN-VI',
      topic: 'Bilingual dictionary',
      vietnamese: apiBilingualMeaning.definitions[0]?.meaning ?? fallbackEntry.vietnamese,
      shortDefinition: apiBilingualMeaning.definitions[0]?.meaning ?? fallbackEntry.shortDefinition,
      definitions: bilingualDefinitions ?? [],
      synonyms: hasLocalEntry ? fallbackEntry.synonyms : [],
      antonyms: hasLocalEntry ? fallbackEntry.antonyms : [],
      collocations: hasLocalEntry ? fallbackEntry.collocations : [],
      idioms: hasLocalEntry ? fallbackEntry.idioms : [],
      conjugation: hasLocalEntry ? fallbackEntry.conjugation : [],
      etymology: getEtymologyForEntry(
        localEntry,
        apiMeaning,
        canUseSourceDictionaryApi,
        true,
        sourceLanguageLabel,
        targetLanguageLabel
      ),
      pronunciationTips: hasLocalEntry ? fallbackEntry.pronunciationTips : [],
    };
  }

  if (!hasLocalEntry) {
    if (!canUseSourceDictionaryApi && !apiMeaning) {
      return createDictionaryUnavailableEntry(selectedWord, hasLocalDictionarySource, sourceLanguageLabel, targetLanguageLabel);
    }

    return {
      word: apiMeaning?.word ?? selectedWord,
      ipa: apiMeaning?.ipa ?? '',
      audio: apiMeaning?.audio ?? '',
      level: sourceLanguageLabel,
      topic: 'Online dictionary',
      vietnamese: apiDefinitions?.[0]?.meaning ?? 'Chưa có nghĩa đích',
      shortDefinition: apiDefinitions?.[0]?.meaning ?? 'Live dictionary lookup.',
      definitions: apiDefinitions?.length
        ? apiDefinitions
        : [
            {
              partOfSpeech: 'lookup',
              meaning: 'Live dictionary data will appear here when available.',
              vietnamese: 'Dữ liệu tra cứu trực tuyến sẽ hiển thị khi có kết quả.',
              examples: [],
            },
          ],
      synonyms: [],
      antonyms: [],
      collocations: [],
      idioms: [],
      conjugation: [],
      etymology: getEtymologyForEntry(
        undefined,
        apiMeaning,
        canUseSourceDictionaryApi,
        false,
        sourceLanguageLabel,
        targetLanguageLabel
      ),
      pronunciationTips: [],
    };
  }

  return {
    ...fallbackEntry,
    word: apiMeaning?.word ?? selectedWord,
    ipa: apiMeaning?.ipa || fallbackEntry.ipa,
    audio: apiMeaning?.audio || fallbackEntry.audio,
    level: fallbackEntry.level,
    topic: fallbackEntry.topic,
    vietnamese: fallbackEntry.vietnamese,
    shortDefinition: apiDefinitions?.[0]?.meaning ?? fallbackEntry.shortDefinition,
    definitions: fallbackEntry.definitions,
  };
}

function getRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getEtymologySourceName(apiMeaning: ApiMeaningResult | null, sourceLanguageLabel: string) {
  const sourceName = apiMeaning?.source.split(' · ')[0];
  if (sourceName?.toLocaleLowerCase().includes('wiktionary')) {
    return sourceName;
  }

  return `${sourceLanguageLabel} Wiktionary`;
}

function getBilingualDictionaryUnavailableMessage(sourceLanguage: LanguageOption, targetLanguage: LanguageOption) {
  if (isBlockedBilingualDictionaryPair(sourceLanguage.code, targetLanguage.code)) {
    return `${sourceLanguage.label} → ${targetLanguage.label} dictionary source has not been selected yet.`;
  }

  return `Chưa có nguồn dữ liệu từ điển ${sourceLanguage.label} sang ${targetLanguage.label} đủ tin cậy.`;
}

function getRecognitionStatusTitle(mode: RecognitionKind, status: RecognitionStatus) {
  if (status === 'requesting') return 'Đang xin quyền';
  if (status === 'recording') return 'Đang ghi âm';
  if (status === 'processing') return 'Đang xử lý';
  if (status === 'ready') return mode === 'speech' ? 'Đã có transcript' : 'Đã có text OCR';
  if (status === 'error') return 'Cần thử lại';

  return mode === 'speech' ? 'Sẵn sàng ghi âm' : 'Sẵn sàng chọn ảnh';
}

function getRecognitionStatusText(mode: RecognitionKind, status: RecognitionStatus) {
  if (status === 'requesting') {
    return mode === 'speech' ? 'Kiểm tra quyền microphone trên thiết bị.' : 'Kiểm tra quyền thư viện ảnh trên thiết bị.';
  }

  if (status === 'recording') return 'Dừng ghi để tạo transcript prototype.';
  if (status === 'processing') return 'Luồng capture đã nhận dữ liệu cục bộ và đang tạo kết quả thử nghiệm.';
  if (status === 'ready') return 'Chọn một chip hoặc tra ngay kết quả đầu tiên.';
  if (status === 'error') return 'Quyền hoặc capture chưa sẵn sàng trên môi trường này.';

  return mode === 'speech'
    ? 'Prototype này chỉ giữ audio cục bộ và chưa gửi lên dịch vụ ngoài.'
    : 'Prototype này chỉ chọn ảnh cục bộ và chưa gửi lên dịch vụ ngoài.';
}

function createDictionaryUnavailableEntry(
  word: string,
  hasLocalDictionarySource: boolean,
  sourceLanguageLabel: string,
  targetLanguageLabel: string,
  customMessage?: string
): DictionaryEntry {
  const sourceMessage = customMessage ?? (hasLocalDictionarySource
    ? `Chưa có mục từ local cho "${word}".`
    : `Dữ liệu từ điển ${sourceLanguageLabel} chưa được bật.`);

  return {
    word,
    ipa: '',
    audio: '',
    level: hasLocalDictionarySource ? 'Local' : 'Soon',
    topic: hasLocalDictionarySource ? 'Từ điển' : 'Cần nguồn dữ liệu',
    vietnamese: `${sourceLanguageLabel} sang ${targetLanguageLabel}`,
    shortDefinition: sourceMessage,
    definitions: [
      {
        partOfSpeech: 'trạng thái từ điển',
        meaning: sourceMessage,
        vietnamese: 'Cần bổ sung dataset hoặc API hợp pháp để tra cứu đầy đủ ngôn ngữ này.',
        examples: [],
        domain: 'Hệ thống',
        level: hasLocalDictionarySource ? 'Preview' : 'Sắp hỗ trợ',
      },
    ],
    synonyms: [],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [],
    etymology: formatEtymologyWithAttribution(buildLocalFixtureFallback()),
    pronunciationTips: [],
  };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7F8FA',
    flex: 1,
  },
  lookupPanel: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  lookupSearchCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  inputBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#DBEAFE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
  },
  input: {
    color: '#0F172A',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  languageToggle: {
    alignItems: 'center',
    backgroundColor: '#EAF1FF',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  languageCaption: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  recognitionActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  recognitionActionButton: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  recognitionActionText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '900',
  },
  languageControls: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  languageSelectWrap: {
    flex: 1,
  },
  languageSelect: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 62,
    padding: 10,
  },
  activeLanguageSelect: {
    borderColor: '#2563EB',
  },
  languageSelectLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  languageSelectValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  languageSelectValue: {
    color: '#0F172A',
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
  },
  languageSwap: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    marginTop: 14,
    width: 34,
  },
  languageMenu: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 7,
    overflow: 'hidden',
  },
  languageOption: {
    alignItems: 'center',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  activeLanguageOption: {
    backgroundColor: '#EFF6FF',
  },
  languageOptionCopy: {
    flex: 1,
    paddingRight: 8,
  },
  languageOptionText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  activeLanguageOptionText: {
    color: '#2563EB',
  },
  languageOptionHint: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  resultRow: {
    gap: 10,
    paddingBottom: 14,
    paddingTop: 12,
  },
  resultChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 116,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  activeResultChip: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  resultWord: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  activeResultText: {
    color: '#FFFFFF',
  },
  resultMeta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  activeResultMeta: {
    color: '#BFDBFE',
  },
  apiLookupChip: {
    backgroundColor: '#102A43',
    borderRadius: 8,
    minWidth: 132,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  apiLookupTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  apiLookupMeta: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    paddingBottom: 10,
  },
  historyBlock: {
    paddingBottom: 12,
  },
  historyTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  historyRow: {
    gap: 8,
  },
  historyChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  historyText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  suggestionBlock: {
    paddingBottom: 12,
  },
  suggestionTitle: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  suggestionRow: {
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  suggestionText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
  morphologyBlock: {
    paddingBottom: 12,
  },
  morphologyTitle: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  morphologyChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 104,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  morphologyText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '900',
  },
  morphologyMeta: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  recognitionBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  recognitionSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    maxWidth: 430,
    padding: 16,
    width: '100%',
  },
  recognitionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  recognitionEyebrow: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  recognitionTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  recognitionCloseButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  recognitionStatusCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    padding: 12,
  },
  recognitionStatusIcon: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  recognitionStatusCopy: {
    flex: 1,
  },
  recognitionStatusTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  recognitionStatusText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 3,
  },
  recognitionError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 8,
    borderWidth: 1,
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: 12,
    padding: 10,
  },
  recognitionPreviewCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CCFBF1',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    padding: 10,
  },
  recognitionPreviewImage: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    height: 52,
    width: 52,
  },
  recognitionPreviewAudio: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  recognitionPreviewCopy: {
    flex: 1,
    minWidth: 0,
  },
  recognitionPreviewTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  recognitionPreviewMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  recognitionResultBlock: {
    marginTop: 14,
  },
  recognitionResultLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  recognitionResultText: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 5,
  },
  recognitionNotice: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 7,
  },
  recognitionSuggestionRow: {
    gap: 8,
    paddingTop: 12,
  },
  recognitionSuggestionChip: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  recognitionSuggestionText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '900',
  },
  recognitionFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  recognitionPrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  recognitionStopButton: {
    backgroundColor: '#DC2626',
  },
  recognitionDisabledButton: {
    opacity: 0.7,
  },
  recognitionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  recognitionSecondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#99F6E4',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  recognitionSecondaryText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '900',
  },
});
