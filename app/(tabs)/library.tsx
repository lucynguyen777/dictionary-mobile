import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import {
  LibraryState,
  createFolder,
  exportFolderToCsv,
  getDefaultLibraryState,
  getFolderWords,
  loadLibraryState,
} from '@/data/libraryStore';

export default function LibraryScreen() {
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      loadLibraryState().then((state) => {
        if (isMounted) setLibraryState(state);
      });

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const filteredFolders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return libraryState.folders;

    return libraryState.folders.filter((folder) => folder.name.toLowerCase().includes(normalizedQuery));
  }, [libraryState.folders, query]);

  const recentWords = libraryState.savedWords.slice(0, 6);

  const handleCreateFolder = () => {
    createFolder(libraryState).then(setLibraryState);
  };

  const handleExportFolder = async (folderId: string) => {
    try {
      const result = await exportFolderToCsv(libraryState, folderId);

      Alert.alert(result.ok ? 'Export complete' : 'Export unavailable', result.message);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Could not export this folder.');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Library</Text>
            <Text style={styles.title}>Tủ từ của bạn</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={handleCreateFolder} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.segment}>
          <Text style={styles.segmentActive}>Bộ từ</Text>
          <Text style={styles.segmentText}>Yêu thích</Text>
          <Text style={styles.segmentText}>Đã nhập</Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#2563EB" />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Tìm folder đã lưu"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Ionicons name="swap-vertical" size={18} color="#64748B" />
            <Text style={styles.toolbarText}>Sắp xếp theo gần đây</Text>
          </View>
          <View style={styles.viewToggle}>
            <Ionicons name="grid" size={18} color="#2563EB" />
            <Ionicons name="list-outline" size={19} color="#94A3B8" />
          </View>
        </View>

        <View style={styles.grid}>
          {filteredFolders.map((folder) => {
            const wordCount = getFolderWords(libraryState, folder.id).length;

            return (
            <TouchableOpacity
              key={folder.id}
              style={styles.folderCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/folder/${folder.id}` as never)}>
              <View style={[styles.cover, { backgroundColor: folder.color }]}>
                <Ionicons name="folder-open-outline" size={28} color="#0F172A" />
              </View>
              <View style={styles.folderInfo}>
                <View style={styles.folderCopy}>
                  <Text numberOfLines={1} style={styles.folderName}>{folder.name}</Text>
                  <Text style={styles.wordNumber}>{wordCount} words</Text>
                </View>
                <TouchableOpacity onPress={() => handleExportFolder(folder.id)} style={styles.exportButton}>
                  <Ionicons name="download-outline" size={18} color="#2563EB" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            );
          })}
        </View>
        {!filteredFolders.length ? <Text style={styles.emptyText}>Không tìm thấy folder phù hợp.</Text> : null}

        <Text style={styles.sectionTitle}>Vừa lưu</Text>
        {recentWords.map((entry) => (
          <Link key={entry.id} href={{ pathname: '/word', params: { word: entry.word } }} asChild>
            <TouchableOpacity activeOpacity={0.82} style={styles.savedWord}>
              <View style={styles.savedWordCopy}>
                <Text style={styles.savedWordTitle}>{entry.word}</Text>
                <Text style={styles.savedWordMeta}>{entry.definition || 'Saved word'} · {entry.ipa || 'IPA pending'}</Text>
                {entry.note ? <Text numberOfLines={2} style={styles.savedWordNote}>{entry.note}</Text> : null}
              </View>
              <View style={styles.savedTag}>
                <Text style={styles.savedTagText}>{entry.folderIds.length} folder</Text>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
        {!recentWords.length ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bookmark-outline" size={24} color="#94A3B8" />
            <Text style={styles.emptyCardTitle}>Chưa có từ đã lưu</Text>
            <Text style={styles.emptyCardText}>Vào tab Tra cứu, bấm trái tim hoặc lưu vào folder để bắt đầu thư viện của bạn.</Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kicker: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 4,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  segment: {
    backgroundColor: '#EAF1FF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    marginTop: 18,
    padding: 5,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    color: '#2563EB',
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    overflow: 'hidden',
    paddingVertical: 9,
    textAlign: 'center',
  },
  segmentText: {
    color: '#64748B',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 9,
    textAlign: 'center',
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    height: 48,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: '#94A3B8',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  toolbarLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  toolbarText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  viewToggle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 18,
  },
  folderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    padding: 10,
    width: '48%',
  },
  cover: {
    alignItems: 'center',
    borderRadius: 8,
    height: 86,
    justifyContent: 'center',
  },
  folderInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  exportButton: {
    backgroundColor: '#EAF1FF',
    borderRadius: 999,
    padding: 7,
  },
  folderCopy: {
    flex: 1,
  },
  folderName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  wordNumber: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 14,
  },
  savedWord: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 14,
  },
  savedWordCopy: {
    flex: 1,
    paddingRight: 12,
  },
  savedWordTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
  },
  savedWordMeta: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  savedWordNote: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  savedTag: {
    backgroundColor: '#EEF4FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedTagText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '900',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 18,
  },
  emptyCardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10,
  },
  emptyCardText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
});
