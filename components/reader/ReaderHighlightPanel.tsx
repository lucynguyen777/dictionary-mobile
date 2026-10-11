import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Touchable from '@/components/app/Touchable';
import { TranslationPanel } from '@/components/TranslationPanel';
import { getDefinitionTranslationTarget, toDeepLSourceLanguage } from '@/data/translationTargets';
import { getLanguageByCode, languageOptions, type LanguageCode } from '@/data/languages';

import { type ReaderThemeColors } from '@/components/reader/readerOptions';
import { styles } from '@/components/reader/styles';
import { READER_FIXED_COLORS } from '@/constants/readerThemes';

export function ReaderHighlightPanel({
  activeTheme,
  quickNote,
  readerSaveMessage,
  selectedHighlightText,
  sourceLanguageCode,
  targetLanguageCode,
  onClose,
  onCreateFlashcard,
  onLookup,
  onSave,
  onSelectLanguage,
  onUpdateNote,
}: {
  activeTheme: ReaderThemeColors;
  quickNote: string;
  readerSaveMessage: string;
  selectedHighlightText: string;
  sourceLanguageCode: LanguageCode;
  targetLanguageCode: LanguageCode;
  onClose: () => void;
  onCreateFlashcard: () => void;
  onLookup: () => void;
  onSave: () => void;
  onSelectLanguage: (field: 'source' | 'target', languageCode: LanguageCode) => void;
  onUpdateNote: (note: string) => void;
}) {
  const [activeLanguageMenu, setActiveLanguageMenu] = useState<'source' | 'target' | null>(null);
  const sourceLanguage = getLanguageByCode(sourceLanguageCode, 'en');
  const targetLanguage = getLanguageByCode(targetLanguageCode, 'vi');
  const readerTranslationTarget = getDefinitionTranslationTarget(sourceLanguage.code, targetLanguage.code);
  const selectableLanguages = languageOptions.filter((language) => language.dictionaryStatus !== 'unavailable').slice(0, 12);

  return (
    <View style={[styles.readerActionPanel, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
      <View style={styles.readerActionHeader}>
        <View>
          <Text style={[styles.readerActionKicker, { color: activeTheme.secondaryText }]}>Highlight</Text>
          <Text style={[styles.readerActionWord, { color: activeTheme.text }]}>{selectedHighlightText}</Text>
        </View>
        <Touchable accessibilityLabel="Bỏ chọn cụm từ" activeOpacity={0.75} onPress={onClose} style={[styles.readerActionClose, { backgroundColor: activeTheme.bg }]}>
          <Ionicons name="close" size={18} color={activeTheme.secondaryText} />
        </Touchable>
      </View>

      <View style={styles.readerLanguageRow}>
        <ReaderInlineLanguageMenu
          active={activeLanguageMenu === 'source'}
          activeTheme={activeTheme}
          label="Ngôn ngữ gốc"
          languages={selectableLanguages}
          selectedLanguageCode={sourceLanguage.code}
          onPress={() => setActiveLanguageMenu((current) => (current === 'source' ? null : 'source'))}
          onSelect={(languageCode) => {
            onSelectLanguage('source', languageCode);
            setActiveLanguageMenu(null);
          }}
        />
        <ReaderInlineLanguageMenu
          active={activeLanguageMenu === 'target'}
          activeTheme={activeTheme}
          label="Dịch sang"
          languages={selectableLanguages}
          selectedLanguageCode={targetLanguage.code}
          onPress={() => setActiveLanguageMenu((current) => (current === 'target' ? null : 'target'))}
          onSelect={(languageCode) => {
            onSelectLanguage('target', languageCode);
            setActiveLanguageMenu(null);
          }}
        />
      </View>

      {readerTranslationTarget ? (
        <TranslationPanel
          sourceText={selectedHighlightText}
          sourceLang={toDeepLSourceLanguage(sourceLanguage.code)}
          targetLang={readerTranslationTarget}
        />
      ) : null}

      <TextInput
        multiline
        onChangeText={onUpdateNote}
        placeholder="Ghi chú cho cụm từ..."
        placeholderTextColor={activeTheme.secondaryText}
        style={[styles.quickNoteInput, { backgroundColor: activeTheme.bg, borderColor: activeTheme.border, color: activeTheme.text }]}
        value={quickNote}
      />
      {readerSaveMessage ? <Text style={styles.readerSaveMessage}>{readerSaveMessage}</Text> : null}
      <View style={styles.readerActionButtons}>
        <Touchable activeOpacity={0.82} onPress={onLookup} style={[styles.lookupActionButton, { backgroundColor: activeTheme.bg }]}>
          <Ionicons name="search" size={17} color={activeTheme.accent} />
          <Text style={[styles.lookupActionText, { color: activeTheme.accent }]}>Tra nghĩa</Text>
        </Touchable>
        <Touchable activeOpacity={0.82} onPress={onSave} style={[styles.saveActionButton, { backgroundColor: activeTheme.accent }]}>
          <Ionicons name="bookmark-outline" size={17} color={READER_FIXED_COLORS.onAccent} />
          <Text style={styles.saveActionText}>Lưu</Text>
        </Touchable>
        <Touchable activeOpacity={0.82} onPress={onCreateFlashcard} style={[styles.saveActionButton, { backgroundColor: activeTheme.accent }]}>
          <Ionicons name="albums-outline" size={17} color={READER_FIXED_COLORS.onAccent} />
          <Text style={styles.saveActionText}>Tạo thẻ</Text>
        </Touchable>
      </View>
    </View>
  );
}

function ReaderInlineLanguageMenu({
  active,
  activeTheme,
  label,
  languages,
  selectedLanguageCode,
  onPress,
  onSelect,
}: {
  active: boolean;
  activeTheme: ReaderThemeColors;
  label: string;
  languages: typeof languageOptions;
  selectedLanguageCode: LanguageCode;
  onPress: () => void;
  onSelect: (languageCode: LanguageCode) => void;
}) {
  const selectedLanguage = getLanguageByCode(selectedLanguageCode, 'en');

  return (
    <View style={styles.readerInlineLanguageBox}>
      <Text style={[styles.readerInlineLanguageLabel, { color: activeTheme.secondaryText }]}>{label}</Text>
      <Touchable
        activeOpacity={0.82}
        onPress={onPress}
        style={[styles.readerLanguageDropdownButton, { backgroundColor: activeTheme.bg, borderColor: activeTheme.border }]}>
        <Text style={[styles.readerLanguageDropdownText, { color: activeTheme.text }]}>{selectedLanguage.label}</Text>
        <Ionicons name={active ? 'chevron-up' : 'chevron-down'} size={15} color={activeTheme.secondaryText} />
      </Touchable>
      {active ? (
        <View style={[styles.readerLanguageDropdownMenu, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
          {languages.map((language) => {
            const isSelected = language.code === selectedLanguage.code;
            return (
              <Touchable
                activeOpacity={0.82}
                key={`${label}-${language.code}`}
                onPress={() => onSelect(language.code)}
                style={[styles.readerLanguageDropdownOption, isSelected && { backgroundColor: activeTheme.accentLight }]}>
                <Text style={[styles.readerLanguageDropdownOptionText, { color: isSelected ? activeTheme.accent : activeTheme.text }]}>
                  {language.label}
                </Text>
                {isSelected ? <Ionicons name="checkmark" size={14} color={activeTheme.accent} /> : null}
              </Touchable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
