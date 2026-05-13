import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import {
  LibraryState,
  SavedWord,
  exportFolderToCsv,
  getDefaultLibraryState,
  getFolderById,
  getFolderWords,
  loadLibraryState,
  removeWordFromFolder,
  updateSavedWordNote,
} from '@/data/libraryStore';

export default function FolderDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const folderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [query, setQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    loadLibraryState().then((state) => {
      if (isMounted) setLibraryState(state);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const folder = folderId ? getFolderById(libraryState, folderId) : undefined;
  const folderWords = useMemo(() => {
    if (!folderId) return [];

    const normalizedQuery = query.trim().toLowerCase();
    const words = getFolderWords(libraryState, folderId);

    if (!normalizedQuery) return words;

    return words.filter((word) => {
      return (
        word.word.toLowerCase().includes(normalizedQuery) ||
        word.definition.toLowerCase().includes(normalizedQuery) ||
        word.note.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [folderId, libraryState, query]);

  const handleExport = async () => {
    if (!folderId) return;

    try {
      const result = await exportFolderToCsv(libraryState, folderId);

      Alert.alert(result.ok ? 'Export complete' : 'Export unavailable', result.message);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Could not export this folder.');
    }
  };

  const handleSaveNote = (wordId: string, note: string) => {
    updateSavedWordNote(libraryState, wordId, note).then(setLibraryState);
  };

  const handleRemoveWord = (word: SavedWord) => {
    if (!folderId) return;

    Alert.alert('Remove word', `Remove "${word.word}" from this folder?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeWordFromFolder(libraryState, word.id, folderId).then(setLibraryState);
        },
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
            <Ionicons name="download-outline" size={19} color="#2563EB" />
            <Text style={styles.exportText}>CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={[styles.folderIcon, { backgroundColor: folder?.color ?? '#EAF1FF' }]}>
            <Ionicons name="folder-open-outline" size={34} color="#0F172A" />
          </View>
          <Text style={styles.kicker}>Folder</Text>
          <Text style={styles.title}>{folder?.name ?? 'Folder not found'}</Text>
          <Text style={styles.subtitle}>{folderWords.length} saved words</Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#2563EB" />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Search word, definition, or note"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        {folderWords.map((word) => (
          <FolderWordCard key={word.id} word={word} onRemove={() => handleRemoveWord(word)} onSaveNote={handleSaveNote} />
        ))}

        {!folderWords.length ? (
          <View style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={26} color="#94A3B8" />
            <Text style={styles.emptyTitle}>{query ? 'No matching words' : 'This folder is empty'}</Text>
            <Text style={styles.emptyText}>
              {query ? 'Try another search term.' : 'Save a word from the lookup screen to build this folder.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function FolderWordCard({
  word,
  onRemove,
  onSaveNote,
}: {
  word: SavedWord;
  onRemove: () => void;
  onSaveNote: (wordId: string, note: string) => void;
}) {
  const [noteDraft, setNoteDraft] = useState(word.note);

  useEffect(() => {
    setNoteDraft(word.note);
  }, [word.note]);

  return (
    <View style={styles.wordCard}>
      <View style={styles.wordTopRow}>
        <Link href={{ pathname: '/word', params: { word: word.word } }} asChild>
          <TouchableOpacity activeOpacity={0.82} style={styles.wordLink}>
            <Text style={styles.wordTitle}>{word.word}</Text>
            <Text style={styles.wordMeta}>{word.ipa || 'IPA pending'}</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <Text numberOfLines={3} style={styles.definition}>{word.definition || 'Definition pending'}</Text>

      <TextInput
        multiline
        placeholder="Add a note"
        placeholderTextColor="#94A3B8"
        value={noteDraft}
        onChangeText={setNoteDraft}
        style={styles.noteInput}
      />
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => onSaveNote(word.id, noteDraft)}
        style={styles.noteButton}>
        <Ionicons name="checkmark-circle-outline" size={18} color="#2563EB" />
        <Text style={styles.noteButtonText}>Save note</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 30,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  exportButton: {
    alignItems: 'center',
    backgroundColor: '#EAF1FF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  exportText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '900',
  },
  hero: {
    marginTop: 18,
  },
  folderIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 74,
    justifyContent: 'center',
    marginBottom: 14,
    width: 74,
  },
  kicker: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    height: 48,
    marginBottom: 14,
    marginTop: 18,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    padding: 14,
  },
  wordTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wordLink: {
    flex: 1,
    paddingRight: 12,
  },
  wordTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  wordMeta: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  definition: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 10,
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    minHeight: 70,
    padding: 10,
    textAlignVertical: 'top',
  },
  noteButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EAF1FF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noteButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '900',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 22,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
});
