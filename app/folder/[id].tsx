import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import {
  LibraryState,
  SavedWord,
  deleteFolder,
  exportFolderToCsv,
  exportFolderToExcel,
  getDefaultLibraryState,
  getFavoriteFolderId,
  getFolderById,
  getFolderWords,
  loadLibraryState,
  removeWordFromFolder,
  renameFolder,
  updateSavedWordNote,
} from '@/data/libraryStore';

export default function FolderDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const folderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const scrollRef = useRef<ScrollView | null>(null);
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [query, setQuery] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);

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
  const isFavoriteFolder = folderId === getFavoriteFolderId();

  useEffect(() => {
    setNameDraft(folder?.name ?? '');
  }, [folder?.name]);

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

  const handleExport = async (format: 'csv' | 'excel') => {
    if (!folderId) return;
    setFolderMenuOpen(false);

    try {
      const result = format === 'excel' ? await exportFolderToExcel(libraryState, folderId) : await exportFolderToCsv(libraryState, folderId);

      Alert.alert(result.ok ? 'Xuất dữ liệu xong' : 'Chưa thể xuất dữ liệu', result.message);
    } catch (error) {
      Alert.alert('Xuất dữ liệu thất bại', error instanceof Error ? error.message : 'Chưa thể xuất bộ từ này.');
    }
  };

  const handleSaveNote = (wordId: string, note: string) => {
    updateSavedWordNote(libraryState, wordId, note).then(setLibraryState);
  };

  const handleRenameFolder = () => {
    if (!folderId || !folder) return;

    renameFolder(libraryState, folderId, nameDraft).then((nextState) => {
      setLibraryState(nextState);
      setFolderMenuOpen(false);
    });
  };

  const handleDeleteFolder = () => {
    if (!folderId || !folder || isFavoriteFolder) return;

    Alert.alert('Xóa bộ từ', `Xóa "${folder.name}"? Những từ chỉ nằm trong bộ này sẽ bị gỡ khỏi Library.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          deleteFolder(libraryState, folderId).then(() => router.back());
        },
      },
    ]);
  };

  const handleRemoveWord = (word: SavedWord) => {
    if (!folderId) return;

    Alert.alert('Gỡ từ', `Gỡ "${word.word}" khỏi bộ từ này?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Gỡ',
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
      <View style={styles.screenBody}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Mở menu bộ từ"
            activeOpacity={0.82}
            onPress={() => setFolderMenuOpen((isOpen) => !isOpen)}
            style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {folderMenuOpen && folder ? (
          <View style={styles.folderMenuPanel}>
            <Text style={styles.folderMenuLabel}>Xuất bộ từ</Text>
            <View style={styles.exportGroup}>
              <TouchableOpacity onPress={() => handleExport('csv')} style={styles.exportButton}>
                <Ionicons name="download-outline" size={18} color="#2563EB" />
                <Text style={styles.exportText}>CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleExport('excel')} style={styles.exportButton}>
                <Ionicons name="grid-outline" size={18} color="#2563EB" />
                <Text style={styles.exportText}>XLS</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.manageHeader}>
              <Text style={styles.manageTitle}>Cài đặt bộ từ</Text>
              {isFavoriteFolder ? <Text style={styles.lockedPill}>Được bảo vệ</Text> : null}
            </View>
            <TextInput
              placeholder="Tên bộ từ"
              placeholderTextColor="#94A3B8"
              value={nameDraft}
              onChangeText={setNameDraft}
              style={styles.nameInput}
            />
            <View style={styles.manageActions}>
              <TouchableOpacity activeOpacity={0.82} onPress={handleRenameFolder} style={styles.saveButton}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#2563EB" />
                <Text style={styles.saveButtonText}>Đổi tên</Text>
              </TouchableOpacity>
              {!isFavoriteFolder ? (
                <TouchableOpacity activeOpacity={0.82} onPress={handleDeleteFolder} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Xóa</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.hero}>
          <View style={[styles.folderIcon, { backgroundColor: folder?.color ?? '#EAF1FF' }]}>
            {folder?.avatarUri ? (
              <Image source={{ uri: folder.avatarUri }} style={styles.folderAvatarImage} />
            ) : (
              <Ionicons name="folder-open-outline" size={34} color="#0F172A" />
            )}
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>Bộ từ</Text>
            <Text style={styles.title}>{folder?.name ?? 'Không tìm thấy bộ từ'}</Text>
            <Text style={styles.subtitle}>{folderWords.length} từ đã lưu</Text>
            {folder?.tags.length ? <Text numberOfLines={1} style={styles.folderTags}>{folder.tags.join(', ')}</Text> : null}
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#2563EB" />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Tìm từ, nghĩa hoặc ghi chú"
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
            <Text style={styles.emptyTitle}>{query ? 'Không có từ phù hợp' : 'Bộ từ đang trống'}</Text>
            <Text style={styles.emptyText}>
              {query ? 'Thử từ khóa tìm kiếm khác.' : 'Lưu một từ từ màn Tra cứu để bắt đầu xây bộ từ này.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>
      <TouchableOpacity
        accessibilityLabel="Lên đầu trang"
        activeOpacity={0.84}
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        style={styles.scrollTopButton}>
        <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      </View>
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
            <Text style={[styles.wordTitle, /[\u0600-\u06FF\u0590-\u05FF]/.test(word.word) && { textAlign: 'right', writingDirection: 'rtl' }]}>{word.word}</Text>
            <Text style={styles.wordMeta}>{word.ipa || 'Đang chờ IPA'}</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <Text numberOfLines={3} style={styles.definition}>{word.definition || 'Đang chờ định nghĩa'}</Text>

      <TextInput
        multiline
        placeholder="Thêm ghi chú"
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
        <Text style={styles.noteButtonText}>Lưu ghi chú</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screenBody: {
    flex: 1,
  },
  content: {
    paddingBottom: 96,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  scrollTopButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 22,
    bottom: 18,
    elevation: 24,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    boxShadow: '0px 6px 12px rgba(15, 23, 42, 0.18)',
    width: 44,
    zIndex: 30,
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
  exportGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  folderMenuPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    padding: 12,
  },
  folderMenuLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
  },
  folderIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 74,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 74,
  },
  folderAvatarImage: {
    height: '100%',
    width: '100%',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  folderTags: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  manageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 16,
    padding: 14,
  },
  manageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  manageTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  lockedPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  nameInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  manageActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#EAF1FF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  saveButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '900',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
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
