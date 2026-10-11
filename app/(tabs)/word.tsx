import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Touchable from '@/components/app/Touchable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LanguageSelect, { getUnavailableLanguageMessage } from '@/components/app/LanguageSelect';
import StickyTabBar from '@/components/word/StickyTabBar';
import TabPager from '@/components/word/TabPager';
import WordHeader from '@/components/word/WordHeader';
import { lookupMonolingual, lookupRelatedWords } from '@/data/adapterRegistry';
import { dictionaryEntries } from '@/data/dictionary';
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
import { detectLookupSourceLanguage, type LookupLanguageDetection } from '@/data/languageDetection';
import { LanguageOption, getLanguageByCode, isTranslationComingSoonPair } from '@/data/languages';
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
import { useToken } from '@/hooks/use-token';
import RecognitionLookupSheet, { type RecognitionMode } from '@/components/word/RecognitionLookupSheet';
import { NATIVE_RECOGNITION_ENABLED } from '@/constants/featureFlags';
import LookupSuggestions from '@/components/word/LookupSuggestions';
import { createWordStyles } from '@/components/word/wordStyles';
import { getBilingualDictionaryUnavailableMessage, getRouteParam, mergeLookupEntry } from '@/data/wordLookupEntry';
import AppButton from '@/components/app/AppButton';
import { describeLookupError } from '@/data/lookupErrors';

const TABS = ['Meaning', 'Synonyms', 'Collocation & Idiom', 'Conjugation', 'Etymology', 'Pronunciation'];

type LookupStatus = 'idle' | 'loading' | 'ready' | 'error';
type LanguageField = 'source' | 'target';

