import { RefObject, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { DictionaryEntry } from '@/data/dictionary';
import { ApiBilingualMeaningResult, ApiMeaningResult, ApiRelatedWords } from '@/data/dictionaryApi';
import { PhrasebookItem, getPhrasebookItems } from '@/data/phrasebook';

type Props = {
  apiBilingualMeaning: ApiBilingualMeaningResult | null;
  apiMeaning: ApiMeaningResult | null;
  apiRelatedWords: ApiRelatedWords | null;
  bilingualLookupError: string;
  entry: DictionaryEntry;
  lookupError: string;
  lookupStatus: 'idle' | 'loading' | 'ready' | 'error';
  sourceLang: string;
  tabs: string[];
  targetLang: string;
  scrollRef: RefObject<ScrollView | null>;
  onIndexChange: (index: number) => void;
};

type MeaningDefinitionItem = {
  partOfSpeech: string;
  meaning: string;
  vietnamese?: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  domain?: string;
  gender?: string;
  level?: string;
};

export default function TabPager({
  apiBilingualMeaning,
  apiMeaning,
  apiRelatedWords,
  bilingualLookupError,
  entry,
  lookupError,
  lookupStatus,
  sourceLang,
  tabs,
  targetLang,
  scrollRef,
  onIndexChange,
}: Props) {
  const { width } = useWindowDimensions();
  const activeIndexRef = useRef(0);

  const handleIndexChange = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, tabs.length - 1));
    if (activeIndexRef.current === nextIndex) return;

    activeIndexRef.current = nextIndex;
    onIndexChange(nextIndex);
  };

  const renderTab = (tab: string) => {
    switch (tab) {
      case 'Meaning':
        return (
          <MeaningTab
            apiMeaning={apiMeaning}
            apiBilingualMeaning={apiBilingualMeaning}
            bilingualLookupError={bilingualLookupError}
            entry={entry}
            lookupError={lookupError}
            lookupStatus={lookupStatus}
            sourceLang={sourceLang}
            targetLang={targetLang}
          />
        );
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
      onScroll={(e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        handleIndexChange(index);
      }}
      onMomentumScrollEnd={(e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        handleIndexChange(index);
      }}>
      {tabs.map((tab) => (
        <View key={tab} style={[styles.page, { width }]}>
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
  apiBilingualMeaning,
  apiMeaning,
  bilingualLookupError,
  entry,
  lookupError,
  lookupStatus,
  sourceLang,
  targetLang,
}: {
  apiBilingualMeaning: ApiBilingualMeaningResult | null;
  apiMeaning: ApiMeaningResult | null;
  bilingualLookupError: string;
  entry: DictionaryEntry;
  lookupError: string;
  lookupStatus: Props['lookupStatus'];
  sourceLang: string;
  targetLang: string;
}) {
  const shouldPreferVietnamese = sourceLang === 'en' && targetLang === 'vi';
  const isBilingualLookup = sourceLang !== targetLang;
  const localDefinitions = entry.definitions.map((definition) => ({
    partOfSpeech: definition.partOfSpeech,
    meaning: definition.meaning,
    vietnamese: definition.vietnamese,
    examples: definition.examples,
    synonyms: [],
    antonyms: [],
    domain: definition.domain,
    gender: definition.gender,
    level: definition.level,
  }));
  const bilingualDefinitions = apiBilingualMeaning?.definitions.map((definition) => ({
    partOfSpeech: definition.partOfSpeech,
    meaning: definition.meaning,
    vietnamese: definition.meaning,
    examples: definition.examples,
    synonyms: [],
    antonyms: [],
    domain: definition.domain,
    gender: definition.gender,
    level: definition.level,
  }));
  const definitions = getMeaningDefinitions({
    apiDefinitions: apiMeaning?.definitions,
    bilingualDefinitions,
    localDefinitions,
    shouldPreferVietnamese,
  });
  const meaningSource = apiBilingualMeaning?.source ?? apiMeaning?.source;
  const groupedDefinitions = groupDefinitionsByPartOfSpeech(definitions);

  return (
    <View>
      <LookupBanner
        error={bilingualLookupError || lookupError}
        source={meaningSource}
        status={lookupStatus}
        successText={
          apiBilingualMeaning
            ? 'Meaning loaded from bilingual dictionary data.'
            : 'Meaning loaded from live dictionary data.'
        }
      />
      {isBilingualLookup && bilingualLookupError && !apiBilingualMeaning ? (
        <PreviewNotice
          title="Bilingual API fallback"
          text="The bilingual dictionary API did not return target-language meanings for this word, so the app is showing the best available fallback."
        />
      ) : null}
      {groupedDefinitions.map((group) => (
        <View key={group.partOfSpeech} style={styles.block}>
          <Text style={styles.heading}>{group.partOfSpeech}</Text>
          {group.definitions.map((item, index) => (
            <View
              key={`${item.meaning}-${index}`}
              style={[styles.definitionItem, index > 0 && styles.definitionItemDivider]}>
              {group.definitions.length > 1 ? <Text style={styles.definitionNumber}>Meaning {index + 1}</Text> : null}
              <DefinitionMetaRow
                domain={item.domain ?? entry.topic}
                gender={item.gender ?? entry.gender}
                level={item.level ?? entry.level}
              />
              <Text style={styles.body}>{getPrimaryDefinitionText(item, shouldPreferVietnamese)}</Text>
              {shouldPreferVietnamese && !apiBilingualMeaning ? (
                <Text style={styles.secondaryDefinition}>{item.meaning}</Text>
              ) : null}
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
      ))}
    </View>
  );
}

function getMeaningDefinitions({
  apiDefinitions,
  bilingualDefinitions,
  localDefinitions,
  shouldPreferVietnamese,
}: {
  apiDefinitions?: MeaningDefinitionItem[];
  bilingualDefinitions?: MeaningDefinitionItem[];
  localDefinitions: MeaningDefinitionItem[];
  shouldPreferVietnamese: boolean;
}): MeaningDefinitionItem[] {
  if (bilingualDefinitions?.length) return bilingualDefinitions;
  if (shouldPreferVietnamese && hasVietnameseDefinitions(localDefinitions)) return localDefinitions;
  if (apiDefinitions?.length) return apiDefinitions;

  return localDefinitions;
}

function hasVietnameseDefinitions(definitions: MeaningDefinitionItem[]) {
  return definitions.some((definition) => Boolean(definition.vietnamese?.trim()));
}

function getPrimaryDefinitionText(definition: MeaningDefinitionItem, shouldPreferVietnamese: boolean) {
  if (!shouldPreferVietnamese) return definition.meaning;

  return definition.vietnamese?.trim() || 'Chưa có nghĩa tiếng Việt cho mục này.';
}

function groupDefinitionsByPartOfSpeech(definitions: MeaningDefinitionItem[]) {
  const groups: { partOfSpeech: string; definitions: MeaningDefinitionItem[] }[] = [];

  definitions.forEach((definition) => {
    const partOfSpeech = definition.partOfSpeech.trim() || 'word';
    const existingGroup = groups.find((group) => group.partOfSpeech.toLowerCase() === partOfSpeech.toLowerCase());

    if (existingGroup) {
      existingGroup.definitions.push(definition);
      return;
    }

    groups.push({
      partOfSpeech,
      definitions: [definition],
    });
  });

  return groups;
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
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: 760,
    width: '100%',
    paddingBottom: 118,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  block: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  infoCard: {
    backgroundColor: '#EAF1FF',
    borderRadius: 8,
    marginBottom: 14,
    padding: 16,
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
    padding: 16,
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
  definitionItem: {
    paddingTop: 0,
  },
  definitionItemDivider: {
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
  },
  definitionNumber: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 10,
    textTransform: 'uppercase',
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
  secondaryDefinition: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
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
    padding: 18,
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
    padding: 18,
  },
  noteCard: {
    backgroundColor: '#EAF8F0',
    borderRadius: 8,
    marginTop: 18,
    padding: 18,
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
