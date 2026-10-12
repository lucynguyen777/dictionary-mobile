import { ScrollView, Text, View } from 'react-native';

import Touchable from '@/components/app/Touchable';
import type { createWordStyles } from '@/components/word/wordStyles';
import type { LibraryState } from '@/data/libraryStore';
import type { MorphologyCandidate } from '@/data/morphology';

type Props = {
  hasResults: boolean;
  morphologySuggestions: MorphologyCandidate[];
  onSelect: (word: string) => void;
  query: string;
  searchHistory: LibraryState['searchHistory'];
  showApiLookup: boolean;
  spellingSuggestions: string[];
  styles: ReturnType<typeof createWordStyles>;
};

// Under the Word search box: spelling and base-form suggestions when nothing matched, recent
// searches when the box is empty.
export default function LookupSuggestions({
  hasResults,
  morphologySuggestions,
  onSelect,
  query,
  searchHistory,
  showApiLookup,
  spellingSuggestions,
  styles,
}: Props) {
  return (
    <>
      {query && !hasResults && !showApiLookup && spellingSuggestions.length === 0 ? (
        <Text style={styles.emptyText}>Nhập từ thuộc ngôn ngữ gốc rồi nhấn tìm kiếm.</Text>
      ) : null}
      {query && !hasResults && spellingSuggestions.length > 0 ? (
        <View style={styles.suggestionBlock}>
          <Text style={styles.suggestionTitle}>Có phải ý bạn là:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
            {spellingSuggestions.map((suggestion) => (
              <Touchable key={suggestion} activeOpacity={0.82} onPress={() => onSelect(suggestion)} style={styles.suggestionChip}>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </Touchable>
            ))}
          </ScrollView>
        </View>
      ) : null}
      {query && !hasResults && morphologySuggestions.length > 0 ? (
        <View style={styles.morphologyBlock}>
          <Text style={styles.morphologyTitle}>Dạng gốc có thể là:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
            {morphologySuggestions.map((suggestion) => (
              <Touchable
                key={`${suggestion.word}-${suggestion.reason}`}
                activeOpacity={0.82}
                onPress={() => onSelect(suggestion.word)}
                style={styles.morphologyChip}>
                <Text style={styles.morphologyText}>{suggestion.label}</Text>
                <Text style={styles.morphologyMeta}>{suggestion.reason}</Text>
              </Touchable>
            ))}
          </ScrollView>
        </View>
      ) : null}
      {!query && searchHistory.length ? (
        <View style={styles.historyBlock}>
          <Text style={styles.historyTitle}>Tìm kiếm gần đây</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
            {searchHistory.map((item) => (
              <Touchable key={`${item.word}-${item.lookedUpAt}`} activeOpacity={0.82} onPress={() => onSelect(item.word)} style={styles.historyChip}>
                <Text style={styles.historyText}>{item.word}</Text>
              </Touchable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}
