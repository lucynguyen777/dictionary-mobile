import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import Touchable from '@/components/app/Touchable';

import LanguageSelect, { getUnavailableLanguageMessage } from '@/components/app/LanguageSelect';
import MotionPressable from '@/components/app/MotionPressable';
import Screen from '@/components/app/Screen';
import { createHomeStyles } from '@/components/home/homeStyles';
import { loadAppColorSchemePreference, saveAppColorSchemePreference, type AppColorSchemePreference } from '@/data/appThemePreference';
import { getDefaultActivityState, getLocalDateKey, loadActivityState, type ActivityState } from '@/data/activityStore';
import { dictionaryEntries, getWordOfDay } from '@/data/dictionary';
import { detectLookupSourceLanguage, type LookupLanguageDetection } from '@/data/languageDetection';
import { getLanguageByCode, LanguageOption, languageOptions } from '@/data/languages';
import { LibraryState, getDefaultLibraryState, loadLibraryState } from '@/data/libraryStore';
import { normalizeLookupTerm } from '@/data/localLexicon';
import { getStudyStats } from '@/data/studyStats';
import { useToken } from '@/hooks/use-token';

type LanguageField = 'source' | 'target';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, radius, shadows, spacing, theme } = useToken();
  const styles = useMemo(
    () => createHomeStyles({ colors, radius, shadows, spacing, theme }),
    [colors, radius, shadows, spacing, theme]
  );
  const lookupInputRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [activityState, setActivityState] = useState<ActivityState>(getDefaultActivityState());
  const [todayKey, setTodayKey] = useState(() => getLocalDateKey(new Date()));
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<LanguageOption>(languageOptions[0]);
  const [targetLanguage, setTargetLanguage] = useState<LanguageOption>(languageOptions[1]);
  const [activeLanguageField, setActiveLanguageField] = useState<LanguageField | null>(null);
  const [themePreference, setThemePreference] = useState<AppColorSchemePreference>('system');
  const [detectedLanguage, setDetectedLanguage] = useState<LookupLanguageDetection | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      setTodayKey(getLocalDateKey(new Date()));
      Promise.all([loadLibraryState(), loadActivityState(), loadAppColorSchemePreference()])
        .then(([state, activity, preference]) => {
          if (!isMounted) return;

          setLibraryState(state);
          setActivityState(activity);
          setThemePreference(preference);
        })
        .catch(() => undefined);

      return () => {
        isMounted = false;
      };
    }, [])
  );

  // Both refresh on focus (todayKey and reloaded stores), so they roll over after midnight.
  const wordOfDay = useMemo(() => getWordOfDay(todayKey), [todayKey]);
  // Seeing Home means the app is open today; include it so the streak doesn't race recordAppOpen in _layout.
  const studyStats = useMemo(
    () => getStudyStats(libraryState, { activeDays: [...activityState.activeDays, todayKey] }),
    [activityState, libraryState, todayKey]
  );
  const reviewPlan = [
    { label: 'Từ cần ôn', value: studyStats.dueToday, icon: 'time-outline' as const },
    { label: 'Đã nhớ', value: studyStats.mastered, icon: 'checkmark-done-outline' as const },
    { label: 'Chuỗi ngày', value: studyStats.streak, icon: 'flame-outline' as const },
  ];

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

    const detection = detectLookupSourceLanguage(normalizedLookupQuery, sourceLanguage.code);
    const nextSourceLanguage =
      detection.confidence === 'high' && detection.languageCode !== sourceLanguage.code
        ? getLanguageByCode(detection.languageCode, sourceLanguage.code)
        : sourceLanguage;

    if (nextSourceLanguage.code !== sourceLanguage.code) {
      setSourceLanguage(nextSourceLanguage);
      setDetectedLanguage(detection);
    }

    router.push({
      pathname: '/word',
      params: {
        word: normalizedLookupQuery,
        sourceLang: nextSourceLanguage.code,
        targetLang: targetLanguage.code,
      },
    });
  };

  const handleToggleThemePreference = async () => {
    const nextPreference = themePreference === 'dark' ? 'light' : 'dark';
    setThemePreference(nextPreference);
    await saveAppColorSchemePreference(nextPreference);
  };

  const handleLanguagePress = (field: LanguageField) => {
    setActiveLanguageField((currentField) => (currentField === field ? null : field));
  };

  const handleSelectLanguage = (field: LanguageField, language: LanguageOption) => {
    // Same rule as the Word screen: languages without an approved dictionary source cannot be looked up yet.
    if (language.dictionaryStatus === 'unavailable') {
      Alert.alert('Cập nhật trong phiên bản sau', getUnavailableLanguageMessage(language));
      return;
    }

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
          <View style={styles.topBarActions}>
            <MotionPressable
              accessibilityLabel="Đổi nhanh chế độ sáng tối"
              onPress={handleToggleThemePreference}
              style={styles.iconButton}>
              <Ionicons name={themePreference === 'dark' ? 'moon' : 'sunny'} size={22} color={colors.textPrimary} />
            </MotionPressable>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>Monolingual & bilingual lookup</Text>
            <Text style={styles.heroTitle}>Tra từ nhanh, nhớ từ lâu hơn.</Text>
            <Text style={styles.heroText}>Từ điển, phát âm, collocation và flashcard nằm trong cùng một luồng học.</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeNumber}>{studyStats.savedWords}</Text>
            <Text style={styles.heroBadgeLabel}>Từ đã lưu</Text>
          </View>
        </View>

        <MotionPressable
          onPress={handleOpenLookup}
          style={styles.searchBox}>
          <Ionicons name="search" size={23} color={colors.accentPrimary} />
          <View style={styles.searchCopy}>
            <Text style={styles.searchLabel}>Tra cứu từ vựng</Text>
            <Text style={styles.searchHint}>Nhập từ, chọn ngôn ngữ rồi nhấn Enter</Text>
          </View>
          <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
        </MotionPressable>

        {showLanguagePicker ? (
          <View style={styles.languagePanel}>
            <View style={styles.homeLookupInputBox}>
              <Ionicons name="text" size={20} color={colors.accentPrimary} />
              <TextInput
                ref={lookupInputRef}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setLookupQuery}
                onSubmitEditing={handleSubmitLookup}
                placeholder="Nhập từ cần tra cứu..."
                placeholderTextColor={colors.textTertiary}
                returnKeyType="search"
                style={[
                  styles.homeLookupInput,
                  sourceLanguage.writingDirection === 'rtl' && { textAlign: 'right', writingDirection: 'rtl' }
                ]}
                value={lookupQuery}
              />
              {lookupQuery ? (
                <Touchable
                  accessibilityLabel="Xóa nội dung tìm kiếm"
                  accessibilityRole="button"
                  activeOpacity={0.75}
                  hitSlop={10}
                  onPress={() => setLookupQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                </Touchable>
              ) : null}
            </View>
            <View style={styles.languageRow}>
              <LanguageSelect
                active={activeLanguageField === 'source'}
                label="Ngôn ngữ gốc"
                selectedLanguage={sourceLanguage}
                onToggle={() => handleLanguagePress('source')}
                onSelect={(language) => handleSelectLanguage('source', language)}
              />
              <View style={styles.languageSwap}>
                <Ionicons name="swap-horizontal" size={18} color={colors.textSecondary} />
              </View>
              <LanguageSelect
                active={activeLanguageField === 'target'}
                label="Tra / dịch sang"
                selectedLanguage={targetLanguage}
                onToggle={() => handleLanguagePress('target')}
                onSelect={(language) => handleSelectLanguage('target', language)}
              />
            </View>
            {detectedLanguage ? (
              <View style={styles.detectedLanguageChip}>
                <Ionicons name="sparkles-outline" size={14} color={colors.accentPrimary} />
                <Text style={styles.detectedLanguageText}>
                  Đã nhận diện: {getLanguageByCode(detectedLanguage.languageCode, sourceLanguage.code).label}
                </Text>
                <Touchable
                  activeOpacity={0.75}
                  onPress={() => {
                    setDetectedLanguage(null);
                    setSourceLanguage(languageOptions[0]);
                  }}>
                  <Text style={styles.detectedLanguageUndo}>Hoàn tác</Text>
                </Touchable>
              </View>
            ) : null}
            <MotionPressable
              disabled={!canSubmitLookup}
              onPress={handleSubmitLookup}
              style={[styles.startLookupButton, !canSubmitLookup && styles.disabledLookupButton]}>
              <Text style={styles.startLookupText}>Tra từ</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.textOnAccent} />
            </MotionPressable>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          {reviewPlan.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Ionicons name={item.icon} size={20} color={colors.accentPrimary} />
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Từ vựng hôm nay</Text>
          <Link href={{ pathname: '/word', params: { word: wordOfDay.word } }} asChild>
            <Touchable>
              <Text style={styles.sectionAction}>Tra cứu</Text>
            </Touchable>
          </Link>
        </View>

        <Link href={{ pathname: '/word', params: { word: wordOfDay.word } }} asChild>
          <Touchable activeOpacity={0.85} style={styles.wotdCard}>
            <View style={styles.wotdTopRow}>
              <View style={styles.wotdBadge}>
                <Ionicons name="star" size={12} color={colors.textOnAccent} />
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
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.accentPrimary} />
                <Text style={styles.wotdExampleText}>“{wordOfDay.definitions[0].examples[0].source}”</Text>
              </View>
            ) : null}
          </Touchable>
        </Link>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch sử tra cứu</Text>
          <Link href="/word" asChild>
            <Touchable>
              <Text style={styles.sectionAction}>Tra cứu</Text>
            </Touchable>
          </Link>
        </View>

        {recentSearches.map((item) => (
          <Link key={item.word} href={{ pathname: '/word', params: { word: item.word } }} asChild>
            <Touchable activeOpacity={0.82} style={styles.wordCard}>
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
            </Touchable>
          </Link>
        ))}
        {!recentSearches.length ? (
          <Link href="/word" asChild>
            <Touchable activeOpacity={0.82} style={styles.emptyHistoryCard}>
              <Ionicons name="time-outline" size={24} color={colors.textTertiary} />
              <Text style={styles.emptyHistoryTitle}>Chưa có lịch sử tra cứu</Text>
              <Text style={styles.emptyHistoryText}>Tra một từ tiếng Anh để lịch sử xuất hiện ở đây.</Text>
            </Touchable>
          </Link>
        ) : null}
      </ScrollView>
      <MotionPressable
        accessibilityLabel="Chat nhanh với AI"
        onPress={() => router.push('/ai-assistant' as Href)}
        style={styles.quickAiButton}>
        <Ionicons name="chatbubble-ellipses" size={20} color={colors.textOnAccent} />
      </MotionPressable>
      <MotionPressable
        accessibilityLabel="Lên đầu trang"
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        style={styles.scrollTopButton}>
        <Ionicons name="arrow-up" size={20} color={colors.textOnAccent} />
      </MotionPressable>
      </View>
    </Screen>
  );
}

function formatLookedUpAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently searched';

  return `Tra lúc ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
