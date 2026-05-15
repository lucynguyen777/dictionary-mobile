import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import StickyTabBar from '@/components/word/StickyTabBar';
import TabPager from '@/components/word/TabPager';
import WordHeader from '@/components/word/WordHeader';
import { DictionaryEntry, dictionaryEntries } from '@/data/dictionary';
import {
  ApiBilingualMeaningResult,
  ApiMeaningResult,
  ApiRelatedWords,
  fetchBilingualMeaning,
  fetchEnglishMeaning,
  fetchEnglishRelatedWords,
} from '@/data/dictionaryApi';
import { LanguageOption, getLanguageByCode, isTranslationComingSoonPair, languageOptions } from '@/data/languages';
import {
  findLocalDictionaryEntry,
  getLocalDictionaryEntries,
  getSpellingSuggestions,
  normalizeLookupTerm,
  supportsLocalDictionary,
} from '@/data/localLexicon';
import { getMorphologyCandidates } from '@/data/morphology';
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

const { width } = Dimensions.get('window');

const TABS = ['Meaning', 'Synonyms', 'Collocation & Idiom', 'Conjugation', 'Etymology', 'Pronunciation'];

type LookupStatus = 'idle' | 'loading' | 'ready' | 'error';
type LanguageField = 'source' | 'target';

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
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [showLanguageControls, setShowLanguageControls] = useState(false);
  const [activeLanguageField, setActiveLanguageField] = useState<LanguageField | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const sourceLanguage = getLanguageByCode(getRouteParam(params.sourceLang), 'en');
  const targetLanguage = getLanguageByCode(getRouteParam(params.targetLang), 'vi');
  const canUseEnglishApi = sourceLanguage.code === 'en';
  const shouldUseBilingualDictionary = sourceLanguage.code !== targetLanguage.code;
  const hasLocalDictionarySource = supportsLocalDictionary(sourceLanguage.code);
  const isTranslationComingSoon = isTranslationComingSoonPair(sourceLanguage.code, targetLanguage.code);
  const sourceEntries = useMemo(() => getLocalDictionaryEntries(sourceLanguage.code), [sourceLanguage.code]);

  const localEntry = findLocalDictionaryEntry(sourceLanguage.code, selectedWord);
  const selectedEntry = useMemo(
    () =>
      mergeLookupEntry(
        localEntry,
        selectedWord,
        apiBilingualMeaning,
        apiMeaning,
        canUseEnglishApi,
        hasLocalDictionarySource,
        sourceLanguage.label,
        targetLanguage.label
      ),
    [
      apiMeaning,
      apiBilingualMeaning,
      canUseEnglishApi,
      hasLocalDictionarySource,
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
  const morphologySuggestions = useMemo(() => {
    if (!query || results.length > 0) return [];
    return getMorphologyCandidates(sourceLanguage.code, query);
  }, [query, results.length, sourceLanguage.code]);

  const normalizedQuery = normalizeLookupTerm(query);
  const hasExactLocalResult = results.some((entry) => normalizeLookupTerm(entry.word) === normalizedQuery);
  const shouldShowApiLookup = Boolean(normalizedQuery) && canUseEnglishApi && !hasExactLocalResult;
  const shouldShowLocalLookup = Boolean(normalizedQuery) && !canUseEnglishApi && !hasExactLocalResult;
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
      if (!canUseEnglishApi && !shouldUseBilingualDictionary) {
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
      setBilingualLookupError('');
      setApiMeaning(null);
      setApiBilingualMeaning(null);
      setApiRelatedWords(null);

      const lookupTasks = [
        canUseEnglishApi ? fetchEnglishMeaning(selectedWord) : Promise.resolve(null),
        canUseEnglishApi ? fetchEnglishRelatedWords(selectedWord) : Promise.resolve(null),
        shouldUseBilingualDictionary
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
  }, [canUseEnglishApi, selectedWord, shouldUseBilingualDictionary, sourceLanguage.code, targetLanguage.code]);

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
              style={styles.input}
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
                <Text style={styles.apiLookupMeta}>English API</Text>
              </TouchableOpacity>
            ) : null}
            {shouldShowLocalLookup ? (
              <TouchableOpacity activeOpacity={0.82} onPress={() => selectWord(query)} style={styles.apiLookupChip}>
                <Text style={styles.apiLookupTitle}>Tra {query.trim()}</Text>
                <Text style={styles.apiLookupMeta}>{sourceLanguage.label} dictionary</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        ) : null}
        {query && results.length === 0 && !shouldShowApiLookup && !shouldShowLocalLookup && spellingSuggestions.length === 0 ? (
          <Text style={styles.emptyText}>Nhập từ thuộc ngôn ngữ gốc rồi nhấn tìm kiếm.</Text>
        ) : null}
        {query && results.length === 0 && spellingSuggestions.length > 0 ? (
          <View style={styles.suggestionBlock}>
            <Text style={styles.suggestionTitle}>Có phải ý bạn là:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
              {spellingSuggestions.map((suggestion) => (
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
    </View>
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

function mergeLookupEntry(
  localEntry: DictionaryEntry | undefined,
  selectedWord: string,
  apiBilingualMeaning: ApiBilingualMeaningResult | null,
  apiMeaning: ApiMeaningResult | null,
  canUseEnglishApi: boolean,
  hasLocalDictionarySource: boolean,
  sourceLanguageLabel: string,
  targetLanguageLabel: string
): DictionaryEntry {
  if (!canUseEnglishApi && !localEntry) {
    return createDictionaryUnavailableEntry(selectedWord, hasLocalDictionarySource, sourceLanguageLabel, targetLanguageLabel);
  }

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
      etymology: hasLocalEntry ? fallbackEntry.etymology : 'Etymology is available for monolingual entries only.',
      pronunciationTips: hasLocalEntry ? fallbackEntry.pronunciationTips : [],
    };
  }

  if (!hasLocalEntry) {
    return {
      word: apiMeaning?.word ?? selectedWord,
      ipa: apiMeaning?.ipa ?? '',
      audio: apiMeaning?.audio ?? '',
      level: 'EN',
      topic: 'General meaning',
      vietnamese: 'Chưa có nghĩa tiếng Việt',
      shortDefinition: apiDefinitions?.[0]?.meaning ?? 'Live English dictionary lookup.',
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
      etymology: 'Etymology needs a selected production resource for non-seed words.',
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

function createDictionaryUnavailableEntry(
  word: string,
  hasLocalDictionarySource: boolean,
  sourceLanguageLabel: string,
  targetLanguageLabel: string
): DictionaryEntry {
  const sourceMessage = hasLocalDictionarySource
    ? `Chưa có mục từ local cho "${word}".`
    : `Dữ liệu từ điển ${sourceLanguageLabel} chưa được bật.`;

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
    etymology: 'Trong MVP này, etymology chỉ có cho một số mục từ tiếng Anh.',
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
});
