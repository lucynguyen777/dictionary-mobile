import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { DictionaryEntry } from '@/data/dictionary';
import { Folder } from '@/data/libraryStore';

type Props = {
  entry: DictionaryEntry;
  folders: Folder[];
  isFavorite: boolean;
  note: string;
  savedFolderIds: string[];
  onSaveToFolder: (folderId: string, note: string) => void;
  onToggleFavorite: () => void;
};

export default function WordHeader({
  entry,
  folders,
  isFavorite,
  note,
  savedFolderIds,
  onSaveToFolder,
  onToggleFavorite,
}: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [folderQuery, setFolderQuery] = useState('');
  const [noteDraft, setNoteDraft] = useState(note);

  const filteredFolders = useMemo(() => {
    const normalizedQuery = folderQuery.trim().toLowerCase();
    if (!normalizedQuery) return folders;

    return folders.filter((folder) => folder.name.toLowerCase().includes(normalizedQuery));
  }, [folderQuery, folders]);

  const playAudio = async () => {
    try {
      if (!entry.audio) return;

      await sound?.unloadAsync();

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: entry.audio }, { shouldPlay: true });
      setSound(newSound);
    } catch (err) {
      console.warn('Audio error:', err);
    }
  };

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  useEffect(() => {
    setFolderPickerOpen(false);
    setFolderQuery('');
    setNoteDraft(note);

    if (!sound) return;

    sound.unloadAsync();
    setSound(null);
    // Only reset cached audio when the selected word/audio changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.audio, entry.word, note]);

  return (
    <View style={styles.container}>
      <View style={styles.searchCard}>
        <Ionicons name="book-outline" size={25} color="#2563EB" />
        <View style={styles.searchCopy}>
          <Text style={styles.searchWord}>English to Vietnamese</Text>
          <Text style={styles.language}>{entry.topic} · {entry.level}</Text>
        </View>
        <Ionicons name="swap-horizontal-outline" size={22} color="#64748B" />
      </View>

      <View style={styles.wordRow}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.word}>{entry.word}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onToggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={30} color="#EF476F" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFolderPickerOpen((value) => !value)}>
            <Ionicons name="add-circle-outline" size={30} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ipaRow}>
        <Text style={styles.ipa}>{entry.ipa}</Text>
        <TouchableOpacity disabled={!entry.audio} onPress={playAudio} style={[styles.audioButton, !entry.audio && styles.audioButtonDisabled]}>
          <Ionicons name="volume-medium-outline" size={18} color={entry.audio ? '#2563EB' : '#94A3B8'} />
        </TouchableOpacity>
        <Text style={styles.translation}>{entry.vietnamese}</Text>
      </View>

      {folderPickerOpen ? (
        <View style={styles.folderPicker}>
          <View style={styles.folderPickerHeader}>
            <Text style={styles.folderPickerTitle}>Lưu vào bộ từ</Text>
            <Ionicons name="albums-outline" size={22} color="#2563EB" />
          </View>
          <View style={styles.folderSearchBox}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setFolderQuery}
              placeholder="Tìm nhanh album..."
              placeholderTextColor="#94A3B8"
              returnKeyType="search"
              style={styles.folderSearchInput}
              value={folderQuery}
            />
            {folderQuery ? (
              <TouchableOpacity activeOpacity={0.75} onPress={() => setFolderQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TextInput
            multiline
            placeholder="Ghi chú nhanh cho từ này"
            placeholderTextColor="#94A3B8"
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
                    onPress={() => onSaveToFolder(folder.id, noteDraft)}>
                    <View style={styles.folderCopy}>
                      <Text numberOfLines={1} style={styles.folderText}>{folder.name}</Text>
                      <Text style={styles.folderMeta}>{isSavedInFolder ? 'Saved in this folder' : 'Tap to save here'}</Text>
                    </View>
                    <Ionicons name={isSavedInFolder ? 'checkmark-circle' : 'add-circle-outline'} size={23} color="#2563EB" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyFolderState}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" />
              <Text style={styles.emptyFolderText}>Không tìm thấy album phù hợp.</Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7F8FA',
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 10,
  },
  searchCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 12,
    height: 64,
    marginBottom: 22,
    paddingHorizontal: 12,
  },
  searchCopy: {
    flex: 1,
  },
  searchWord: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
  },
  language: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 5,
  },
  wordRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  word: {
    color: '#0F172A',
    flex: 1,
    fontSize: 40,
    fontWeight: '900',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  ipaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  ipa: {
    color: '#334155',
    fontSize: 21,
    fontWeight: '700',
  },
  audioButton: {
    backgroundColor: '#EAF1FF',
    borderRadius: 999,
    padding: 7,
  },
  audioButtonDisabled: {
    backgroundColor: '#F1F5F9',
  },
  translation: {
    color: '#64748B',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  folderPicker: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 382,
    overflow: 'hidden',
    position: 'absolute',
    right: 34,
    top: 150,
    width: 270,
    zIndex: 50,
  },
  folderPickerHeader: {
    alignItems: 'center',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 51,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  folderPickerTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  folderSearchBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  folderSearchInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    paddingVertical: 9,
  },
  noteInput: {
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  folderList: {
    maxHeight: 220,
  },
  folderRow: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  folderCopy: {
    flex: 1,
    paddingRight: 10,
  },
  folderText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  folderMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  emptyFolderState: {
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    minHeight: 96,
    padding: 14,
  },
  emptyFolderText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
