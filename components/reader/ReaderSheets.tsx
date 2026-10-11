import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ReaderSettings, ReaderState } from '@/data/readerStore';
import { readerBackgroundPresets, type ReaderBackgroundPresetId, type ReaderThemeMode } from '@/data/readerTheme';

import { type ReaderPreferences, type ReaderThemeColors, type ReaderTocItem, type VoiceProfile } from '@/components/reader/readerOptions';
import { styles } from '@/components/reader/styles';

export function ReaderSettingsSheet({
  activeTheme,
  backgroundOptions,
  fontOptions,
  handleSelectBackground,
  handleUpdateSettings,
  handleNextSentence,
  handlePlayPause,
  handlePrevSentence,
  handleStop,
  isSpeaking,
  preferences,
  readerState,
  speedOptions,
  themeOptions,
  updatePreferences,
  voiceProfiles,
}: {
  activeTheme: ReaderThemeColors;
  backgroundOptions: typeof readerBackgroundPresets;
  fontOptions: { label: string; value: ReaderSettings['fontFamily'] }[];
  handleSelectBackground: (presetId: ReaderBackgroundPresetId) => void;
  handleUpdateSettings: (settings: Partial<ReaderSettings>) => void;
  handleNextSentence: () => void;
  handlePlayPause: () => void;
  handlePrevSentence: () => void;
  handleStop: () => void;
  isSpeaking: boolean;
  preferences: ReaderPreferences;
  readerState: ReaderState;
  speedOptions: number[];
  themeOptions: { label: string; value: ReaderThemeMode; name: string }[];
  updatePreferences: (newPrefs: Partial<ReaderPreferences>) => Promise<void>;
  voiceProfiles: { label: string; value: VoiceProfile; desc: string }[];
}) {
  return (
    <>
      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Cỡ chữ</Text>
      <View style={styles.sheetRow}>
        <Text style={[styles.sheetRowText, { color: activeTheme.text }]}>Kích thước</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => handleUpdateSettings({ fontSize: Math.max(14, readerState.settings.fontSize - 1) })}
            style={[styles.stepButton, { backgroundColor: activeTheme.bg }]}>
            <Ionicons name="remove" size={17} color={activeTheme.accent} />
          </TouchableOpacity>
          <Text style={[styles.stepValue, { color: activeTheme.text }]}>{readerState.settings.fontSize}</Text>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => handleUpdateSettings({ fontSize: Math.min(32, readerState.settings.fontSize + 1) })}
            style={[styles.stepButton, { backgroundColor: activeTheme.bg }]}>
            <Ionicons name="add" size={17} color={activeTheme.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Chế độ màu</Text>
      <View style={styles.sheetOptionGrid}>
        {themeOptions.map((option) => {
          const isSelected = preferences.theme === option.value;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={option.value}
              onPress={() => {
                handleUpdateSettings({ themeMode: option.value });
                updatePreferences({ theme: option.value });
              }}
              style={[
                styles.sheetOptionButton,
                { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
              ]}>
              <Ionicons name={option.name as ComponentProps<typeof Ionicons>['name']} size={15} color={isSelected ? activeTheme.accent : activeTheme.secondaryText} />
              <Text style={[styles.optionText, { color: activeTheme.secondaryText }, isSelected && { color: activeTheme.accent }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Màu nền trang sách</Text>
      <View style={styles.bgOptionContainer}>
        {backgroundOptions.map((option) => {
          const isSelected = readerState.settings.backgroundPresetId === option.id;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={option.id}
              onPress={() => handleSelectBackground(option.id)}
              style={[
                styles.bgCircleButton,
                { backgroundColor: option.color, borderColor: activeTheme.border },
                isSelected && { borderColor: activeTheme.accent, borderWidth: 2 },
              ]}>
              <Text style={[styles.bgCircleText, { color: option.textColor }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Phông chữ</Text>
      <View style={styles.sheetOptionGrid}>
        {fontOptions.map((option) => {
          const isSelected = readerState.settings.fontFamily === option.value;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={option.value}
              onPress={() => handleUpdateSettings({ fontFamily: option.value })}
              style={[
                styles.sheetOptionButton,
                { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
              ]}>
              <Text style={[styles.optionText, { color: activeTheme.secondaryText }, isSelected && { color: activeTheme.accent }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Thiết lập audio</Text>
      <View style={styles.ttsControlBar}>
        <TouchableOpacity activeOpacity={0.8} onPress={handlePrevSentence} style={[styles.ttsIconButton, { backgroundColor: activeTheme.bg }]}>
          <Ionicons name="play-skip-back" size={20} color={activeTheme.accent} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={handlePlayPause} style={[styles.ttsPlayButton, { backgroundColor: activeTheme.accent }]}>
          <Ionicons name={isSpeaking ? 'pause' : 'play'} size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={handleStop} style={[styles.ttsIconButton, { backgroundColor: activeTheme.bg }]}>
          <Ionicons name="stop" size={20} color="#DC2626" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={handleNextSentence} style={[styles.ttsIconButton, { backgroundColor: activeTheme.bg }]}>
          <Ionicons name="play-skip-forward" size={20} color={activeTheme.accent} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Chọn giọng AI</Text>
      <View style={styles.voiceOptionRow}>
        {voiceProfiles.map((profile) => {
          const isSelected = preferences.ttsVoice === profile.value;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={profile.value}
              onPress={() => updatePreferences({ ttsVoice: profile.value })}
              style={[
                styles.voiceCard,
                { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
              ]}>
              <Text style={[styles.voiceCardLabel, { color: activeTheme.text }]}>{profile.label}</Text>
              <Text style={[styles.voiceCardDesc, { color: activeTheme.secondaryText }]}>{profile.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Tốc độ đọc</Text>
      <View style={styles.speedOptionRow}>
        {speedOptions.map((speed) => {
          const isSelected = preferences.ttsSpeed === speed;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={speed}
              onPress={() => updatePreferences({ ttsSpeed: speed })}
              style={[
                styles.speedButton,
                { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                isSelected && { backgroundColor: activeTheme.accent, borderColor: activeTheme.accent },
              ]}>
              <Text style={[styles.speedButtonText, { color: activeTheme.text }, isSelected && { color: '#FFFFFF' }]}>
                {speed}x
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

export function ReaderTocSheet({
  activeTheme,
  documents,
  handleJumpToProgress,
  handleSelectDocument,
  selectedDocumentId,
  tocItems,
}: {
  activeTheme: ReaderThemeColors;
  documents: ReaderState['documents'];
  handleJumpToProgress: (pct: number) => void;
  handleSelectDocument: (documentId: string) => void;
  selectedDocumentId: string;
  tocItems: ReaderTocItem[];
}) {
  return (
    <>
      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Tài liệu</Text>
      <View style={styles.tocDocumentList}>
        {documents.map((document) => {
          const isSelected = document.id === selectedDocumentId;
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={document.id}
              onPress={() => handleSelectDocument(document.id)}
              style={[
                styles.tocRow,
                { backgroundColor: activeTheme.bg, borderColor: activeTheme.border },
                isSelected && { backgroundColor: activeTheme.accentLight, borderColor: activeTheme.accent },
              ]}>
              <Text style={[styles.tocRowText, { color: isSelected ? activeTheme.accent : activeTheme.text }]} numberOfLines={1}>
                {document.title}
              </Text>
              <Text style={[styles.tocRowMeta, { color: activeTheme.secondaryText }]}>{(document.sourceFormat ?? 'txt').toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: activeTheme.secondaryText }]}>Mục lục tài liệu</Text>
      {tocItems.length ? (
        tocItems.map((item) => (
          <TouchableOpacity
            activeOpacity={0.82}
            key={item.id}
            onPress={() => handleJumpToProgress(item.pct)}
            style={[
              styles.tocRow,
              { backgroundColor: activeTheme.bg, borderColor: activeTheme.border, paddingLeft: 12 + item.level * 12 },
            ]}>
            <Text style={[styles.tocRowText, { color: activeTheme.text }]} numberOfLines={2}>
              {item.label}
            </Text>
            <Text style={[styles.tocRowMeta, { color: activeTheme.secondaryText }]}>{Math.round(item.pct)}%</Text>
          </TouchableOpacity>
        ))
      ) : (
        <View style={[styles.tocEmptyState, { backgroundColor: activeTheme.bg, borderColor: activeTheme.border }]}>
          <Ionicons name="list-outline" size={18} color={activeTheme.secondaryText} />
          <Text style={[styles.tocEmptyText, { color: activeTheme.secondaryText }]}>
            Tài liệu này chưa có heading/chapter rõ ràng để tạo mục lục.
          </Text>
        </View>
      )}
    </>
  );
}
