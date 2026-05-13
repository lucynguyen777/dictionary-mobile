import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  word: string;
  ipa: string;
  audio: string;
};

const folderNames = ['IELTS Speaking', 'Business English', 'Academic verbs'];

export default function WordHeader({ word, ipa, audio }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  const playAudio = async () => {
    try {
      if (sound) {
        await sound.replayAsync();
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audio }, { shouldPlay: true });
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
      <TouchableOpacity activeOpacity={0.8} style={styles.searchCard}>
        <Ionicons name="search" size={27} color="#111111" />
        <View style={styles.searchCopy}>
          <Text style={styles.searchWord}>Word</Text>
          <Text style={styles.language}>Language_1⟶Language_2</Text>
        </View>
        <Ionicons name="pencil-outline" size={22} color="#111111" />
      </TouchableOpacity>

      <View style={styles.wordRow}>
        <Text style={styles.word}>{word}</Text>
        <View style={styles.actions}>
          <Ionicons name="heart-outline" size={31} color="#111111" />
          <TouchableOpacity onPress={() => setFolderPickerOpen((value) => !value)}>
            <Ionicons name="add-circle-outline" size={29} color="#111111" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ipaRow}>
        <Text style={styles.ipa}>{ipa}</Text>
        <TouchableOpacity onPress={playAudio} style={styles.audioButton}>
          <Ionicons name="volume-medium-outline" size={18} color="#111111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.audioButton}>
          <Ionicons name="play" size={17} color="#111111" />
        </TouchableOpacity>
      </View>

      {folderPickerOpen ? (
        <View style={styles.folderPicker}>
          <View style={styles.folderSearch}>
            <Text style={styles.folderPlaceholder}>Search_folder_name</Text>
            <Ionicons name="caret-down" size={22} color="#111111" />
          </View>
          {folderNames.map((folder) => (
            <TouchableOpacity key={folder} style={styles.folderRow}>
              <Text style={styles.folderText}>{folder}</Text>
              <Ionicons name="add-circle-outline" size={23} color="#111111" />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 10,
  },
  searchCard: {
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 12,
    height: 64,
    marginBottom: 30,
    paddingHorizontal: 12,
  },
  searchCopy: {
    flex: 1,
  },
  searchWord: {
    fontSize: 17,
    fontWeight: '700',
  },
  language: {
    color: '#888888',
    fontSize: 14,
    marginTop: 5,
  },
  wordRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  word: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.4,
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
    fontSize: 23,
  },
  audioButton: {
    padding: 4,
  },
  folderPicker: {
    backgroundColor: '#FFFFFF',
    borderColor: '#111111',
    borderWidth: 1,
    position: 'absolute',
    right: 34,
    top: 156,
    width: 270,
    zIndex: 50,
  },
  folderSearch: {
    alignItems: 'center',
    borderBottomColor: '#111111',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 51,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  folderPlaceholder: {
    color: '#BEBEBE',
    fontSize: 19,
    fontStyle: 'italic',
  },
  folderRow: {
    alignItems: 'center',
    borderBottomColor: '#999999',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  folderText: {
    fontSize: 21,
    fontStyle: 'italic',
    fontWeight: '600',
  },
});
