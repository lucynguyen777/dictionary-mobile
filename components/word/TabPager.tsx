import { RefObject } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DictionaryEntry } from '@/data/dictionary';
import { ApiMeaningResult, ApiRelatedWords } from '@/data/dictionaryApi';

const { width } = Dimensions.get('window');

type Props = {
  apiMeaning: ApiMeaningResult | null;
  apiRelatedWords: ApiRelatedWords | null;
  entry: DictionaryEntry;
  lookupError: string;
  lookupStatus: 'idle' | 'loading' | 'ready' | 'error';
  tabs: string[];
  scrollRef: RefObject<ScrollView | null>;
  onIndexChange: (index: number) => void;
};

export default function TabPager({
  apiMeaning,
  apiRelatedWords,
  entry,
  lookupError,
  lookupStatus,
  tabs,
  scrollRef,
  onIndexChange,
}: Props) {
  const renderTab = (tab: string) => {
    switch (tab) {
      case 'Meaning':
        return <MeaningTab apiMeaning={apiMeaning} entry={entry} lookupError={lookupError} lookupStatus={lookupStatus} />;
      case 'Synonyms':
        return (
          <SynonymsTab
            apiMeaning={apiMeaning}
            apiRelatedWords={apiRelatedWords}
            entry={entry}
            lookupError={lookupError}
            lookupStatus={lookupStatus}
          />
        );
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
      directionalLockEnabled
      horizontal
      keyboardShouldPersistTaps="handled"
      pagingEnabled
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      style={styles.pager}
      onMomentumScrollEnd={(e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        onIndexChange(index);
      }}>
      {tabs.map((tab) => (
        <View key={tab} style={styles.page}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
            style={styles.pageScroll}>
            {renderTab(tab)}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

function MeaningTab({
  apiMeaning,
  entry,
  lookupError,
  lookupStatus,
}: {
  apiMeaning: ApiMeaningResult | null;
  entry: DictionaryEntry;
  lookupError: string;
  lookupStatus: Props['lookupStatus'];
}) {
  const definitions = apiMeaning?.definitions.length ? apiMeaning.definitions : entry.definitions.map((definition) => ({
    partOfSpeech: definition.partOfSpeech,
    meaning: definition.meaning,
    examples: definition.examples,
    synonyms: [],
    antonyms: [],
  }));

  return (
    <View>
      <LookupBanner
        error={lookupError}
        source={apiMeaning?.source}
        status={lookupStatus}
        successText="Meaning loaded from live English dictionary data."
      />
      {definitions.map((item, index) => (
        <View key={`${item.partOfSpeech}-${item.meaning}-${index}`} style={styles.block}>
          <Text style={styles.heading}>{item.partOfSpeech}</Text>
          <Text style={styles.body}>{item.meaning}</Text>
          {item.examples.length ? (
            <>
              <Text style={styles.exampleLabel}>Examples</Text>
              {item.examples.map((example) => (
                <Text key={example} style={styles.example}>- {example}</Text>
              ))}
            </>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function SynonymsTab({
  apiMeaning,
  apiRelatedWords,
  entry,
  lookupError,
  lookupStatus,
}: {
  apiMeaning: ApiMeaningResult | null;
  apiRelatedWords: ApiRelatedWords | null;
  entry: DictionaryEntry;
  lookupError: string;
  lookupStatus: Props['lookupStatus'];
}) {
  const apiSynonyms = apiMeaning?.definitions.flatMap((definition) => definition.synonyms) ?? [];
  const apiAntonyms = apiMeaning?.definitions.flatMap((definition) => definition.antonyms) ?? [];
  const synonyms = uniqueWords([...(apiRelatedWords?.synonyms ?? []), ...apiSynonyms, ...entry.synonyms]);
  const antonyms = uniqueWords([...(apiRelatedWords?.antonyms ?? []), ...apiAntonyms, ...entry.antonyms]);

  return (
    <View>
      <LookupBanner
        error={lookupError}
        source={apiRelatedWords ? 'Datamuse + dictionaryapi.dev' : undefined}
        status={lookupStatus}
        successText="Related words loaded from live English lexical APIs."
      />
      <Text style={styles.sectionTitle}>Synonyms</Text>
      <View style={styles.chipWrap}>
        {synonyms.length ? synonyms.map((item) => <Text key={item} style={styles.chip}>{item}</Text>) : <EmptyState text="No synonyms found yet." />}
      </View>
      <Text style={[styles.sectionTitle, styles.mediumSpace]}>Antonyms</Text>
      <View style={styles.chipWrap}>
        {antonyms.length ? antonyms.map((item) => <Text key={item} style={styles.ghostChip}>{item}</Text>) : <EmptyState text="No antonyms found yet." />}
      </View>
    </View>
  );
}

function LookupBanner({
  error,
  source,
  status,
  successText,
}: {
  error: string;
  source?: string;
  status: Props['lookupStatus'];
  successText: string;
}) {
  if (status === 'loading') {
    return (
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Loading live data</Text>
        <Text style={styles.infoText}>Fetching English dictionary results...</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>Using fallback data</Text>
        <Text style={styles.warningText}>{error}</Text>
      </View>
    );
  }

  if (status === 'ready') {
    return (
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{successText}</Text>
        {source ? <Text style={styles.infoText}>Source: {source}</Text> : null}
      </View>
    );
  }

  return null;
}

function EmptyState({ text }: { text: string }) {
  return <Text style={styles.emptyState}>{text}</Text>;
}

function uniqueWords(words: string[]) {
  return Array.from(new Set(words.map((word) => word.trim()).filter(Boolean))).slice(0, 24);
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
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    width,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    flexGrow: 1,
    paddingBottom: 118,
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
  infoCard: {
    backgroundColor: '#EAF1FF',
    borderRadius: 8,
    marginBottom: 14,
    padding: 14,
  },
  infoTitle: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '900',
  },
  infoText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  warningCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  warningTitle: {
    color: '#C2410C',
    fontSize: 13,
    fontWeight: '900',
  },
  warningText: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
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
  emptyState: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
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
