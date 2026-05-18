import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { RefObject, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { BilingualExample, DictionaryEntry } from '@/data/dictionary';
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
  examples: BilingualExample[];
  synonyms: string[];
  antonyms: string[];
  domain?: string;
  gender?: string;
  level?: string;
};

type StateTone = 'loading' | 'success' | 'warning' | 'empty' | 'preview';

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
  const pageScrollRefs = useRef<(ScrollView | null)[]>([]);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const handleIndexChange = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, tabs.length - 1));
    if (activeIndexRef.current === nextIndex) return;

    activeIndexRef.current = nextIndex;
    setVisibleIndex(nextIndex);
    onIndexChange(nextIndex);
  };

  const handleScrollActivePageToTop = () => {
    pageScrollRefs.current[visibleIndex]?.scrollTo({ y: 0, animated: true });
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
    <View style={styles.pagerWrap}>
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
      {tabs.map((tab, index) => (
        <View key={tab} style={[styles.page, { width }]}>
          <ScrollView
            ref={(node) => {
              pageScrollRefs.current[index] = node;
            }}
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
    <TouchableOpacity
      accessibilityLabel="Lên đầu trang"
      activeOpacity={0.84}
      onPress={handleScrollActivePageToTop}
      style={styles.scrollTopButton}>
      <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
    </TouchableOpacity>
    </View>
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

  const speakExample = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: sourceLang, rate: 0.9 });
  };

  return (
    <View>
      <LookupBanner
        error={bilingualLookupError || lookupError}
        source={meaningSource}
        status={lookupStatus}
        successText={
          apiBilingualMeaning
            ? 'Đã tải nghĩa từ từ điển song ngữ.'
            : 'Đã tải nghĩa từ dữ liệu từ điển trực tuyến.'
        }
      />
      {isBilingualLookup && bilingualLookupError && !apiBilingualMeaning ? (
        <PreviewNotice
          title="Dữ liệu song ngữ dự phòng"
          text="API song ngữ chưa trả về nghĩa ở ngôn ngữ đích cho từ này, nên app đang hiển thị dữ liệu tốt nhất có sẵn."
        />
      ) : null}
      {groupedDefinitions.map((group) => (
        <View key={group.partOfSpeech} style={styles.block}>
          <Text style={styles.heading}>{group.partOfSpeech}</Text>
          {group.definitions.map((item, index) => (
            <View
              key={`${item.meaning}-${index}`}
              style={[styles.definitionItem, index > 0 && styles.definitionItemDivider]}>
              {group.definitions.length > 1 ? <Text style={styles.definitionNumber}>Nghĩa {index + 1}</Text> : null}
              <DefinitionMetaRow
                domain={getDefinitionDomain(item.domain, entry.topic)}
                gender={item.gender ?? entry.gender}
                level={item.level ?? entry.level}
              />
              <Text style={styles.body}>{getPrimaryDefinitionText(item, shouldPreferVietnamese)}</Text>
              {shouldPreferVietnamese && !apiBilingualMeaning ? (
                <Text style={styles.secondaryDefinition}>{item.meaning}</Text>
              ) : null}
              {item.examples.length ? (
                <>
                  <Text style={styles.exampleLabel}>Ví dụ</Text>
                  {item.examples.map((example, i) => (
                    <View key={i} style={styles.exampleBlock}>
                      <View style={styles.exampleRow}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => speakExample(example.source)}
                          style={styles.exampleAudioButton}>
                          <Ionicons name="volume-medium-outline" size={16} color="#2563EB" />
                        </TouchableOpacity>
                        <Text style={styles.example}>{example.source}</Text>
                      </View>
                      {example.translation ? (
                        <Text style={styles.exampleTranslation}>{example.translation}</Text>
                      ) : null}
                    </View>
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

function getDefinitionDomain(domain: string | undefined, entryTopic: string) {
  if (domain) return domain;
  if (['General meaning', 'Bilingual dictionary', 'Online dictionary'].includes(entryTopic)) return 'Nghĩa chung';

  return entryTopic || 'Nghĩa chung';
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
        successText="Đã tải từ liên quan từ API lexical tiếng Anh."
      />
      <Text style={styles.sectionTitle}>Đồng nghĩa</Text>
      <View style={styles.chipWrap}>
        {synonyms.length ? synonyms.map((item) => (
          <WordChip key={item} sourceLang={sourceLang} targetLang={targetLang} word={item} variant="primary" />
        )) : <EmptyState text="Chưa tìm thấy từ đồng nghĩa phù hợp." />}
      </View>
      <Text style={[styles.sectionTitle, styles.mediumSpace]}>Trái nghĩa</Text>
      <View style={styles.chipWrap}>
        {antonyms.length ? antonyms.map((item) => (
          <WordChip key={item} sourceLang={sourceLang} targetLang={targetLang} word={item} variant="ghost" />
        )) : <EmptyState text="Chưa tìm thấy từ trái nghĩa phù hợp." />}
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
      <StateCard
        icon="hourglass-outline"
        text="Đang lấy dữ liệu nghĩa, từ liên quan và nguồn song ngữ nếu có."
        title="Đang tải dữ liệu"
        tone="loading"
      />
    );
  }

  if (status === 'error') {
    if (error) console.warn('Lookup error:', error);

    return (
      <StateCard
        icon="alert-circle-outline"
        text={'Không tải được dữ liệu trực tuyến. Ứng dụng sẽ dùng dữ liệu local/dự phòng nếu có.'}
        title="Đang dùng dữ liệu dự phòng"
        tone="warning"
      />
    );
  }

  if (status === 'ready') {
    return (
      <StateCard
        icon="checkmark-circle-outline"
        text={source ? `Nguồn: ${source}` : 'Dữ liệu đã sẵn sàng.'}
        title={successText}
        tone="success"
      />
    );
  }

  return null;
}

function EmptyState({ text }: { text: string }) {
  return <StateCard icon="document-text-outline" text={text} title="Chưa có dữ liệu" tone="empty" />;
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
        title="Dữ liệu local preview"
        text="Idioms và phrasal verbs hiện là dữ liệu text-only trong MVP. Bấm backlink để mở trang tra cứu."
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
                <Text style={styles.exampleLabel}>Ví dụ</Text>
                <Text style={styles.example}>{item.example}</Text>
              </>
            ) : null}
            {item.backlinks.length ? (
              <>
                <Text style={styles.exampleLabel}>Liên kết tra cứu</Text>
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
        <EmptyState text="Chưa có idiom, phrasal verb hoặc collocation local cho từ này." />
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
        title="Sắp hỗ trợ"
        text="Bảng chia động từ sẽ dùng resource production khi chọn được nguồn miễn phí hoặc có license ổn định."
      />
      {entry.conjugation.length ? entry.conjugation.map((item) => (
        <View key={item.tense} style={styles.tenseBlock}>
          <Text style={styles.sectionTitle}>{item.tense}</Text>
          <Text style={styles.body}>{item.form}</Text>
        </View>
      )) : <EmptyState text="Chưa có dữ liệu chia động từ cho mục này." />}
    </View>
  );
}

function EtymologyTab({ entry }: { entry: DictionaryEntry }) {
  return (
    <View>
      <PreviewNotice
        title="Sắp hỗ trợ"
        text="Etymology cần nguồn dữ liệu có cấu trúc và hợp pháp. Phần dưới hiện chỉ là preview local nếu có."
      />
      <Text style={styles.heading}>Nguồn gốc</Text>
      {entry.etymology ? <Text style={styles.body}>{entry.etymology}</Text> : <EmptyState text="Chưa có dữ liệu etymology local cho từ này." />}
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Gợi ý học</Text>
        <Text style={styles.body}>Liên hệ nguồn gốc của từ với một collocation hiện đại để ghi nhớ dễ hơn.</Text>
      </View>
    </View>
  );
}

function PronunciationTab({ entry }: { entry: DictionaryEntry }) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('Chưa có bản ghi.');

  const handleStartRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setRecordingStatus('Cần cấp quyền microphone để ghi âm.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: nextRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(nextRecording);
      setRecordedUri('');
      setRecordingStatus('Đang ghi âm phát âm của bạn...');
    } catch {
      setRecordingStatus('Chưa thể bắt đầu ghi âm. Thử lại sau.');
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI() ?? '';
      setRecordedUri(uri);
      setRecording(null);
      setRecordingStatus(uri ? 'Đã lưu bản ghi tạm thời trên thiết bị.' : 'Không tạo được bản ghi.');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch {
      setRecording(null);
      setRecordingStatus('Chưa thể dừng ghi âm. Thử lại sau.');
    }
  };

  const handlePlayRecording = async () => {
    if (!recordedUri) return;

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: recordedUri }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
      setRecordingStatus('Đang phát lại bản ghi của bạn.');
    } catch {
      setRecordingStatus('Chưa thể phát lại bản ghi.');
    }
  };

  return (
    <View>
      <PreviewNotice
        title="Ghi âm phát âm"
        text="Bạn có thể ghi âm và phát lại phát âm của mình. Căn chỉnh phoneme và chấm điểm sẽ thuộc phase sau."
      />
      <View style={styles.recordingCard}>
        <View style={styles.recordingCopy}>
          <Text style={styles.recordingTitle}>Bản ghi của bạn</Text>
          <Text style={styles.recordingText}>{recordingStatus}</Text>
        </View>
        <View style={styles.recordingActions}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={recording ? handleStopRecording : handleStartRecording}
            style={[styles.recordingButton, recording && styles.stopRecordingButton]}>
            <Ionicons name={recording ? 'stop' : 'mic-outline'} size={17} color={recording ? '#FFFFFF' : '#2563EB'} />
            <Text style={[styles.recordingButtonText, recording && styles.stopRecordingButtonText]}>
              {recording ? 'Dừng' : 'Ghi âm'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.82}
            disabled={!recordedUri || Boolean(recording)}
            onPress={handlePlayRecording}
            style={[styles.playRecordingButton, (!recordedUri || recording) && styles.disabledRecordingButton]}>
            <Ionicons name="play-outline" size={17} color={recordedUri && !recording ? '#166534' : '#94A3B8'} />
            <Text style={[styles.playRecordingText, (!recordedUri || recording) && styles.disabledRecordingText]}>
              Nghe lại
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Hướng dẫn IPA</Text>
      <Text style={styles.body}>Dùng nút loa phía trên để nghe phát âm mẫu của {entry.word}.</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.tableCell}>Phoneme</Text>
        <Text style={styles.tableCell}>Trọng tâm</Text>
      </View>
      {entry.pronunciationTips.length ? entry.pronunciationTips.map((row) => (
        <View key={row.phoneme} style={styles.tableRow}>
          <Text style={styles.tableCell}>{row.phoneme}</Text>
          <Text style={styles.tableCell}>Luyện tập</Text>
          <Text style={styles.note}>{row.note}</Text>
        </View>
      )) : <EmptyState text="Chưa có tip phát âm chi tiết cho từ này." />}
    </View>
  );
}

function PreviewNotice({ title, text }: { title: string; text: string }) {
  return <StateCard icon="information-circle-outline" text={text} title={title} tone="preview" />;
}

function StateCard({
  icon,
  text,
  title,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  title: string;
  tone: StateTone;
}) {
  const toneStyle = getStateToneStyle(tone);

  return (
    <View style={[styles.stateCard, toneStyle.card]}>
      <Ionicons name={icon} size={20} color={toneStyle.iconColor} />
      <View style={styles.stateCopy}>
        <Text style={[styles.stateTitle, toneStyle.title]}>{title}</Text>
        <Text style={[styles.stateText, toneStyle.text]}>{text}</Text>
      </View>
    </View>
  );
}

function getStateToneStyle(tone: StateTone) {
  if (tone === 'success') {
    return {
      card: styles.successStateCard,
      iconColor: '#166534',
      text: styles.successStateText,
      title: styles.successStateTitle,
    };
  }

  if (tone === 'warning') {
    return {
      card: styles.warningStateCard,
      iconColor: '#C2410C',
      text: styles.warningStateText,
      title: styles.warningStateTitle,
    };
  }

  if (tone === 'empty') {
    return {
      card: styles.emptyStateCard,
      iconColor: '#64748B',
      text: styles.emptyStateText,
      title: styles.emptyStateTitle,
    };
  }

  if (tone === 'preview') {
    return {
      card: styles.previewStateCard,
      iconColor: '#C2410C',
      text: styles.warningStateText,
      title: styles.warningStateTitle,
    };
  }

  return {
    card: styles.loadingStateCard,
    iconColor: '#2563EB',
    text: styles.loadingStateText,
    title: styles.loadingStateTitle,
  };
}

const styles = StyleSheet.create({
  pagerWrap: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  scrollTopButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 22,
    bottom: 18,
    elevation: 24,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    shadowColor: '#0F172A',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    width: 44,
    zIndex: 30,
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
  stateCard: {
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    padding: 14,
  },
  stateCopy: {
    flex: 1,
  },
  stateTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  stateText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  loadingStateCard: {
    backgroundColor: '#EAF1FF',
    borderColor: '#BFDBFE',
  },
  loadingStateTitle: {
    color: '#1D4ED8',
  },
  loadingStateText: {
    color: '#475569',
  },
  successStateCard: {
    backgroundColor: '#EAF8F0',
    borderColor: '#BBF7D0',
  },
  successStateTitle: {
    color: '#166534',
  },
  successStateText: {
    color: '#475569',
  },
  warningStateCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  warningStateTitle: {
    color: '#C2410C',
  },
  warningStateText: {
    color: '#9A3412',
  },
  emptyStateCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  emptyStateTitle: {
    color: '#334155',
  },
  emptyStateText: {
    color: '#64748B',
  },
  previewStateCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
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
  exampleBlock: {
    marginBottom: 10,
  },
  exampleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  exampleAudioButton: {
    backgroundColor: '#EAF1FF',
    borderRadius: 999,
    padding: 4,
    marginTop: 1,
  },
  example: {
    color: '#0F172A',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  exampleTranslation: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginLeft: 32,
    marginTop: 4,
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
  recordingCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DBEAFE',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
    padding: 14,
  },
  recordingCopy: {
    marginBottom: 12,
  },
  recordingTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  recordingText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  recordingButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  stopRecordingButton: {
    backgroundColor: '#DC2626',
  },
  recordingButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
  },
  stopRecordingButtonText: {
    color: '#FFFFFF',
  },
  playRecordingButton: {
    alignItems: 'center',
    backgroundColor: '#EAF8F0',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  playRecordingText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '900',
  },
  disabledRecordingButton: {
    backgroundColor: '#F1F5F9',
  },
  disabledRecordingText: {
    color: '#94A3B8',
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
