import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DictionaryEntry, savedFolders } from '@/data/dictionary';

type Props = {
  entry: DictionaryEntry;
};

export default function WordHeader({ entry }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  const playAudio = async () => {
    try {
      if (sound) {
        await sound.replayAsync();
        return;
      }

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
          <Ionicons name="heart-outline" size={30} color="#EF476F" />
          <TouchableOpacity onPress={() => setFolderPickerOpen((value) => !value)}>
            <Ionicons name="add-circle-outline" size={30} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ipaRow}>
        <Text style={styles.ipa}>{entry.ipa}</Text>
        <TouchableOpacity onPress={playAudio} style={styles.audioButton}>
          <Ionicons name="volume-medium-outline" size={18} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.translation}>{entry.vietnamese}</Text>
      </View>

      {folderPickerOpen ? (
        <View style={styles.folderPicker}>
          <View style={styles.folderSearch}>
            <Text style={styles.folderPlaceholder}>Lưu vào bộ từ</Text>
            <Ionicons name="albums-outline" size={22} color="#2563EB" />
          </View>
          {savedFolders.slice(0, 4).map((folder) => (
            <TouchableOpacity key={folder.name} style={styles.folderRow}>
              <View>
                <Text style={styles.folderText}>{folder.name}</Text>
                <Text style={styles.folderMeta}>{folder.words} words</Text>
              </View>
              <Ionicons name="add-circle-outline" size={23} color="#2563EB" />
            </TouchableOpacity>
          ))}
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
    overflow: 'hidden',
    position: 'absolute',
    right: 34,
    top: 150,
    width: 270,
    zIndex: 50,
  },
  folderSearch: {
    alignItems: 'center',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 51,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  folderPlaceholder: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
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
});
