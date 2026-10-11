import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, View } from 'react-native';
import Touchable from '@/components/app/Touchable';

import Screen from '@/components/app/Screen';
import { useFolderStyles } from '@/components/library/folderDetailStyles';
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
  const [isLoaded, setIsLoaded] = useState(false);
  const { colors, styles } = useFolderStyles();

  useEffect(() => {
    let isMounted = true;

    loadLibraryState()
      .then((state) => {
        if (isMounted) setLibraryState(state);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setIsLoaded(true);
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
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screenBody}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Touchable accessibilityLabel="Quay lại" accessibilityRole="button" onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Touchable>
          <Touchable
            accessibilityLabel="Mở menu bộ từ"
            accessibilityRole="button"
            activeOpacity={0.82}
            onPress={() => setFolderMenuOpen((isOpen) => !isOpen)}
            style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
          </Touchable>
        </View>

        {folderMenuOpen && folder ? (
          <View style={styles.folderMenuPanel}>
            <Text style={styles.folderMenuLabel}>Xuất bộ từ</Text>
            <View style={styles.exportGroup}>
              <Touchable onPress={() => handleExport('csv')} style={styles.exportButton}>
                <Ionicons name="download-outline" size={18} color={colors.accentPrimary} />
                <Text style={styles.exportText}>CSV</Text>
              </Touchable>
              <Touchable onPress={() => handleExport('excel')} style={styles.exportButton}>
                <Ionicons name="grid-outline" size={18} color={colors.accentPrimary} />
                <Text style={styles.exportText}>XLS</Text>
              </Touchable>
            </View>
            <View style={styles.manageHeader}>
              <Text style={styles.manageTitle}>Cài đặt bộ từ</Text>
              {isFavoriteFolder ? <Text style={styles.lockedPill}>Được bảo vệ</Text> : null}
            </View>
            <TextInput
              placeholder="Tên bộ từ"
              placeholderTextColor={colors.textTertiary}
              value={nameDraft}
              onChangeText={setNameDraft}
              style={styles.nameInput}
            />
            <View style={styles.manageActions}>
              <Touchable activeOpacity={0.82} onPress={handleRenameFolder} style={styles.saveButton}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.accentPrimary} />
                <Text style={styles.saveButtonText}>Đổi tên</Text>
              </Touchable>
              {!isFavoriteFolder ? (
                <Touchable activeOpacity={0.82} onPress={handleDeleteFolder} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={18} color={colors.accentError} />
                  <Text style={styles.deleteButtonText}>Xóa</Text>
                </Touchable>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.hero}>
          <View style={[styles.folderIcon, { backgroundColor: folder?.color ?? colors.accentSoft }]}>
            {folder?.avatarUri ? (
              <Image source={{ uri: folder.avatarUri }} style={styles.folderAvatarImage} />
            ) : (
              <Ionicons name="folder-open-outline" size={34} color={colors.textOnPastel} />
            )}
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>Bộ từ</Text>
            <Text style={styles.title}>{folder?.name ?? (isLoaded ? 'Không tìm thấy bộ từ' : 'Đang tải…')}</Text>
            <Text style={styles.subtitle}>{folderWords.length} từ đã lưu</Text>
            {folder?.tags.length ? <Text numberOfLines={1} style={styles.folderTags}>{folder.tags.join(', ')}</Text> : null}
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.accentPrimary} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Tìm từ, nghĩa hoặc ghi chú"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        {folderWords.map((word) => (
          <FolderWordCard key={word.id} word={word} onRemove={() => handleRemoveWord(word)} onSaveNote={handleSaveNote} />
        ))}

        {isLoaded && !folderWords.length ? (
          <View style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={26} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>{query ? 'Không có từ phù hợp' : 'Bộ từ đang trống'}</Text>
            <Text style={styles.emptyText}>
              {query ? 'Thử từ khóa tìm kiếm khác.' : 'Lưu một từ từ màn Tra cứu để bắt đầu xây bộ từ này.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>
      <Touchable
        accessibilityLabel="Lên đầu trang"
        activeOpacity={0.84}
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        style={styles.scrollTopButton}>
        <Ionicons name="arrow-up" size={20} color={colors.textOnAccent} />
      </Touchable>
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
  const { colors, styles } = useFolderStyles();

  useEffect(() => {
    setNoteDraft(word.note);
  }, [word.note]);

  return (
    <View style={styles.wordCard}>
      <View style={styles.wordTopRow}>
        <Link href={{ pathname: '/word', params: { word: word.word } }} asChild>
          <Touchable activeOpacity={0.82} style={styles.wordLink}>
            <Text style={[styles.wordTitle, /[\u0600-\u06FF\u0590-\u05FF]/.test(word.word) && { textAlign: 'right', writingDirection: 'rtl' }]}>{word.word}</Text>
            <Text style={styles.wordMeta}>{word.ipa || 'Đang chờ IPA'}</Text>
          </Touchable>
        </Link>
        <Touchable
          accessibilityLabel={`Gỡ ${word.word} khỏi bộ từ`}
          accessibilityRole="button"
          onPress={onRemove}
          style={styles.removeButton}>
          <Ionicons name="trash-outline" size={18} color={colors.accentError} />
        </Touchable>
      </View>

      <Text numberOfLines={3} style={styles.definition}>{word.definition || 'Đang chờ định nghĩa'}</Text>

      <TextInput
        multiline
        placeholder="Thêm ghi chú"
        placeholderTextColor={colors.textTertiary}
        value={noteDraft}
        onChangeText={setNoteDraft}
        style={styles.noteInput}
      />
      <Touchable
        activeOpacity={0.82}
        onPress={() => onSaveNote(word.id, noteDraft)}
        style={styles.noteButton}>
        <Ionicons name="checkmark-circle-outline" size={18} color={colors.accentPrimary} />
        <Text style={styles.noteButtonText}>Lưu ghi chú</Text>
      </Touchable>
    </View>
  );
}
