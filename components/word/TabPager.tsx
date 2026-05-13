import { RefObject } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DictionaryEntry } from '@/data/dictionary';

const { width } = Dimensions.get('window');

type Props = {
  entry: DictionaryEntry;
  tabs: string[];
  scrollRef: RefObject<ScrollView | null>;
  onIndexChange: (index: number) => void;
};

export default function TabPager({ entry, tabs, scrollRef, onIndexChange }: Props) {
  const renderTab = (tab: string) => {
    switch (tab) {
      case 'Meaning':
        return <MeaningTab entry={entry} />;
      case 'Synonyms':
        return <SynonymsTab entry={entry} />;
      case 'Collocation & Idiom':
        return <CollocationTab entry={entry} />;
      case 'Conjugation':
        return <ConjugationTab entry={entry} />;
      case 'Etymology':
        return <EtymologyTab entry={entry} />;
      case 'Pronunciation':
        return <PronunciationTab entry={entry} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={(e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        onIndexChange(index);
      }}>
      {tabs.map((tab) => (
        <View key={tab} style={styles.page}>
          <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
            {renderTab(tab)}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

function MeaningTab({ entry }: { entry: DictionaryEntry }) {
  return (
    <View>
      {entry.definitions.map((item) => (
        <View key={item.partOfSpeech} style={styles.block}>
          <Text style={styles.heading}>{item.partOfSpeech}</Text>
          <Text style={styles.body}>{item.meaning}</Text>
          <Text style={styles.translation}>{item.vietnamese}</Text>
          <Text style={styles.exampleLabel}>Examples</Text>
          {item.examples.map((example) => (
            <Text key={example} style={styles.example}>- {example}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function SynonymsTab({ entry }: { entry: DictionaryEntry }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Synonyms</Text>
      <View style={styles.chipWrap}>
        {entry.synonyms.map((item) => <Text key={item} style={styles.chip}>{item}</Text>)}
      </View>
      <Text style={[styles.sectionTitle, styles.mediumSpace]}>Antonyms</Text>
      <View style={styles.chipWrap}>
        {entry.antonyms.map((item) => <Text key={item} style={styles.ghostChip}>{item}</Text>)}
      </View>
    </View>
  );
}

function CollocationTab({ entry }: { entry: DictionaryEntry }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Collocation</Text>
      {entry.collocations.map((item) => (
        <View key={item} style={styles.smallBlock}>
          <Text style={styles.collocation}>{item}</Text>
          <Text style={styles.exampleLabel}>Example:</Text>
          <Text style={styles.body}>Use this phrase in a sentence and save it to your daily review.</Text>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Idiom</Text>
      {entry.idioms.map((item) => (
        <View key={item.phrase} style={styles.smallBlock}>
          <Text style={styles.collocation}>{item.phrase}</Text>
          <Text style={styles.body}>{item.meaning}</Text>
        </View>
      ))}
    </View>
  );
}

function ConjugationTab({ entry }: { entry: DictionaryEntry }) {
  return (
    <View>
      {entry.conjugation.map((item) => (
        <View key={item.tense} style={styles.tenseBlock}>
          <Text style={styles.sectionTitle}>{item.tense}</Text>
          <Text style={styles.body}>{item.form}</Text>
        </View>
      ))}
    </View>
  );
}

function EtymologyTab({ entry }: { entry: DictionaryEntry }) {
  return (
    <View>
      <Text style={styles.heading}>Origin</Text>
      <Text style={styles.body}>{entry.etymology}</Text>
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Learning note</Text>
        <Text style={styles.body}>Connect the origin with a modern collocation to make this word easier to recall.</Text>
      </View>
    </View>
  );
}

function PronunciationTab({ entry }: { entry: DictionaryEntry }) {
  const average = Math.round(
    entry.pronunciationTips.reduce((total, item) => total + item.learner, 0) / entry.pronunciationTips.length
  );

  return (
    <View>
      <Text style={styles.sectionTitle}>IPA alignment score</Text>
      <Text style={styles.body}>Record your voice and compare each sound with the model IPA.</Text>
      <View style={styles.scoreCard}>
        <Text style={styles.score}>{average}</Text>
        <Text style={styles.scoreLabel}>Overall pronunciation score</Text>
      </View>
      <View style={styles.tableHeader}>
        <Text style={styles.tableCell}>Phoneme</Text>
        <Text style={styles.tableCell}>Model</Text>
        <Text style={styles.tableCell}>You</Text>
      </View>
      {entry.pronunciationTips.map((row) => (
        <View key={row.phoneme} style={styles.tableRow}>
          <Text style={styles.tableCell}>{row.phoneme}</Text>
          <Text style={styles.tableCell}>{row.model}%</Text>
          <Text style={styles.tableCell}>{row.learner}%</Text>
          <Text style={styles.note}>{row.note}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width,
  },
  pageContent: {
    paddingBottom: 32,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  block: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  heading: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  body: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
  },
  translation: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 10,
  },
  exampleLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  example: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#EAF1FF',
    borderRadius: 999,
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediumSpace: {
    marginTop: 28,
  },
  smallBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
  },
  collocation: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
  },
  tenseBlock: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  noteCard: {
    backgroundColor: '#EAF8F0',
    borderRadius: 8,
    marginTop: 18,
    padding: 16,
  },
  noteTitle: {
    color: '#166534',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: '#102A43',
    borderRadius: 8,
    marginVertical: 18,
    padding: 18,
  },
  score: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
  },
  scoreLabel: {
    color: '#BFDBFE',
    marginTop: 4,
  },
  tableHeader: {
    backgroundColor: '#EAF1FF',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 10,
  },
  tableRow: {
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 12,
  },
  tableCell: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  note: {
    color: '#64748B',
    flexBasis: '100%',
    fontSize: 12,
    marginTop: 6,
  },
});
