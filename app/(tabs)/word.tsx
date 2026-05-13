import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import StickyTabBar from '@/components/word/StickyTabBar';
import TabPager from '@/components/word/TabPager';
import WordHeader from '@/components/word/WordHeader';
import { dictionaryEntries } from '@/data/dictionary';

const { width } = Dimensions.get('window');

const TABS = ['Meaning', 'Synonyms', 'Collocation & Idiom', 'Conjugation', 'Etymology', 'Pronunciation'];

export default function WordScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState(dictionaryEntries[0].word);
  const scrollRef = useRef<ScrollView | null>(null);

  const selectedEntry = dictionaryEntries.find((entry) => entry.word === selectedWord) ?? dictionaryEntries[0];

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return dictionaryEntries;

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
            placeholder="Tìm word, nghĩa, topic..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            style={styles.input}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.resultRow}>
          {results.map((entry) => {
            const isSelected = entry.word === selectedEntry.word;

            return (
              <TouchableOpacity
                key={entry.word}
                activeOpacity={0.82}
                onPress={() => {
                  setSelectedWord(entry.word);
                  setActiveIndex(0);
                  scrollRef.current?.scrollTo({ x: 0, animated: true });
                }}
                style={[styles.resultChip, isSelected && styles.activeResultChip]}>
                <Text style={[styles.resultWord, isSelected && styles.activeResultText]}>{entry.word}</Text>
                <Text style={[styles.resultMeta, isSelected && styles.activeResultMeta]}>{entry.level} · {entry.topic}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {results.length === 0 ? <Text style={styles.emptyText}>Chưa có từ phù hợp trong bộ dữ liệu mẫu.</Text> : null}
      </View>
      <WordHeader entry={selectedEntry} />
      <StickyTabBar tabs={TABS} activeIndex={activeIndex} onTabPress={handleTabPress} />
      <TabPager entry={selectedEntry} tabs={TABS} scrollRef={scrollRef} onIndexChange={setActiveIndex} />
    </View>
  );
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
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    paddingBottom: 10,
  },
});
