import { RefObject } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { DictionaryEntry } from '@/data/dictionary';
import { ApiMeaningResult, ApiRelatedWords } from '@/data/dictionaryApi';
import { PhrasebookItem, getPhrasebookItems } from '@/data/phrasebook';

const { width } = Dimensions.get('window');

type Props = {
  apiMeaning: ApiMeaningResult | null;
  apiRelatedWords: ApiRelatedWords | null;
  entry: DictionaryEntry;
  lookupError: string;
  lookupStatus: 'idle' | 'loading' | 'ready' | 'error';
  sourceLang: string;
  tabs: string[];
  targetLang: string;
  scrollRef: RefObject<ScrollView | null>;
  onIndexChange: (index: number) => void;
};

export default function TabPager({
  apiMeaning,
  apiRelatedWords,
  entry,
  lookupError,
  lookupStatus,
  sourceLang,
  tabs,
  targetLang,
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
            sourceLang={sourceLang}
            targetLang={targetLang}
          />
        );
      case 'Collocation & Idiom':
        return <CollocationTab entry={entry} sourceLang={sourceLang} targetLang={targetLang} />;
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
    domain: definition.domain,
    gender: definition.gender,
    level: definition.level,
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
          <DefinitionMetaRow
            domain={item.domain ?? entry.topic}
            gender={item.gender ?? entry.gender}
            level={item.level ?? entry.level}
          />
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

function DefinitionMetaRow({
  domain,
  gender,
  level,
}: {
  domain?: string;
  gender?: string;
  level?: string;
}) {
  const metaItems = [
    domain ? { label: domain, tone: 'blue' as const } : null,
    level ? { label: level, tone: 'green' as const } : null,
    gender ? { label: gender, tone: 'neutral' as const } : null,
  ].filter(Boolean) as { label: string; tone: 'blue' | 'green' | 'neutral' }[];

  if (!metaItems.length) return null;

  return (
    <View style={styles.definitionMetaRow}>
      {metaItems.map((item) => (
        <View key={`${item.tone}-${item.label}`} style={[styles.definitionMetaPill, getMetaPillStyle(item.tone)]}>
          <Text style={[styles.definitionMetaText, getMetaTextStyle(item.tone)]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function getMetaPillStyle(tone: 'blue' | 'green' | 'neutral') {
  if (tone === 'green') return styles.greenMetaPill;
  if (tone === 'neutral') return styles.neutralMetaPill;

  return styles.blueMetaPill;
}

function getMetaTextStyle(tone: 'blue' | 'green' | 'neutral') {
  if (tone === 'green') return styles.greenMetaText;
  if (tone === 'neutral') return styles.neutralMetaText;

  return styles.blueMetaText;
}

function SynonymsTab({
  apiMeaning,
  apiRelatedWords,
  entry,
  lookupError,
  lookupStatus,
  sourceLang,
  targetLang,
}: {
  apiMeaning: ApiMeaningResult | null;
  apiRelatedWords: ApiRelatedWords | null;
  entry: DictionaryEntry;
  lookupError: string;
  lookupStatus: Props['lookupStatus'];
  sourceLang: string;
  targetLang: string;
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
        {synonyms.length ? synonyms.map((item) => (
          <WordChip key={item} sourceLang={sourceLang} targetLang={targetLang} word={item} variant="primary" />
        )) : <EmptyState text="No synonyms found yet." />}
      </View>
      <Text style={[styles.sectionTitle, styles.mediumSpace]}>Antonyms</Text>
      <View style={styles.chipWrap}>
        {antonyms.length ? antonyms.map((item) => (
          <WordChip key={item} sourceLang={sourceLang} targetLang={targetLang} word={item} variant="ghost" />
        )) : <EmptyState text="No antonyms found yet." />}
      </View>
    </View>
  );
}

function WordChip({
  sourceLang,
  targetLang,
  word,
  variant,
}: {
  sourceLang: string;
  targetLang: string;
  word: string;
  variant: 'primary' | 'ghost';
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => router.push({ pathname: '/word', params: { sourceLang, targetLang, word } })}
      style={variant === 'primary' ? styles.chipButton : styles.ghostChipButton}>
      <Text style={variant === 'primary' ? styles.chipText : styles.ghostChipText}>{word}</Text>
    </TouchableOpacity>
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

function CollocationTab({
  entry,
  sourceLang,
  targetLang,
}: {
  entry: DictionaryEntry;
  sourceLang: string;
  targetLang: string;
}) {
  const phraseItems = getCollocationItems(entry);

  return (
    <View>
      <PreviewNotice
        title="Local curated preview"
        text="Idioms and phrasal verbs are text-only local data for this MVP. Tap a backlink to open that lookup."
      />
      {phraseItems.length ? (
        phraseItems.map((item) => (
          <View key={`${item.type}-${item.phrase}`} style={styles.smallBlock}>
            <View style={styles.phraseHeader}>
              <Text style={styles.phraseType}>{formatPhraseType(item.type)}</Text>
              <Text style={styles.collocation}>{item.phrase}</Text>
            </View>
            <Text style={styles.body}>{item.meaning}</Text>
            {item.example ? (
              <>
                <Text style={styles.exampleLabel}>Example</Text>
                <Text style={styles.example}>{item.example}</Text>
              </>
            ) : null}
            {item.backlinks.length ? (
              <>
                <Text style={styles.exampleLabel}>Backlinks</Text>
                <View style={styles.chipWrap}>
                  {item.backlinks.map((backlink) => (
                    <WordChip
                      key={`${item.phrase}-${backlink}`}
                      sourceLang={sourceLang}
                      targetLang={targetLang}
                      word={backlink}
                      variant="ghost"
                    />
                  ))}
                </View>
              </>
            ) : null}
          </View>
        ))
      ) : (
        <EmptyState text="No local idioms or phrasal verbs found for this lookup yet." />
      )}
    </View>
  );
}

function getCollocationItems(entry: DictionaryEntry): PhrasebookItem[] {
  const localItems: PhrasebookItem[] = [
    ...entry.collocations.map((phrase) => ({
      phrase,
      type: 'collocation' as const,
      meaning: `A common phrase pattern with "${entry.word}".`,
      example: `Use "${phrase}" in a sentence and save it to your daily review.`,
      triggers: [entry.word],
      backlinks: getPhraseBacklinks(phrase, entry.word),
    })),
    ...entry.idioms.map((item) => ({
      phrase: item.phrase,
      type: 'idiom' as const,
      meaning: item.meaning,
      example: '',
      triggers: [entry.word],
      backlinks: getPhraseBacklinks(item.phrase, entry.word),
    })),
  ];

  return uniquePhraseItems([...localItems, ...getPhrasebookItems(entry.word)]).slice(0, 12);
}

function uniquePhraseItems(items: PhrasebookItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.phrase.toLowerCase();
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function getPhraseBacklinks(phrase: string, fallbackWord: string) {
  const words = phrase
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z'-]/g, ''))
    .filter((word) => word.length > 2);

  return uniqueWords(words.length ? words : [fallbackWord]).slice(0, 4);
}

function formatPhraseType(type: PhrasebookItem['type']) {
  if (type === 'phrasal verb') return 'Phrasal verb';
  if (type === 'idiom') return 'Idiom';

  return 'Collocation';
}

function ConjugationTab({ entry }: { entry: DictionaryEntry }) {
  return (
    <View>
      <PreviewNotice
        title="Coming soon"
        text="Conjugation will move to a production resource once a reliable free or licensed source is chosen."
      />
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
      <PreviewNotice
        title="Coming soon"
        text="Etymology needs a legally usable structured resource. The text below is local preview data."
      />
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
  return (
    <View>
      <PreviewNotice
        title="Audio only for now"
        text="The app can play sample pronunciation audio. Real phoneme alignment and scoring will be added in a later phase."
      />
      <Text style={styles.sectionTitle}>IPA guide</Text>
      <Text style={styles.body}>Use the speaker button above to hear a model pronunciation for {entry.word}.</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.tableCell}>Phoneme</Text>
        <Text style={styles.tableCell}>Focus</Text>
      </View>
      {entry.pronunciationTips.map((row) => (
        <View key={row.phoneme} style={styles.tableRow}>
          <Text style={styles.tableCell}>{row.phoneme}</Text>
          <Text style={styles.tableCell}>Practice</Text>
          <Text style={styles.note}>{row.note}</Text>
        </View>
      ))}
    </View>
  );
}

function PreviewNotice({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.previewCard}>
      <Text style={styles.previewTitle}>{title}</Text>
      <Text style={styles.previewText}>{text}</Text>
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
  definitionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  definitionMetaPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  definitionMetaText: {
    fontSize: 11,
    fontWeight: '900',
  },
  blueMetaPill: {
    backgroundColor: '#EAF1FF',
  },
  blueMetaText: {
    color: '#2563EB',
  },
  greenMetaPill: {
    backgroundColor: '#EAF8F0',
  },
  greenMetaText: {
    color: '#166534',
  },
  neutralMetaPill: {
    backgroundColor: '#F1F5F9',
  },
  neutralMetaText: {
    color: '#475569',
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
  chipButton: {
    backgroundColor: '#EAF1FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '800',
  },
  ghostChipButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostChipText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800',
  },
  mediumSpace: {
    marginTop: 28,
  },
  emptyState: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  previewTitle: {
    color: '#C2410C',
    fontSize: 13,
    fontWeight: '900',
  },
  previewText: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  smallBlock: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
  },
  phraseHeader: {
    gap: 6,
    marginBottom: 10,
  },
  phraseType: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
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
