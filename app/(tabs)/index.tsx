import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import { dictionaryEntries, getWordOfDay, studyStats } from '@/data/dictionary';
import { LanguageOption, languageOptions } from '@/data/languages';
import { LibraryState, getDefaultLibraryState, loadLibraryState } from '@/data/libraryStore';
import { normalizeLookupTerm } from '@/data/localLexicon';

const reviewPlan = [
  { label: 'Từ cần ôn', value: studyStats.dueToday, icon: 'time-outline' as const },
  { label: 'Đã nhớ', value: studyStats.mastered, icon: 'checkmark-done-outline' as const },
  { label: 'Chuỗi ngày', value: studyStats.streak, icon: 'flame-outline' as const },
];

const wordOfDay = getWordOfDay();

type LanguageField = 'source' | 'target';

export default function HomeScreen() {
  const router = useRouter();
  const lookupInputRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<LanguageOption>(languageOptions[0]);
  const [targetLanguage, setTargetLanguage] = useState<LanguageOption>(languageOptions[1]);
  const [activeLanguageField, setActiveLanguageField] = useState<LanguageField | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      loadLibraryState().then((state) => {
        if (isMounted) setLibraryState(state);
      });

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const recentSearches = useMemo(() => {
    return libraryState.searchHistory.slice(0, 4).map((item) => {
      const localEntry = dictionaryEntries.find((entry) => entry.word === item.word);

      return {
        ...item,
        definition: localEntry?.shortDefinition ?? 'Tap to continue this lookup.',
        ipa: localEntry?.ipa ?? 'Online result',
        topic: localEntry?.topic ?? 'Recent',
      };
    });
  }, [libraryState.searchHistory]);

  const normalizedLookupQuery = normalizeLookupTerm(lookupQuery);
  const canSubmitLookup = Boolean(normalizedLookupQuery);

  const handleOpenLookup = () => {
    setShowLanguagePicker(true);
    setActiveLanguageField(null);
    setTimeout(() => lookupInputRef.current?.focus(), 80);
  };

  const handleSubmitLookup = () => {
    if (!normalizedLookupQuery) {
      lookupInputRef.current?.focus();
      return;
    }

    router.push({
      pathname: '/word',
      params: {
        word: normalizedLookupQuery,
        sourceLang: sourceLanguage.code,
        targetLang: targetLanguage.code,
      },
    });
  };

  const handleLanguagePress = (field: LanguageField) => {
    setActiveLanguageField((currentField) => (currentField === field ? null : field));
  };

  const handleSelectLanguage = (field: LanguageField, language: LanguageOption) => {
    if (field === 'source') {
      setSourceLanguage(language);
    } else {
      setTargetLanguage(language);
    }

    setActiveLanguageField(null);
  };

  return (
    <Screen>
      <View style={styles.screenBody}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.heroKicker}>Monolingual & bilingual lookup</Text>
            <Text style={styles.heroTitle}>Tra từ nhanh, nhớ từ lâu hơn.</Text>
            <Text style={styles.heroText}>Từ điển, phát âm, collocation và flashcard nằm trong cùng một luồng học.</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeNumber}>{studyStats.listeningScore}</Text>
            <Text style={styles.heroBadgeLabel}>Pronunciation</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenLookup}
          style={styles.searchBox}>
          <Ionicons name="search" size={23} color="#7C3AED" />
          <View style={styles.searchCopy}>
            <Text style={styles.searchLabel}>Tra cứu từ vựng</Text>
            <Text style={styles.searchHint}>Nhập từ, chọn ngôn ngữ rồi nhấn Enter</Text>
          </View>
          <Ionicons name="create-outline" size={20} color="#64748B" />
        </TouchableOpacity>

        {showLanguagePicker ? (
          <View style={styles.languagePanel}>
            <View style={styles.homeLookupInputBox}>
              <Ionicons name="text" size={20} color="#7C3AED" />
              <TextInput
                ref={lookupInputRef}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setLookupQuery}
                onSubmitEditing={handleSubmitLookup}
                placeholder="Nhập từ cần tra cứu..."
                placeholderTextColor="#94A3B8"
                returnKeyType="search"
                style={[
                  styles.homeLookupInput,
                  sourceLanguage.writingDirection === 'rtl' && { textAlign: 'right', writingDirection: 'rtl' }
                ]}
                value={lookupQuery}
              />
              {lookupQuery ? (
                <TouchableOpacity activeOpacity={0.75} onPress={() => setLookupQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.languageRow}>
              <LanguageSelect
                active={activeLanguageField === 'source'}
                field="source"
                label="Ngôn ngữ gốc"
                selectedLanguage={sourceLanguage}
                onPress={handleLanguagePress}
                onSelect={handleSelectLanguage}
              />
              <View style={styles.languageSwap}>
                <Ionicons name="swap-horizontal" size={18} color="#64748B" />
              </View>
              <LanguageSelect
                active={activeLanguageField === 'target'}
                field="target"
                label="Tra / dịch sang"
                selectedLanguage={targetLanguage}
                onPress={handleLanguagePress}
                onSelect={handleSelectLanguage}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!canSubmitLookup}
              onPress={handleSubmitLookup}
              style={[styles.startLookupButton, !canSubmitLookup && styles.disabledLookupButton]}>
              <Text style={styles.startLookupText}>Tra từ</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          {reviewPlan.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Ionicons name={item.icon} size={20} color="#7C3AED" />
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Từ vựng hôm nay</Text>
          <Link href={{ pathname: '/word', params: { word: wordOfDay.word } }} asChild>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>Tra cứu</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <Link href={{ pathname: '/word', params: { word: wordOfDay.word } }} asChild>
          <TouchableOpacity activeOpacity={0.85} style={styles.wotdCard}>
            <View style={styles.wotdTopRow}>
              <View style={styles.wotdBadge}>
                <Ionicons name="star" size={12} color="#FFFFFF" />
                <Text style={styles.wotdBadgeText}>Word of the Day</Text>
              </View>
              <View style={styles.topicPill}>
                <Text style={styles.topicText}>{wordOfDay.level} · {wordOfDay.topic}</Text>
              </View>
            </View>
            <Text style={styles.wotdWord}>{wordOfDay.word}</Text>
            {wordOfDay.ipa ? <Text style={styles.wotdIpa}>{wordOfDay.ipa}</Text> : null}
            <Text style={styles.wotdVietnamese}>{wordOfDay.vietnamese}</Text>
            <Text style={styles.wotdDefinition}>{wordOfDay.shortDefinition}</Text>
            {wordOfDay.definitions[0]?.examples[0] ? (
              <View style={styles.wotdExample}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#7C3AED" />
                <Text style={styles.wotdExampleText}>“{wordOfDay.definitions[0].examples[0].source}”</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </Link>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch sử tra cứu</Text>
          <Link href="/word" asChild>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>Tra cứu</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {recentSearches.map((item) => (
          <Link key={item.word} href={{ pathname: '/word', params: { word: item.word } }} asChild>
            <TouchableOpacity activeOpacity={0.82} style={styles.wordCard}>
              <View style={styles.wordTop}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.word, /[\u0600-\u06FF\u0590-\u05FF]/.test(item.word) && { textAlign: 'right', writingDirection: 'rtl' }]}>{item.word}</Text>
                  <Text style={styles.ipa}>{item.ipa}</Text>
                </View>
                <View style={styles.topicPill}>
                  <Text style={styles.topicText}>{item.topic}</Text>
                </View>
              </View>
              <Text style={styles.definition}>{item.definition}</Text>
              <Text style={styles.translation}>{formatLookedUpAt(item.lookedUpAt)}</Text>
            </TouchableOpacity>
          </Link>
        ))}
        {!recentSearches.length ? (
          <Link href="/word" asChild>
            <TouchableOpacity activeOpacity={0.82} style={styles.emptyHistoryCard}>
              <Ionicons name="time-outline" size={24} color="#94A3B8" />
              <Text style={styles.emptyHistoryTitle}>Chưa có lịch sử tra cứu</Text>
              <Text style={styles.emptyHistoryText}>Tra một từ tiếng Anh để lịch sử xuất hiện ở đây.</Text>
            </TouchableOpacity>
          </Link>
        ) : null}
      </ScrollView>
      <TouchableOpacity
        accessibilityLabel="Chat nhanh với AI"
        activeOpacity={0.84}
        onPress={() => router.push('/ai-assistant' as Href)}
        style={styles.quickAiButton}>
        <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel="Lên đầu trang"
        activeOpacity={0.84}
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        style={styles.scrollTopButton}>
        <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      </View>
    </Screen>
  );
}

function LanguageSelect({
  active,
  field,
  label,
  selectedLanguage,
  onPress,
  onSelect,
}: {
  active: boolean;
  field: LanguageField;
  label: string;
  selectedLanguage: LanguageOption;
  onPress: (field: LanguageField) => void;
  onSelect: (field: LanguageField, language: LanguageOption) => void;
}) {
  return (
    <View style={styles.languageSelectWrap}>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => onPress(field)}
        style={[styles.languageSelect, active && styles.activeLanguageSelect]}>
        <Text style={styles.languageSelectLabel}>{label}</Text>
        <View style={styles.languageSelectValueRow}>
          <Text style={styles.languageSelectValue}>{selectedLanguage.label}</Text>
          <Ionicons name={active ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
        </View>
      </TouchableOpacity>
      {active ? (
        <View style={styles.languageMenu}>
          {languageOptions.map((language) => {
            const isSelected = language.code === selectedLanguage.code;

            return (
              <TouchableOpacity
                key={`${field}-${language.code}`}
                activeOpacity={0.82}
                onPress={() => onSelect(field, language)}
                style={[styles.languageOption, isSelected && styles.activeLanguageOption]}>
                <View style={styles.languageOptionCopy}>
                  <Text style={[styles.languageOptionText, isSelected && styles.activeLanguageOptionText]}>
                    {language.label}
                  </Text>
                  <Text style={styles.languageOptionHint}>{language.hint}</Text>
                </View>
                {isSelected ? <Ionicons name="checkmark" size={16} color="#7C3AED" /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenBody: {
    flex: 1,
  },
  content: {
    paddingBottom: 96,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  scrollTopButton: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 22,
    bottom: 18,
    elevation: 24,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    boxShadow: '0px 6px 12px rgba(15, 23, 42, 0.18)',
    width: 44,
    zIndex: 30,
  },
  quickAiButton: {
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    bottom: 72,
    elevation: 24,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    boxShadow: '0px 6px 12px rgba(15, 23, 42, 0.18)',
    width: 44,
    zIndex: 30,
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
    fontWeight: '700',
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
    backgroundColor: '#1F1B2E',
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
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '700',
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
    color: '#7C3AED',
    fontSize: 25,
    fontWeight: '700',
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
    boxShadow: '0px 8px 16px rgba(15, 23, 42, 0.05)',
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
  languagePanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  homeLookupInputBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#DDD6FE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    minHeight: 50,
    paddingHorizontal: 12,
  },
  homeLookupInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    paddingVertical: 10,
  },
  languageRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  languageSelectWrap: {
    flex: 1,
  },
  languageSelect: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 72,
    padding: 12,
  },
  activeLanguageSelect: {
    borderColor: '#7C3AED',
  },
  languageSelectLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  languageSelectValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  languageSelectValue: {
    color: '#0F172A',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  languageSwap: {
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    marginTop: 18,
    width: 36,
  },
  languageMenu: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  languageOption: {
    alignItems: 'center',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  activeLanguageOption: {
    backgroundColor: '#F5F3FF',
  },
  languageOptionCopy: {
    flex: 1,
    paddingRight: 8,
  },
  languageOptionText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  activeLanguageOptionText: {
    color: '#7C3AED',
  },
  languageOptionHint: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  startLookupButton: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 13,
  },
  disabledLookupButton: {
    backgroundColor: '#C4B5FD',
  },
  startLookupText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
  },
  sectionAction: {
    color: '#7C3AED',
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
    fontWeight: '700',
  },
  ipa: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  topicPill: {
    backgroundColor: '#F5F3FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topicText: {
    color: '#7C3AED',
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
  emptyHistoryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  emptyHistoryTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyHistoryText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
  wotdCard: {
    backgroundColor: '#1F1B2E',
    borderRadius: 12,
    marginBottom: 4,
    padding: 18,
  },
  wotdTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  wotdBadge: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  wotdBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  wotdWord: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
  },
  wotdIpa: {
    color: '#C4B5FD',
    fontSize: 15,
    marginTop: 4,
  },
  wotdVietnamese: {
    color: '#7DD3FC',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  wotdDefinition: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  wotdExample: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 10,
  },
  wotdExampleText: {
    color: '#E2E8F0',
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
});


function formatLookedUpAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently searched';

  return `Tra lúc ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
