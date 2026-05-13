import { RefObject } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

type Props = {
  tabs: string[];
  scrollRef: RefObject<ScrollView | null>;
  onIndexChange: (index: number) => void;
};

const definitions = [
  {
    type: 'noun',
    meaning: '[Language learning] A single unit of vocabulary with pronunciation, definition, and examples.',
    example: 'Example: Save this word to your IELTS folder and export it to Anki.',
  },
  {
    type: 'verb',
    meaning: '[Study action] To record, compare, and repeat pronunciation until the score improves.',
    example: 'Example: Word practice helps learners hear every phoneme clearly.',
  },
];

const phonemes = [
  { phoneme: '/w/', target: 94, user: 91, note: 'Great lip rounding' },
  { phoneme: '/ɜː/', target: 88, user: 72, note: 'Hold the vowel longer' },
  { phoneme: '/d/', target: 92, user: 86, note: 'Release more clearly' },
];

export default function TabPager({ tabs, scrollRef, onIndexChange }: Props) {
  const renderTab = (tab: string) => {
    switch (tab) {
      case 'Meaning':
        return <MeaningTab />;
      case 'Synonyms':
        return <SynonymsTab />;
      case 'Collocation & Idiom':
        return <CollocationTab />;
      case 'Conjugation':
        return <ConjugationTab />;
      case 'Etymology':
        return <EtymologyTab />;
      case 'Pronunciation':
        return <PronunciationTab />;
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

function MeaningTab() {
  return (
    <View>
      {definitions.map((item) => (
        <View key={item.type} style={styles.block}>
          <Text style={styles.heading}>{item.type}</Text>
          <Text style={styles.body}>{item.meaning}</Text>
          <Text style={styles.exampleLabel}>Example:</Text>
          <Text style={styles.body}>{item.example}</Text>
        </View>
      ))}
    </View>
  );
}

function SynonymsTab() {
  return (
    <View>
      <Text style={styles.sectionTitle}>Synonyms</Text>
      <Text style={styles.linkList}>term, expression, vocabulary item, lexical entry</Text>
      <Text style={[styles.sectionTitle, styles.spaced]}>Antonyms</Text>
      <Text style={styles.linkList}>silence, nonword, unknown item</Text>
    </View>
  );
}

function CollocationTab() {
  return (
    <View>
      <Text style={styles.sectionTitle}>Collocation</Text>
      {['look up a word', 'save a word', 'pronounce a word'].map((item) => (
        <View key={item} style={styles.smallBlock}>
          <Text style={styles.body}>{item}</Text>
          <Text style={styles.exampleLabel}>Example:</Text>
          <Text style={styles.body}>Tap a backlink to open the related dictionary entry.</Text>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Idiom</Text>
      <Text style={styles.body}>word for word</Text>
      <Text style={styles.exampleLabel}>Meaning:</Text>
      <Text style={styles.body}>Using exactly the same words as the original.</Text>
    </View>
  );
}

function ConjugationTab() {
  return (
    <View>
      {['Present simple', 'Past simple'].map((tense) => (
        <View key={tense} style={styles.tenseBlock}>
          <Text style={styles.sectionTitle}>{tense}</Text>
          <Text style={styles.body}>Formula: subject + word/words + object</Text>
          <Text style={styles.exampleLabel}>Conjugate by subject</Text>
        </View>
      ))}
    </View>
  );
}

function EtymologyTab() {
  return (
    <View>
      <Text style={styles.heading}>Origin</Text>
      <Text style={styles.body}>
        From Old English roots connected with speech, saying, and a unit of language. Etymology is
        marked as an advanced resource and can be expanded when the database is ready.
      </Text>
      <Text style={styles.exampleLabel}>Example:</Text>
      <Text style={styles.body}>Tap related roots to backlink to other entries.</Text>
    </View>
  );
}

function PronunciationTab() {
  return (
    <View>
      <Text style={styles.sectionTitle}>IPA alignment score</Text>
      <Text style={styles.body}>Record your voice to compare against the model IPA.</Text>
      <View style={styles.scoreCard}>
        <Text style={styles.score}>83</Text>
        <Text style={styles.scoreLabel}>Overall pronunciation score</Text>
      </View>
      <View style={styles.tableHeader}>
        <Text style={styles.tableCell}>Phoneme</Text>
        <Text style={styles.tableCell}>Model</Text>
        <Text style={styles.tableCell}>You</Text>
      </View>
      {phonemes.map((row) => (
        <View key={row.phoneme} style={styles.tableRow}>
          <Text style={styles.tableCell}>{row.phoneme}</Text>
          <Text style={styles.tableCell}>{row.target}%</Text>
          <Text style={styles.tableCell}>{row.user}%</Text>
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
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  block: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    fontSize: 13,
    lineHeight: 22,
  },
  exampleLabel: {
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  linkList: {
    color: '#111111',
    fontSize: 13,
    lineHeight: 22,
  },
  spaced: {
    marginTop: 110,
  },
  smallBlock: {
    marginBottom: 18,
  },
  tenseBlock: {
    marginBottom: 112,
  },
  scoreCard: {
    alignItems: 'center',
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 18,
    padding: 18,
  },
  score: {
    fontSize: 42,
    fontWeight: '800',
  },
  scoreLabel: {
    color: '#777777',
    marginTop: 4,
  },
  tableHeader: {
    backgroundColor: '#F4F4F4',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 10,
  },
  tableRow: {
    borderBottomColor: '#EFEFEF',
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 12,
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  note: {
    color: '#666666',
    flexBasis: '100%',
    fontSize: 12,
    marginTop: 6,
  },
});
