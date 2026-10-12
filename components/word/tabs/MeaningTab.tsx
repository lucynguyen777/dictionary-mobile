import Ionicons from '@expo/vector-icons/Ionicons';
import * as Speech from 'expo-speech';
import { Text, View } from 'react-native';
import Touchable from '@/components/app/Touchable';
import { BilingualExample, DictionaryEntry } from '@/data/dictionary';
import { ApiBilingualMeaningResult, ApiMeaningResult } from '@/data/dictionaryApi';
import { getLanguageByCode } from '@/data/languages';
import { TranslationPanel } from '@/components/TranslationPanel';
import { getDefinitionTranslationTarget, toDeepLSourceLanguage } from '@/data/translationTargets';
import { useToken } from '@/hooks/use-token';

import { type Props } from '../TabPager';
import { LookupBanner, PreviewNotice } from '@/components/word/tabs/common';
import { useTabPagerStyles, useTabPagerToken } from '@/components/word/tabs/tabPagerStyles';

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

export function MeaningTab({
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
  const styles = useTabPagerStyles();
  const { colors } = useTabPagerToken();
  const shouldPreferVietnamese = targetLang === 'vi' && sourceLang !== 'vi';
  const isBilingualLookup = sourceLang !== targetLang;
  const translationTarget = getDefinitionTranslationTarget(sourceLang, targetLang);
  const sourceLanguage = getLanguageByCode(sourceLang, 'en');
  const isRtl = sourceLanguage.writingDirection === 'rtl';
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
        <View key={group.partOfSpeech || 'unspecified'} style={styles.block}>
          {group.partOfSpeech ? <Text style={styles.heading}>{group.partOfSpeech}</Text> : null}
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
              <Text
                style={[
                  styles.body,
                  (isRtl && !shouldPreferVietnamese) && { textAlign: 'right', writingDirection: 'rtl' }
                ]}>
                {getPrimaryDefinitionText(item, shouldPreferVietnamese)}
              </Text>
              {shouldPreferVietnamese && !apiBilingualMeaning ? (
                <Text
                  style={[
                    styles.secondaryDefinition,
                    (isRtl && shouldPreferVietnamese) && { textAlign: 'right', writingDirection: 'rtl' }
                  ]}>
                  {item.meaning}
                </Text>
              ) : null}
              {item.examples.length ? (
                <>
                  <Text style={styles.exampleLabel}>Ví dụ</Text>
                  {item.examples.map((example, i) => (
                    <View key={i} style={styles.exampleBlock}>
                      <View style={styles.exampleRow}>
                        <Touchable
                          accessibilityLabel="Nghe câu ví dụ"
                          activeOpacity={0.7}
                          onPress={() => speakExample(example.source)}
                          style={styles.exampleAudioButton}>
                          <Ionicons name="volume-medium-outline" size={16} color={colors.accentPrimary} />
                        </Touchable>
                        <Text
                          style={[
                            styles.example,
                            isRtl && { textAlign: 'right', writingDirection: 'rtl', flex: 1 }
                          ]}>
                          {example.source}
                        </Text>
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
      {translationTarget ? (
        <TranslationPanel
          sourceText={entry.shortDefinition || entry.word}
          sourceLang={toDeepLSourceLanguage(sourceLang)}
          targetLang={translationTarget}
        />
      ) : null}
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
    const partOfSpeech = definition.partOfSpeech.trim();
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
  const styles = useTabPagerStyles();
  const { colors } = useTabPagerToken();
  const metaItems = [
    domain ? { label: domain, tone: 'blue' as const } : null,
    level ? { label: level, tone: 'green' as const } : null,
    gender ? { label: gender, tone: 'neutral' as const } : null,
  ].filter(Boolean) as { label: string; tone: 'blue' | 'green' | 'neutral' }[];

  if (!metaItems.length) return null;

  return (
    <View style={styles.definitionMetaRow}>
      {metaItems.map((item) => (
        <View key={`${item.tone}-${item.label}`} style={[styles.definitionMetaPill, getMetaPillStyle(item.tone, colors)]}>
          <Text style={[styles.definitionMetaText, getMetaTextStyle(item.tone, colors)]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function getMetaPillStyle(tone: 'blue' | 'green' | 'neutral', colors: ReturnType<typeof useToken>['colors']) {
  return {
    backgroundColor: tone === 'blue' ? colors.accentSoft : tone === 'green' ? colors.statusSuccess : colors.surfaceMuted,
  };
}

function getMetaTextStyle(tone: 'blue' | 'green' | 'neutral', colors: ReturnType<typeof useToken>['colors']) {
  return {
    color: tone === 'blue' ? colors.accentPrimary : tone === 'green' ? colors.accentSuccess : colors.textSecondary,
  };
}
