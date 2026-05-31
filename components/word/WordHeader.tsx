import Ionicons from '@expo/vector-icons/Ionicons';
import type { AudioPlayer } from 'expo-audio';
import { createAudioPlayer } from 'expo-audio';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { DictionaryEntry } from '@/data/dictionary';
import { Folder } from '@/data/libraryStore';
import { useToken } from '@/hooks/use-token';

type Props = {
  entry: DictionaryEntry;
  folders: Folder[];
  isFavorite: boolean;
  isTranslationComingSoon: boolean;
  languagePairLabel: string;
  note: string;
  savedFolderIds: string[];
  writingDirection?: 'ltr' | 'rtl';
  onSaveToFolder: (folderId: string, note: string) => void;
  onToggleFavorite: () => void;
};

export default function WordHeader({
  entry,
  folders,
  isFavorite,
  isTranslationComingSoon,
  note,
  savedFolderIds,
  writingDirection = 'ltr',
  onSaveToFolder,
  onToggleFavorite,
}: Props) {
  const { colors, spacing, radius } = useToken();
  const [audioPlayer, setAudioPlayer] = useState<AudioPlayer | null>(null);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [folderQuery, setFolderQuery] = useState('');
  const [noteDraft, setNoteDraft] = useState(note);
  const [saveMessage, setSaveMessage] = useState('');

  // Dynamically generate styles using tokens
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.canvasAlt,
      paddingBottom: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      zIndex: 10,
    },
    translationNotice: {
      alignItems: 'flex-start',
      backgroundColor: colors.statusInfo,
      borderColor: colors.accentNeo,
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    translationNoticeText: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
    },
    wordRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    word: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 40,
      fontWeight: '700',
    },
    actions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
    },
    ipaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
    },
    ipa: {
      color: colors.textSecondary,
      fontSize: 21,
      fontWeight: '700',
    },
    audioButton: {
      backgroundColor: colors.statusInfo,
      borderRadius: radius.full,
      padding: spacing.xs,
    },
    audioButtonDisabled: {
      backgroundColor: colors.disabledBg,
    },
    translation: {
      color: colors.textSecondary,
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
    },
    folderPicker: {
      backgroundColor: colors.canvas,
      borderColor: colors.borderDefault,
      borderRadius: radius.md,
      borderWidth: 1,
      maxHeight: 382,
      overflow: 'hidden',
      position: 'absolute',
      right: 34,
      top: 92,
      width: 270,
      zIndex: 50,
    },
    folderPickerHeader: {
      alignItems: 'center',
      borderBottomColor: colors.borderDefault,
      borderBottomWidth: 1,
      flexDirection: 'row',
      height: 51,
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
    },
    folderPickerTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    saveMessage: {
      alignItems: 'center',
      backgroundColor: colors.statusSuccess,
      borderBottomColor: colors.accentSuccess,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 7,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    saveMessageText: {
      color: colors.accentSuccess,
      flex: 1,
      fontSize: 12,
      fontWeight: '800',
    },
    folderSearchBox: {
      alignItems: 'center',
      backgroundColor: colors.canvasAlt,
      borderBottomColor: colors.borderDefault,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.md,
    },
    folderSearchInput: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 14,
      fontWeight: '800',
      paddingVertical: spacing.xs,
    },
    noteInput: {
      borderBottomColor: colors.borderDefault,
      borderBottomWidth: 1,
      color: colors.textPrimary,
      fontSize: 14,
      lineHeight: 20,
      minHeight: 62,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      textAlignVertical: 'top',
    },
    folderList: {
      maxHeight: 220,
    },
    folderRow: {
      alignItems: 'center',
      borderBottomColor: colors.canvasAlt,
      borderBottomWidth: 1,
      flexDirection: 'row',
      height: 48,
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
    },
    folderCopy: {
      flex: 1,
      paddingRight: spacing.md,
    },
    folderText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
    folderMeta: {
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: 2,
    },
    emptyFolderState: {
      alignItems: 'center',
      gap: spacing.sm,
      justifyContent: 'center',
      minHeight: 96,
      padding: spacing.md,
    },
    emptyFolderText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },
  });

  const filteredFolders = useMemo(() => {
    const normalizedQuery = folderQuery.trim().toLowerCase();
    if (!normalizedQuery) return folders;

    return folders.filter((folder) => folder.name.toLowerCase().includes(normalizedQuery));
  }, [folderQuery, folders]);

  const playAudio = async () => {
    try {
      if (!entry.audio) return;

      audioPlayer?.remove();

      const nextPlayer = createAudioPlayer(entry.audio);
      setAudioPlayer(nextPlayer);
      nextPlayer.play();
    } catch (err) {
      console.warn('Audio error:', err);
    }
  };

  useEffect(() => {
    return () => {
      audioPlayer?.remove();
    };
  }, [audioPlayer]);

  useEffect(() => {
    setFolderPickerOpen(false);
    setFolderQuery('');
    setNoteDraft(note);
    setSaveMessage('');

    if (!audioPlayer) return;

    audioPlayer.remove();
    setAudioPlayer(null);
    // Only reset cached audio when the selected word/audio changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.audio, entry.word, note]);

  return (
    <View style={styles.container}>
      {isTranslationComingSoon ? (
        <View style={styles.translationNotice}>
          <Ionicons name="time-outline" size={18} color={colors.accentPrimary} />
          <Text style={styles.translationNoticeText}>
            Cặp ngôn ngữ này chưa có dịch production. Tab Meaning vẫn có thể hiển thị định nghĩa của ngôn ngữ gốc khi có dữ liệu local/API.
          </Text>
        </View>
      ) : null}

      <View style={styles.wordRow}>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[
            styles.word,
            writingDirection === 'rtl' && { textAlign: 'right', writingDirection: 'rtl' }
          ]}>
          {entry.word}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onToggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={30} color="#EF476F" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFolderPickerOpen((value) => !value)}>
            <Ionicons name="add-circle-outline" size={30} color={colors.accentPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ipaRow}>
        <Text style={styles.ipa}>{entry.ipa}</Text>
        <TouchableOpacity disabled={!entry.audio} onPress={playAudio} style={[styles.audioButton, !entry.audio && styles.audioButtonDisabled]}>
          <Ionicons name="volume-medium-outline" size={18} color={entry.audio ? colors.accentPrimary : colors.textTertiary} />
        </TouchableOpacity>
        <Text style={styles.translation}>{entry.vietnamese}</Text>
      </View>

      {folderPickerOpen ? (
        <View style={styles.folderPicker}>
          <View style={styles.folderPickerHeader}>
            <Text style={styles.folderPickerTitle}>Lưu vào bộ từ</Text>
            <Ionicons name="albums-outline" size={22} color={colors.accentPrimary} />
          </View>
          {saveMessage ? (
            <View style={styles.saveMessage}>
              <Ionicons name="checkmark-circle" size={17} color={colors.accentSuccess} />
              <Text style={styles.saveMessageText}>{saveMessage}</Text>
            </View>
          ) : null}
          <View style={styles.folderSearchBox}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setFolderQuery}
              placeholder="Tìm nhanh bộ từ..."
              placeholderTextColor={colors.textTertiary}
              returnKeyType="search"
              style={styles.folderSearchInput}
              value={folderQuery}
            />
            {folderQuery ? (
              <TouchableOpacity activeOpacity={0.75} onPress={() => setFolderQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TextInput
            multiline
            placeholder="Ghi chú nhanh cho từ này"
            placeholderTextColor={colors.textTertiary}
            value={noteDraft}
            onChangeText={setNoteDraft}
            style={styles.noteInput}
          />
          {filteredFolders.length ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={styles.folderList}>
              {filteredFolders.map((folder) => {
                const isSavedInFolder = savedFolderIds.includes(folder.id);

                return (
                  <TouchableOpacity
                    key={folder.id}
                    activeOpacity={0.82}
                    style={styles.folderRow}
                    onPress={() =>
                      handleFolderSave({ folder, isSavedInFolder, noteDraft, onSaveToFolder, setSaveMessage })
                    }>
                    <View style={styles.folderCopy}>
                      <Text numberOfLines={1} style={styles.folderText}>{folder.name}</Text>
                      <Text style={styles.folderMeta}>{isSavedInFolder ? 'Đã có trong bộ từ này' : 'Bấm để lưu vào đây'}</Text>
                    </View>
                    <Ionicons name={isSavedInFolder ? 'checkmark-circle' : 'add-circle-outline'} size={23} color={colors.accentPrimary} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyFolderState}>
              <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.emptyFolderText}>Không tìm thấy bộ từ phù hợp.</Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

function handleFolderSave({
  folder,
  isSavedInFolder,
  noteDraft,
  onSaveToFolder,
  setSaveMessage,
}: {
  folder: Folder;
  isSavedInFolder: boolean;
  noteDraft: string;
  onSaveToFolder: (folderId: string, note: string) => void;
  setSaveMessage: (message: string) => void;
}) {
  onSaveToFolder(folder.id, noteDraft);
  setSaveMessage(isSavedInFolder ? `Đã cập nhật ghi chú trong "${folder.name}".` : `Đã lưu vào "${folder.name}".`);
}