export default function WordScreen() {
  const insets = useSafeAreaInsets();
  // Must match TabPager's page width, which follows rotation and web resizes.
  const { width } = useWindowDimensions();
  const token = useToken();
  const styles = useMemo(() => createWordStyles(token), [token]);
  const { colors } = token;
  const params = useLocalSearchParams<{ word?: string; sourceLang?: string; targetLang?: string }>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState(dictionaryEntries[0].word);
  const [recognitionMode, setRecognitionMode] = useState<RecognitionMode | null>(null);
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
  const [detectedLanguage, setDetectedLanguage] = useState<LookupLanguageDetection | null>(null);
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

    loadLibraryState()
      .then((state) => {
        if (isMounted) setLibraryState(state);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setLibraryLoaded(true);
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
      setLookupError(describeLookupError(error, selectedWord, sourceLanguage.label));
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
    sourceLanguage.label,
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

    const detection = detectLookupSourceLanguage(trimmedWord, sourceLanguage.code);
    if (detection.confidence === 'high' && detection.languageCode !== sourceLanguage.code) {
      const nextLanguage = getLanguageByCode(detection.languageCode, sourceLanguage.code);
      if (nextLanguage.dictionaryStatus !== 'unavailable') {
        router.setParams({
          sourceLang: nextLanguage.code,
          targetLang: targetLanguage.code,
        });
        setDetectedLanguage(detection);
        setShowLanguageControls(true);
      }
    } else if (detection.confidence === 'low') {
      setDetectedLanguage(null);
    }

    setSelectedWord(trimmedWord);
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: true });
  };

  const handleToggleFavorite = () => {
    toggleFavoriteWord(libraryState, selectedEntry)
      .then(setLibraryState)
      .catch(() => Alert.alert('Chưa lưu được', 'Không thể cập nhật mục yêu thích lúc này. Thử lại sau.'));
  };

  const handleSaveToFolder = (folderId: string, note: string) => {
    saveWordToFolder(libraryState, selectedEntry, folderId, note)
      .then(setLibraryState)
      .catch(() => Alert.alert('Chưa lưu được', 'Không thể lưu từ vào bộ từ lúc này. Thử lại sau.'));
  };

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    scrollRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
  };

  const handleLanguageSelect = (field: LanguageField, language: LanguageOption) => {
    if (language.dictionaryStatus === 'unavailable') {
      showFutureFeatureNotice(getUnavailableLanguageMessage(language));
      return;
    }

    router.setParams({
      sourceLang: field === 'source' ? language.code : sourceLanguage.code,
      targetLang: field === 'target' ? language.code : targetLanguage.code,
    });
    setActiveLanguageField(null);
    setShowLanguageControls(true);
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  };

  const showFutureFeatureNotice = (message: string) => {
    Alert.alert('Cập nhật trong phiên bản sau', message);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.lookupPanel}>
        <View style={styles.lookupSearchCard}>
          <View style={styles.inputBox}>
            <Ionicons name="search" size={22} color={colors.accentPrimary} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              placeholder="Tìm từ, nghĩa, chủ đề..."
              placeholderTextColor={colors.textTertiary}
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
              <Touchable
                accessibilityLabel="Xóa nội dung tìm kiếm"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </Touchable>
            ) : null}
            <Touchable
              accessibilityLabel="Chọn ngôn ngữ tra cứu"
              accessibilityState={{ expanded: showLanguageControls }}
              activeOpacity={0.78}
              onPress={() => setShowLanguageControls((value) => !value)}
              style={styles.languageToggle}>
              <Ionicons name="language-outline" size={18} color={colors.accentPrimary} />
            </Touchable>
          </View>
          {showLanguageControls ? (
            <Text style={styles.languageCaption}>
              Đang tra: {sourceLanguage.label} → {targetLanguage.label}
            </Text>
          ) : null}
          {detectedLanguage ? (
            <View style={styles.detectedLanguageChip}>
              <Ionicons name="sparkles-outline" size={14} color={colors.accentPrimary} />
              <Text style={styles.detectedLanguageText}>
                Đã nhận diện: {getLanguageByCode(detectedLanguage.languageCode, sourceLanguage.code).label}
              </Text>
              <Touchable
                accessibilityLabel="Hoàn tác ngôn ngữ đã nhận diện"
                activeOpacity={0.75}
                hitSlop={12}
                onPress={() => {
                  setDetectedLanguage(null);
                  router.setParams({ sourceLang: sourceLanguage.code, targetLang: targetLanguage.code });
                }}>
                <Text style={styles.detectedLanguageUndo}>Hoàn tác</Text>
              </Touchable>
            </View>
          ) : null}
          {showLanguageControls && NATIVE_RECOGNITION_ENABLED ? (
            <View style={styles.recognitionActionRow}>
              <AppButton accessibilityLabel="Tìm bằng giọng nói" icon="mic-outline" label="Voice" onPress={() => setRecognitionMode('voice')} />
              <AppButton accessibilityLabel="Tra cứu qua ảnh (OCR)" icon="scan-outline" label="OCR" onPress={() => setRecognitionMode('ocr')} />
            </View>
          ) : showLanguageControls ? (
            <View style={styles.recognitionActionRow}>
              <AppButton
                accessibilityLabel="Tìm bằng giọng nói: cập nhật trong phiên bản sau"
                icon="time-outline"
                label="Voice"
                onPress={() => showFutureFeatureNotice('Voice Search cần dev-client/native STT và kiểm thử quyền microphone trước khi mở production.')}
                style={styles.futureRecognitionButton}
              />
              <AppButton
                accessibilityLabel="Tra cứu qua ảnh (OCR): cập nhật trong phiên bản sau"
                icon="time-outline"
                label="OCR"
                onPress={() => showFutureFeatureNotice('OCR Camera Lookup cần dev-client/native OCR engine và dữ liệu kiểm thử ảnh trước khi mở production.')}
                style={styles.futureRecognitionButton}
              />
            </View>
          ) : null}
          {showLanguageControls ? (
            <Text style={styles.futureRecognitionHint}>
              {NATIVE_RECOGNITION_ENABLED ? 'Voice/OCR: bản thử nghiệm dev-client, nhận dạng trên thiết bị' : 'Voice/OCR: Cập nhật trong phiên bản sau · Cần dev-client'}
            </Text>
          ) : null}
          {showLanguageControls ? (
            <View style={styles.languageControls}>
              <LanguageSelect
                active={activeLanguageField === 'source'}
                label="Ngôn ngữ gốc"
                selectedLanguage={sourceLanguage}
                onToggle={() => setActiveLanguageField((current) => (current === 'source' ? null : 'source'))}
                onSelect={(language) => handleLanguageSelect('source', language)}
              />
              <View style={styles.languageSwap}>
                <Ionicons name="swap-horizontal" size={17} color={colors.textSecondary} />
              </View>
              <LanguageSelect
                active={activeLanguageField === 'target'}
                label="Tra / dịch sang"
                selectedLanguage={targetLanguage}
                onToggle={() => setActiveLanguageField((current) => (current === 'target' ? null : 'target'))}
                onSelect={(language) => handleLanguageSelect('target', language)}
              />
            </View>
          ) : null}
        </View>
        {query ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.resultRow}>
            {results.map((entry) => {
              const isSelected = entry.word === selectedEntry.word;

              return (
                <Touchable
                  key={entry.word}
                  activeOpacity={0.82}
                  onPress={() => selectWord(entry.word)}
                  style={[styles.resultChip, isSelected && styles.activeResultChip]}>
                  <Text style={[styles.resultWord, isSelected && styles.activeResultText]}>{entry.word}</Text>
                  <Text style={[styles.resultMeta, isSelected && styles.activeResultMeta]}>{entry.level} · {entry.topic}</Text>
                </Touchable>
              );
            })}
            {shouldShowApiLookup ? (
              <Touchable activeOpacity={0.82} onPress={() => selectWord(query)} style={styles.apiLookupChip}>
                <Text style={styles.apiLookupTitle}>Tra {query.trim()}</Text>
                <Text style={styles.apiLookupMeta}>
                  {isBilingualSourceBlocked ? 'Cập nhật sau' : `${sourceLanguage.label} dictionary`}
                </Text>
              </Touchable>
            ) : null}
          </ScrollView>
        ) : null}
        <LookupSuggestions
          hasResults={results.length > 0}
          morphologySuggestions={morphologySuggestions}
          onSelect={selectWord}
          query={query}
          searchHistory={libraryState.searchHistory}
          showApiLookup={shouldShowApiLookup}
          spellingSuggestions={allSpellingSuggestions}
          styles={styles}
        />
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
      {NATIVE_RECOGNITION_ENABLED ? (
        <RecognitionLookupSheet
          languageCode={sourceLanguage.code}
          mode={recognitionMode}
          onClose={() => setRecognitionMode(null)}
          onSelectWord={(word) => {
            setRecognitionMode(null);
            selectWord(word);
          }}
        />
      ) : null}
    </View>
  );
}
