import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import { dictionaryEntries, studyStats } from '@/data/dictionary';

const reviewPlan = [
  { label: 'Từ cần ôn', value: studyStats.dueToday, icon: 'time-outline' as const },
  { label: 'Đã nhớ', value: studyStats.mastered, icon: 'checkmark-done-outline' as const },
  { label: 'Chuỗi ngày', value: studyStats.streak, icon: 'flame-outline' as const },
];

export default function HomeScreen() {
  const featured = dictionaryEntries.slice(0, 4);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Chào buổi học mới</Text>
            <Text style={styles.title}>Dictionaire</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>English to Vietnamese</Text>
            <Text style={styles.heroTitle}>Tra từ nhanh, nhớ từ lâu hơn.</Text>
            <Text style={styles.heroText}>Từ điển, phát âm, collocation và flashcard nằm trong cùng một luồng học.</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeNumber}>{studyStats.listeningScore}</Text>
            <Text style={styles.heroBadgeLabel}>Pronunciation</Text>
          </View>
        </View>

        <Link href="/word" asChild>
          <TouchableOpacity activeOpacity={0.85} style={styles.searchBox}>
            <Ionicons name="search" size={23} color="#2563EB" />
            <View style={styles.searchCopy}>
              <Text style={styles.searchLabel}>Tra cứu từ vựng</Text>
              <Text style={styles.searchHint}>Nhập word, meaning, chủ đề hoặc IPA</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#64748B" />
          </TouchableOpacity>
        </Link>

        <View style={styles.statsRow}>
          {reviewPlan.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Ionicons name={item.icon} size={20} color="#2563EB" />
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Từ nổi bật</Text>
          <Link href="/word" asChild>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>Xem tất cả</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {featured.map((item) => (
          <Link key={item.word} href={{ pathname: '/word', params: { word: item.word } }} asChild>
            <TouchableOpacity activeOpacity={0.82} style={styles.wordCard}>
              <View style={styles.wordTop}>
                <View>
                  <Text style={styles.word}>{item.word}</Text>
                  <Text style={styles.ipa}>{item.ipa} · {item.level}</Text>
                </View>
                <View style={styles.topicPill}>
                  <Text style={styles.topicText}>{item.topic}</Text>
                </View>
              </View>
              <Text style={styles.definition}>{item.shortDefinition}</Text>
              <Text style={styles.translation}>{item.vietnamese}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  greeting: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: '#0F172A',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 2,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  hero: {
    backgroundColor: '#102A43',
    borderRadius: 8,
    flexDirection: 'row',
    marginTop: 22,
    minHeight: 170,
    overflow: 'hidden',
    padding: 20,
  },
  heroCopy: {
    flex: 1,
    paddingRight: 12,
  },
  heroKicker: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 33,
    marginTop: 12,
  },
  heroText: {
    color: '#D7E3F1',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  heroBadge: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  heroBadgeNumber: {
    color: '#2563EB',
    fontSize: 25,
    fontWeight: '900',
  },
  heroBadgeLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  searchCopy: {
    flex: 1,
  },
  searchLabel: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  searchHint: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 14,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 24,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionAction: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  wordTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  word: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  ipa: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  topicPill: {
    backgroundColor: '#EEF4FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topicText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },
  definition: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  translation: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
});
