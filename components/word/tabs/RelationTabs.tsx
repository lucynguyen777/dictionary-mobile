import { Text, View } from 'react-native';
import { DictionaryEntry } from '@/data/dictionary';
import { ApiMeaningResult, ApiRelatedWords } from '@/data/dictionaryApi';
import { PhrasebookItem, getPhrasebookItems } from '@/data/phrasebook';

import { type Props } from '../TabPager';
import { EmptyState, LookupBanner, PreviewNotice, WordChip, uniqueWords } from '@/components/word/tabs/common';
import { useTabPagerStyles } from '@/components/word/tabs/tabPagerStyles';

export function SynonymsTab({
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
  const styles = useTabPagerStyles();
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

export function CollocationTab({
  entry,
  sourceLang,
  targetLang,
}: {
  entry: DictionaryEntry;
  sourceLang: string;
  targetLang: string;
}) {
  const styles = useTabPagerStyles();
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

export function ConjugationTab({ entry }: { entry: DictionaryEntry }) {
  const styles = useTabPagerStyles();

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

export function EtymologyTab({ entry }: { entry: DictionaryEntry }) {
  const styles = useTabPagerStyles();

  return (
    <View>
      <PreviewNotice
        title="Nguồn đang kiểm thử"
        text="Etymology dùng nguồn Wiktionary-derived khi có dữ liệu hợp lệ; preview local và fallback luôn ghi rõ attribution."
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
