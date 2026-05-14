import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import StickyTabBar from '@/components/word/StickyTabBar';
import TabPager from '@/components/word/TabPager';
import WordHeader from '@/components/word/WordHeader';
import { DictionaryEntry, dictionaryEntries } from '@/data/dictionary';
import { ApiMeaningResult, ApiRelatedWords, fetchEnglishMeaning, fetchEnglishRelatedWords } from '@/data/dictionaryApi';
import { getLanguageByCode, isEnglishDictionaryPair } from '@/data/languages';
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

export default function WordScreen() {
  const params = useLocalSearchParams<{ word?: string; sourceLang?: string; targetLang?: string }>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState(dictionaryEntries[0].word);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [lookupError, setLookupError] = useState('');
  const [apiMeaning, setApiMeaning] = useState<ApiMeaningResult | null>(null);
  const [apiRelatedWords, setApiRelatedWords] = useState<ApiRelatedWords | null>(null);
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const sourceLanguage = getLanguageByCode(getRouteParam(params.sourceLang), 'en');
  const targetLanguage = getLanguageByCode(getRouteParam(params.targetLang), 'vi');
  const canUseEnglishLookup = sourceLanguage.code === 'en';
  const isTranslationComingSoon = !isEnglishDictionaryPair(sourceLanguage.code, targetLanguage.code);

  const localEntry = dictionaryEntries.find((entry) => entry.word === selectedWord);
  const selectedEntry = useMemo(
    () => mergeApiEntry(localEntry, selectedWord, apiMeaning, canUseEnglishLookup, sourceLanguage.label, targetLanguage.label),
    [apiMeaning, canUseEnglishLookup, localEntry, selectedWord, sourceLanguage.label, targetLanguage.label]
  );

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return dictionaryEntries.filter((entry) => {
      const searchable = [
        entry.word,
        entry.ipa,
        entry.topic,
        entry.level,
        entry.vietnamese,
        entry.shortDefinition,
        ...entry.synonyms,
        ...entry.collocations,
      ].join(' ').toLowerCase();

      return searchable.includes(normalized);
    });
  }, [query]);

  const normalizedQuery = query.trim().toLowerCase();
  const shouldShowApiLookup = Boolean(normalizedQuery) && !results.some((entry) => entry.word.toLowerCase() === normalizedQuery);
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
    const normalizedRouteWord = routeWord?.trim().toLowerCase();
    if (!normalizedRouteWord || normalizedRouteWord === selectedWord) return;

    setSelectedWord(normalizedRouteWord);
    setQuery('');
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [params.word, selectedWord]);

  useEffect(() => {
    let isCancelled = false;

    async function lookupWord() {
      if (!canUseEnglishLookup) {
        setLookupStatus('idle');
        setLookupError('');
        setApiMeaning(null);
        setApiRelatedWords(null);
        return;
      }

      setLookupStatus('loading');
      setLookupError('');
      setApiMeaning(null);
      setApiRelatedWords(null);

      const [meaningResult, relatedWordsResult] = await Promise.allSettled([
        fetchEnglishMeaning(selectedWord),
        fetchEnglishRelatedWords(selectedWord),
      ]);

      if (isCancelled) return;

      if (meaningResult.status === 'fulfilled') {
        setApiMeaning(meaningResult.value);
      }

      if (relatedWordsResult.status === 'fulfilled') {
        setApiRelatedWords(relatedWordsResult.value);
      }

      if (meaningResult.status === 'fulfilled' || relatedWordsResult.status === 'fulfilled') {
        setLookupStatus('ready');
        return;
      }

      const error = meaningResult.reason ?? relatedWordsResult.reason;
      setLookupStatus('error');
      setLookupError(error instanceof Error ? error.message : 'Could not load dictionary data.');
    }

    lookupWord();

    return () => {
      isCancelled = true;
    };
  }, [canUseEnglishLookup, selectedWord]);

  useEffect(() => {
    if (!libraryLoaded) return;

    addSearchHistory(libraryState, selectedWord).then(setLibraryState);
    // Only record a new history row when the selected lookup word changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryLoaded, selectedWord]);

  const selectWord = (word: string) => {
    const trimmedWord = word.trim().toLowerCase();
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

  return (
    <View style={styles.container}>
      <View style={styles.lookupPanel}>
        <View style={styles.inputBox}>
          <Ionicons name="search" size={22} color="#2563EB" />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            placeholder="Tìm word, nghĩa, topic..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => selectWord(query)}
            style={styles.input}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
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
          </ScrollView>
        ) : null}
        {query && results.length === 0 && !shouldShowApiLookup ? <Text style={styles.emptyText}>Nhập từ tiếng Anh rồi nhấn Search.</Text> : null}
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
        apiRelatedWords={apiRelatedWords}
        entry={selectedEntry}
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

function mergeApiEntry(
  localEntry: DictionaryEntry | undefined,
  selectedWord: string,
  apiMeaning: ApiMeaningResult | null,
  canUseEnglishLookup: boolean,
  sourceLanguageLabel: string,
  targetLanguageLabel: string
): DictionaryEntry {
  if (!canUseEnglishLookup) {
    return createTranslationComingSoonEntry(selectedWord, sourceLanguageLabel, targetLanguageLabel);
  }

  const fallbackEntry = localEntry ?? dictionaryEntries[0];
  const hasLocalEntry = Boolean(localEntry);
  const apiDefinitions = apiMeaning?.definitions.map((definition) => ({
    partOfSpeech: definition.partOfSpeech,
    meaning: definition.meaning,
    vietnamese: '',
    examples: definition.examples,
  }));

  if (!hasLocalEntry) {
    return {
      word: apiMeaning?.word ?? selectedWord,
      ipa: apiMeaning?.ipa ?? '',
      audio: apiMeaning?.audio ?? '',
      level: 'EN',
      topic: 'Live lookup',
      vietnamese: 'English dictionary result',
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
    definitions: apiDefinitions?.length ? apiDefinitions : fallbackEntry.definitions,
  };
}

function getRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function createTranslationComingSoonEntry(word: string, sourceLanguageLabel: string, targetLanguageLabel: string): DictionaryEntry {
  return {
    word,
    ipa: '',
    audio: '',
    level: 'Soon',
    topic: 'Translation',
    vietnamese: `${sourceLanguageLabel} to ${targetLanguageLabel}`,
    shortDefinition: 'Multilingual translation is coming soon.',
    definitions: [
      {
        partOfSpeech: 'translation',
        meaning: `Translation from ${sourceLanguageLabel} to ${targetLanguageLabel} is not enabled yet.`,
        vietnamese: 'Tính năng dịch đa ngôn ngữ sẽ được triển khai ở phase sau.',
        examples: [],
      },
    ],
    synonyms: [],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [],
    etymology: 'Etymology is available for English dictionary entries only in this MVP.',
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
  inputBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
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
});
