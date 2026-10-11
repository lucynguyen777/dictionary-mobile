import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { languageOptions, type LanguageOption } from '@/data/languages';
import { useToken } from '@/hooks/use-token';

export const UNAVAILABLE_LANGUAGE_HINT = 'Cập nhật trong phiên bản sau · Cần nguồn dữ liệu';

export function getUnavailableLanguageMessage(language: LanguageOption) {
  return `${language.label}: Cập nhật trong phiên bản sau. Cần nguồn dữ liệu từ điển hợp pháp trước khi bật tra cứu production.`;
}

type LanguageSelectProps = {
  active: boolean;
  label: string;
  selectedLanguage: LanguageOption;
  onToggle: () => void;
  // Called for every option, including unavailable ones, so the screen decides how to explain them.
  onSelect: (language: LanguageOption) => void;
};

// Dropdown for choosing a lookup language. Languages without an approved dictionary source are shown
// muted with a "later version" hint instead of being hidden, so users know they are planned.
export default function LanguageSelect({ active, label, selectedLanguage, onToggle, onSelect }: LanguageSelectProps) {
  const { colors, radius } = useToken();
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        accessibilityLabel={`${label}: ${selectedLanguage.label}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: active }}
        activeOpacity={0.82}
        onPress={onToggle}
        style={[styles.select, active && styles.selectActive]}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text numberOfLines={1} style={styles.value}>{selectedLanguage.label}</Text>
          <Ionicons name={active ? 'chevron-up' : 'chevron-down'} size={15} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {active ? (
        <View accessibilityRole="menu" style={styles.menu}>
          {languageOptions.map((language) => {
            const isSelected = language.code === selectedLanguage.code;
            const isUnavailable = language.dictionaryStatus === 'unavailable';

            return (
              <TouchableOpacity
                key={language.code}
                accessibilityHint={isUnavailable ? UNAVAILABLE_LANGUAGE_HINT : undefined}
                accessibilityRole="menuitem"
                accessibilityState={{ disabled: isUnavailable, selected: isSelected }}
                activeOpacity={isUnavailable ? 0.72 : 0.82}
                onPress={() => onSelect(language)}
                style={[styles.option, isSelected && styles.optionSelected, isUnavailable && styles.optionUnavailable]}>
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected, isUnavailable && styles.mutedText]}>
                    {language.label}
                  </Text>
                  <Text style={[styles.optionHint, isUnavailable && styles.mutedText]}>
                    {isUnavailable ? UNAVAILABLE_LANGUAGE_HINT : language.hint}
                  </Text>
                </View>
                {isSelected ? <Ionicons name="checkmark" size={16} color={colors.accentPrimary} /> : null}
                {!isSelected && isUnavailable ? <Ionicons name="time-outline" size={15} color={colors.textSecondary} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useToken>['colors'], radius: ReturnType<typeof useToken>['radius']) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
    },
    select: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.borderDefault,
      borderRadius: radius.md,
      borderWidth: 1,
      minHeight: 62,
      padding: 10,
    },
    selectActive: {
      borderColor: colors.accentPrimary,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    valueRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    value: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
    },
    menu: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.borderDefault,
      borderRadius: radius.md,
      borderWidth: 1,
      marginTop: 8,
      overflow: 'hidden',
    },
    option: {
      alignItems: 'center',
      borderBottomColor: colors.borderDefault,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 44,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    optionSelected: {
      backgroundColor: colors.accentSoft,
    },
    optionUnavailable: {
      backgroundColor: colors.surfaceMuted,
      opacity: 0.58,
    },
    optionCopy: {
      flex: 1,
      paddingRight: 8,
    },
    optionText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
    optionTextSelected: {
      color: colors.accentPrimary,
    },
    optionHint: {
      color: colors.textTertiary,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 2,
    },
    mutedText: {
      color: colors.textSecondary,
    },
  });
}
