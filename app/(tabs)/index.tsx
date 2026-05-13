import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import SectionTitle from '@/components/app/SectionTitle';

const recentWords = [
  { word: 'articulate', definition: 'able to express ideas clearly' },
  { word: 'resilient', definition: 'able to recover quickly' },
  { word: 'nuance', definition: 'a subtle difference in meaning' },
  { word: 'immerse', definition: 'to involve deeply in an activity' },
];

export default function HomeScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerActions}>
          <Ionicons name="notifications-outline" size={24} color="#111111" />
          <Ionicons name="moon-outline" size={24} color="#111111" />
          <Ionicons name="globe-outline" size={25} color="#111111" />
        </View>

        <View style={styles.logoBox}>
          <Text style={styles.logoText}>Logo</Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.searchBox}>
          <Ionicons name="search" size={25} color="#8D8D8D" />
          <Text style={styles.searchText}>Search</Text>
        </TouchableOpacity>

        <View style={styles.languageRow}>
          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.languageText}>English</Text>
            <Ionicons name="caret-down" size={14} color="#111111" />
          </TouchableOpacity>
          <Ionicons name="arrow-forward" size={28} color="#111111" />
          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.languageText}>Vietnamese</Text>
            <Ionicons name="caret-down" size={14} color="#111111" />
          </TouchableOpacity>
        </View>

        <View style={styles.rule} />
        <SectionTitle title="RECENT" action="More" />

        {recentWords.map((item) => (
          <View key={item.word} style={styles.wordRow}>
            <Text style={styles.word}>{item.word}</Text>
            <Text style={styles.definition}>{item.definition}</Text>
            <Ionicons name="add" size={29} color="#111111" />
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  logoBox: {
    alignSelf: 'center',
    borderColor: '#DDDDDD',
    borderRadius: 6,
    borderWidth: 1,
    height: 86,
    justifyContent: 'flex-start',
    marginBottom: 78,
    marginTop: 68,
    padding: 10,
    width: 86,
  },
  logoText: {
    fontSize: 14,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 12,
    height: 40,
    paddingHorizontal: 12,
  },
  searchText: {
    color: '#777777',
    fontSize: 17,
  },
  languageRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 48,
    marginTop: 32,
    gap: 20,
  },
  languageButton: {
    alignItems: 'center',
    borderColor: '#DDDDDD',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    height: 32,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    width: 120,
  },
  languageText: {
    fontSize: 15,
  },
  rule: {
    backgroundColor: '#111111',
    height: 1,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  wordRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
  },
  word: {
    flex: 0.9,
    fontSize: 16,
    fontWeight: '500',
  },
  definition: {
    flex: 1.5,
    fontSize: 16,
  },
});
