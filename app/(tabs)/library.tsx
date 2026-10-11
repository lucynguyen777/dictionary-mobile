import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Touchable from '@/components/app/Touchable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '@/components/app/Screen';
import { useToken } from '@/hooks/use-token';
import { VocabularyImportField, VocabularyImportOptions, VocabularyImportOrientation, VocabularyImportRow, detectHeaderFieldMapping, parseVocabularyCsv } from '@/data/csvImport';
import { FlashcardType, Folder, LibraryState, createFlashcardsFromWordIds, createFolder, duplicateFolder, exportFolderToAnkiTsv, exportFolderToCsv, exportFolderToExcel, FolderExportFormat, shareFolder, getDefaultLibraryState, getFavoriteFolderId, getFolderWords, importVocabularyRowsToFolder, isFavoriteWordsFolder, loadLibraryState, renameFolder, toggleFavoriteFolder, updateFolderColorAndNote } from '@/data/libraryStore';

import { getSortLabel, sortFolders, sortOptions, type FolderSortOption } from '@/components/library/folderSorting';
import { DEFAULT_FOLDER_COLOR, FolderMetadataEditor, folderColorOptions, parseTagDraft } from '@/components/library/FolderMetadataEditor';
import { styles } from '@/components/library/styles';

type LibrarySegment = 'folders' | 'favorites' | 'imported';

type ImportTargetMode = 'new' | 'existing';

type AddPanelMode = 'choice' | 'create' | 'import';

type FolderViewMode = 'grid' | 'list';

const defaultImportOptions: VocabularyImportOptions = {
  orientation: 'rows',
  hasHeader: true,
  primaryField: 'word',
};

const importOrientationOptions: { value: VocabularyImportOrientation; label: string; description: string }[] = [
  { value: 'rows', label: 'Theo hàng', description: 'Mỗi dòng là một từ.' },
  { value: 'columns', label: 'Theo cột', description: 'Mỗi cột là một từ.' },
];

const primaryFieldOptions: { value: VocabularyImportField; label: string }[] = [
  { value: 'word', label: 'Word' },
  { value: 'definition', label: 'Definition' },
  { value: 'ipa', label: 'IPA' },
  { value: 'note', label: 'Note' },
];

const segments: { key: LibrarySegment; label: string }[] = [
  { key: 'folders', label: 'Bộ từ' },
  { key: 'favorites', label: 'Yêu thích' },
  { key: 'imported', label: 'Đã nhập' },
];

const viewModeOptions: { value: FolderViewMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'grid', label: 'Lưới', icon: 'grid-outline' },
  { value: 'list', label: 'Danh sách', icon: 'list-outline' },
];

const FAB_SIZE = 48;

const FAB_BOTTOM_GAP = 16;

const SCROLL_BOTTOM_PADDING = 148;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, radius, shadows } = useToken();
  const themed = useMemo(
    () =>
      StyleSheet.create({
        activeChip: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.accentPrimary,
        },
        activeChipText: {
          color: colors.accentPrimary,
        },
        bottomSheet: {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.borderDefault,
          ...shadows.lg,
        },
        card: {
          backgroundColor: colors.surface,
          borderColor: colors.borderDefault,
          ...shadows.sm,
        },
        dangerText: {
          color: colors.accentError,
        },
        input: {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.borderDefault,
          color: colors.textPrimary,
        },
        mutedPanel: {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.borderDefault,
        },
        mutedText: {
          color: colors.textSecondary,
        },
        primaryText: {
          color: colors.textPrimary,
        },
        primaryButton: {
          backgroundColor: colors.accentPrimary,
          borderRadius: radius.md,
          ...shadows.glow,
        },
        secondaryButton: {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.borderDefault,
        },
        segment: {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.borderDefault,
          borderWidth: 1,
        },
        surface: {
          backgroundColor: colors.canvasAlt,
        },
        tonalButton: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.focusRing,
        },
      }),
    [colors, radius.md, shadows.glow, shadows.lg, shadows.sm]
  );
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [query, setQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState<LibrarySegment>('folders');
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [addPanelMode, setAddPanelMode] = useState<AddPanelMode>('choice');
  const [folderNameDraft, setFolderNameDraft] = useState('');
  const [createFolderError, setCreateFolderError] = useState('');
  const [folderColorDraft, setFolderColorDraft] = useState(DEFAULT_FOLDER_COLOR);
  const [folderColorNoteDraft, setFolderColorNoteDraft] = useState('');
  const [folderTagsDraft, setFolderTagsDraft] = useState('');
  const [folderAvatarDraft, setFolderAvatarDraft] = useState('');
  const [importCsvContent, setImportCsvContent] = useState('');
  const [importRows, setImportRows] = useState<VocabularyImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importOptions, setImportOptions] = useState<VocabularyImportOptions>(defaultImportOptions);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importFieldMapping, setImportFieldMapping] = useState<Record<number, VocabularyImportField | 'ignore'>>({});
  const [importFolderName, setImportFolderName] = useState('');
  const [importTargetMode, setImportTargetMode] = useState<ImportTargetMode>('new');
  const [selectedImportFolderId, setSelectedImportFolderId] = useState('');
  const [shouldCreateImportFlashcards, setShouldCreateImportFlashcards] = useState(false);
  const [folderSort, setFolderSort] = useState<FolderSortOption>('recent');
  const [folderViewMode, setFolderViewMode] = useState<FolderViewMode>('grid');
  const [activeFolderMenuId, setActiveFolderMenuId] = useState('');
  const [colorPickerFolderId, setColorPickerFolderId] = useState('');
  const [selectedColorDraft, setSelectedColorDraft] = useState('');
  const [colorNoteDraft, setColorNoteDraft] = useState('');
  const [renameFolderId, setRenameFolderId] = useState('');
  const [renameDraft, setRenameDraft] = useState('');
  const [renameError, setRenameError] = useState('');
  const [sortPanelOpen, setSortPanelOpen] = useState(false);

  const closeFolderControls = useCallback(() => {
    setSortPanelOpen(false);
    setActiveFolderMenuId('');
  }, []);

  const floatingButtonBottom = FAB_BOTTOM_GAP + Math.max(insets.bottom, Platform.OS === 'web' ? 8 : 0);
  const scrollBottomPadding = SCROLL_BOTTOM_PADDING + Math.max(insets.bottom, Platform.OS === 'web' ? 8 : 0);

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
    const foldersBySegment = libraryState.folders.filter((folder) => {
      if (activeSegment === 'favorites') return folder.isFavorite && !isFavoriteWordsFolder(folder.id);
      if (activeSegment === 'imported') {
        return libraryState.savedWords.some((word) => word.source === 'import' && word.folderIds.includes(folder.id));
      }

      return true;
    });

    const searchedFolders = normalizedQuery
      ? foldersBySegment.filter((folder) => folder.name.toLowerCase().includes(normalizedQuery))
      : foldersBySegment;

    return [...searchedFolders].sort((leftFolder, rightFolder) => sortFolders(leftFolder, rightFolder, folderSort, libraryState));
  }, [activeSegment, folderSort, libraryState, query]);

  const recentWords = libraryState.savedWords.slice(0, 6);
  const importTargetFolders = libraryState.folders.filter((folder) => folder.id !== getFavoriteFolderId());
  const folderMetadataReady = addPanelMode === 'create' ? Boolean(folderNameDraft.trim()) : Boolean(importFileName);
  const folderMetadata = {
    color: folderColorDraft,
    colorNote: folderColorNoteDraft,
    tags: parseTagDraft(folderTagsDraft),
    avatarUri: folderAvatarDraft,
  };

  const resetAddFolderDrafts = () => {
    setFolderNameDraft('');
    setCreateFolderError('');
    setFolderColorDraft(DEFAULT_FOLDER_COLOR);
    setFolderColorNoteDraft('');
    setFolderTagsDraft('');
    setFolderAvatarDraft('');
  };

  const closeAddPanel = () => {
    setCreatePanelOpen(false);
    setAddPanelMode('choice');
    resetAddFolderDrafts();
  };

  const updateImportOptions = (nextOptions: VocabularyImportOptions) => {
    setImportOptions(nextOptions);

    if (!importCsvContent) return;

    const parsed = parseVocabularyCsv(importCsvContent, nextOptions);
    setImportRows(parsed.rows);
    setImportErrors(parsed.errors);
    setImportHeaders(parsed.headers ?? []);
  };

  const handleCycleImportFieldMapping = (index: number) => {
    const order: (VocabularyImportField | 'ignore')[] = ['ignore', 'word', 'definition', 'ipa', 'note', 'tags'];
    const current = importFieldMapping[index] ?? 'ignore';
    const next = order[(order.indexOf(current) + 1) % order.length];
    const nextMapping = { ...importFieldMapping, [index]: next };

    setImportFieldMapping(nextMapping);
    updateImportOptions({ ...importOptions, fieldMapping: nextMapping });
  };

  const handleOpenCreateFolder = () => {
    setCreatePanelOpen((isOpen) => {
      if (!isOpen) {
        setAddPanelMode('choice');
        setCreateFolderError('');
      }

      return !isOpen;
    });
  };

  const handleCreateFolder = () => {
    const trimmedName = folderNameDraft.trim();

    if (!trimmedName) {
      setCreateFolderError('Nhập tên bộ từ trước khi tạo.');
      return;
    }

    if (libraryState.folders.some((folder) => folder.name.toLowerCase() === trimmedName.toLowerCase())) {
      setCreateFolderError('Tên bộ từ này đã tồn tại.');
      return;
    }

    createFolder(libraryState, trimmedName, folderMetadata).then((nextState) => {
      setLibraryState(nextState);
      closeAddPanel();
      setActiveSegment('folders');
      setQuery('');
    });
  };

  const handleExportFolder = async (folderId: string, format: 'csv' | 'excel' | 'anki') => {
    try {
      const result =
        format === 'excel'
          ? await exportFolderToExcel(libraryState, folderId)
          : format === 'anki'
          ? await exportFolderToAnkiTsv(libraryState, folderId)
          : await exportFolderToCsv(libraryState, folderId);

      Alert.alert(result.ok ? 'Xuất dữ liệu xong' : 'Chưa thể xuất dữ liệu', result.message);
    } catch (error) {
      Alert.alert('Xuất dữ liệu thất bại', error instanceof Error ? error.message : 'Chưa thể xuất bộ từ này.');
    }
  };

  const handleShareFolder = async (folderId: string, format: FolderExportFormat) => {
    try {
      setActiveFolderMenuId('');
      const result = await shareFolder(libraryState, folderId, format);

      if (!result.ok) {
        Alert.alert('Chia sẻ thất bại', result.message);
        return;
      }

      if (result.shared) return;

      const uri = result.uri;
      if (uri) {
        Alert.alert('Chưa hỗ trợ chia sẻ trực tiếp', result.message, [
          { text: 'Đóng', style: 'cancel' },
          {
            text: 'Mở file',
            onPress: () => {
              Linking.openURL(uri).catch(() => Alert.alert('Không thể mở file', 'Hãy dùng mục Download để lưu file trên thiết bị.'));
            },
          },
        ]);
        return;
      }

      Alert.alert('Chia sẻ', result.message);
    } catch (error) {
      Alert.alert('Chia sẻ thất bại', error instanceof Error ? error.message : 'Không thể chia sẻ bộ từ này.');
    }
  };

  const handleToggleFolderMenu = (folderId: string) => {
    setSortPanelOpen(false);
    setActiveFolderMenuId((current) => (current === folderId ? '' : folderId));
  };


  const handleToggleFavoriteFolder = (folder: Folder) => {
    if (isFavoriteWordsFolder(folder.id)) {
      setActiveFolderMenuId('');
      Alert.alert(
        'Bộ từ hệ thống',
        'Bộ Favorites này đang dùng cho các từ vựng được yêu thích. Folder favorite riêng sẽ áp dụng cho các bộ từ khác.'
      );
      return;
    }

    toggleFavoriteFolder(libraryState, folder.id).then((nextState) => {
      setLibraryState(nextState);
      setActiveFolderMenuId('');
    });
  };

  const handleDuplicateFolder = (folder: Folder) => {
    if (isFavoriteWordsFolder(folder.id)) {
      setActiveFolderMenuId('');
      Alert.alert('Bộ từ hệ thống', 'Bộ Favorites dùng cho từ vựng yêu thích nên chưa hỗ trợ tạo bản sao.');
      return;
    }

    duplicateFolder(libraryState, folder.id).then((nextState) => {
      const copiedFolder = nextState.folders.find((item) => item.id !== folder.id && item.name.startsWith(`${folder.name} copy`));

      setLibraryState(nextState);
      setActiveFolderMenuId('');
      setActiveSegment('folders');
      Alert.alert('Đã tạo bản sao', copiedFolder ? `"${copiedFolder.name}" đã được thêm vào tủ từ.` : 'Bộ từ đã được sao chép.');
    });
  };

  const handlePickCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        base64: false,
        copyToCacheDirectory: true,
        type: ['text/csv', 'text/comma-separated-values', 'text/tab-separated-values', 'text/plain'],
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const csv = asset.file ? await asset.file.text() : await new File(asset.uri).text();
      const parsed = parseVocabularyCsv(csv, defaultImportOptions);
      const defaultFolderName = asset.name.replace(/\.[^/.]+$/, '').trim() || 'Từ đã nhập';
      const autoMapping = parsed.headers ? detectHeaderFieldMapping(parsed.headers) : {};
      const nextImportOptions = { ...defaultImportOptions, fieldMapping: autoMapping };
      const mappedParsed = parseVocabularyCsv(csv, nextImportOptions);

      setImportCsvContent(csv);
      setImportRows(mappedParsed.rows);
      setImportErrors(mappedParsed.errors);
      setImportFileName(asset.name);
      setImportOptions(nextImportOptions);
      setImportHeaders(mappedParsed.headers ?? []);
      setImportFieldMapping(autoMapping);
      setImportFolderName(defaultFolderName);
      setImportTargetMode('new');
      setSelectedImportFolderId(importTargetFolders[0]?.id ?? '');
      setShouldCreateImportFlashcards(false);
      setAddPanelMode('import');
      setCreatePanelOpen(true);
      setFolderColorDraft(DEFAULT_FOLDER_COLOR);
      setFolderColorNoteDraft('');
      setFolderTagsDraft('');
      setFolderAvatarDraft('');
    } catch (error) {
      Alert.alert('Import thất bại', error instanceof Error ? error.message : 'Chưa thể đọc file CSV/TSV này.');
    }
  };

  const handleImportCsv = () => {
    if (!importRows.length) {
      Alert.alert('Chưa thể import', 'Chọn một CSV hợp lệ trước khi import.');
      return;
    }

    const targetFolder = libraryState.folders.find((folder) => folder.id === selectedImportFolderId);
    const importTarget =
      importTargetMode === 'existing' && targetFolder
        ? { folderId: targetFolder.id, folderName: targetFolder.name, ...folderMetadata }
        : { folderName: importFolderName, ...folderMetadata };
    const importedWordIds = importRows.map((row) => `word-${row.word.toLowerCase()}`);

    importVocabularyRowsToFolder(libraryState, importRows, importTarget).then((nextState) => {
      if (!shouldCreateImportFlashcards) return nextState;

      // Auto-select flashcard types based on imported data fields
      const hasDefinition = importRows.some((r) => (r.definition ?? '').trim());
      const hasIpa = importRows.some((r) => (r.ipa ?? '').trim());
      const types: FlashcardType[] = [];
      if (hasDefinition) {
        types.push('bilingual');
        types.push('word-definition');
      }
      if (hasIpa) types.push('word-pronunciation');
      if (!types.length) types.push('bilingual');

      return createFlashcardsFromWordIds(nextState, importedWordIds, types);
    }).then((nextState) => {
      const folderLabel = importTarget.folderName || 'Từ đã nhập';

      setLibraryState(nextState);
      Alert.alert(
        'Import xong',
        `Đã import ${importRows.length} từ vào "${folderLabel}"${
          shouldCreateImportFlashcards ? ' và tạo flashcard.' : '.'
        }`
      );
      setImportRows([]);
      setImportErrors([]);
      setImportCsvContent('');
      setImportFileName('');
      setImportOptions(defaultImportOptions);
      setImportHeaders([]);
      setImportFieldMapping({});
      setImportFolderName('');
      setImportTargetMode('new');
      setSelectedImportFolderId('');
      setShouldCreateImportFlashcards(false);
      closeAddPanel();
      setActiveSegment('folders');
      setQuery('');
    });
  };

  return (
    <Screen>
      <View style={[styles.screenBody, themed.surface]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        onScrollBeginDrag={closeFolderControls}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, themed.mutedText]}>Thư viện</Text>
            <Text style={[styles.title, themed.primaryText]}>Tủ từ của bạn</Text>
          </View>
        </View>

        <View style={[styles.segment, themed.segment]}>
          {segments.map((segment) => {
            const isActive = activeSegment === segment.key;

            return (
              <Touchable
                key={segment.key}
                activeOpacity={0.82}
                onPress={() => setActiveSegment(segment.key)}
                style={isActive ? [styles.segmentActive, themed.activeChip] : styles.segmentItem}>
                <Text style={isActive ? [styles.segmentActiveText, themed.activeChipText] : [styles.segmentText, themed.mutedText]}>{segment.label}</Text>
              </Touchable>
            );
          })}
        </View>

        <View style={[styles.searchBox, themed.card]}>
          <Ionicons name="search" size={20} color={colors.accentPrimary} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Tìm bộ từ đã lưu"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, themed.primaryText]}
          />
        </View>

        <View style={styles.toolbar}>
          <Touchable
            activeOpacity={0.82}
            onPress={() => {
              setActiveFolderMenuId('');
              setSortPanelOpen((isOpen) => !isOpen);
            }}
            style={[styles.toolbarLeft, themed.card]}>
            <Ionicons name="swap-vertical" size={18} color={colors.textSecondary} />
            <Text ellipsizeMode="tail" numberOfLines={1} style={[styles.toolbarText, themed.mutedText]}>
              {getSortLabel(folderSort)}
            </Text>
            <Ionicons name="chevron-down" size={15} color={colors.textTertiary} />
          </Touchable>
          <View style={[styles.viewToggle, themed.card]}>
            {viewModeOptions.map((option) => {
              const isActive = folderViewMode === option.value;

              return (
                <Touchable
                  key={option.value}
                  accessibilityLabel={`Đổi sang dạng ${option.label}`}
                  activeOpacity={0.78}
                  onPress={() => {
                    setActiveFolderMenuId('');
                    setSortPanelOpen(false);
                    setFolderViewMode(option.value);
                  }}
                  style={[styles.viewIconButton, isActive && styles.viewIconButtonActive, isActive && themed.tonalButton]}>
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={isActive ? colors.accentPrimary : colors.textTertiary}
                  />
                </Touchable>
              );
            })}
          </View>
        </View>
        {sortPanelOpen ? (
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.optionStrip}
            style={styles.folderControlsDropdown}>
            {sortOptions.map((option) => {
              const isActive = folderSort === option.value;

              return (
                <Touchable
                  key={option.value}
                  activeOpacity={0.82}
                  onPress={() => {
                    setFolderSort(option.value);
                    setSortPanelOpen(false);
                  }}
                  style={[styles.controlChip, themed.card, isActive && styles.controlChipActive, isActive && themed.activeChip]}>
                  <Text style={[styles.controlChipText, themed.mutedText, isActive && styles.controlChipTextActive, isActive && themed.activeChipText]}>{option.label}</Text>
                </Touchable>
              );
            })}
          </ScrollView>
        ) : null}
        <View style={[styles.grid, folderViewMode !== 'grid' && styles.gridList]}>
          {filteredFolders.map((folder) => {
            const wordCount = getFolderWords(libraryState, folder.id).length;
            const isList = folderViewMode === 'list';

            return (
            <Touchable
              key={folder.id}
              style={[
                styles.folderCard,
                themed.card,
                isList && styles.folderCardList,
                activeFolderMenuId === folder.id && styles.folderCardMenuOpen,
                activeFolderMenuId === folder.id && { borderColor: colors.focusRing },
              ]}
              activeOpacity={0.85}
              onPress={() => {
                if (activeFolderMenuId === folder.id) {
                  setActiveFolderMenuId('');
                  return;
                }

                router.push(`/folder/${folder.id}` as never);
              }}>
              <View style={isList && styles.folderContentList}>
                <View style={[styles.cover, isList && styles.coverList, { backgroundColor: folder.color }]}>
                  {folder.avatarUri ? (
                    <Image source={{ uri: folder.avatarUri }} style={styles.folderAvatarImage} />
                  ) : (
                    <Ionicons name="folder-open-outline" size={28} color={colors.textOnPastel} />
                  )}
                </View>
                <View style={[styles.folderInfo, isList && styles.folderInfoList]}>
                  <View style={styles.folderCopy}>
                    <View style={styles.folderNameRow}>
                      <Text numberOfLines={1} style={[styles.folderName, themed.primaryText]}>{folder.name}</Text>
                      {folder.isFavorite ? (
                        <View style={styles.folderFavoritePill}>
                          <Ionicons name="star" size={11} color="#B45309" />
                          <Text style={styles.folderFavoriteText}>Bộ từ yêu thích</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.wordNumber, themed.mutedText]}>{wordCount} từ</Text>
                    {folder.tags.length ? (
                      <Text numberOfLines={1} style={[styles.folderTagText, themed.mutedText]}>{folder.tags.join(', ')}</Text>
                    ) : null}
                  </View>
                  <Touchable
                    activeOpacity={0.78}
                    onPress={(event) => {
                      event.stopPropagation();
                      handleToggleFolderMenu(folder.id);
                    }}
                    style={[styles.folderMenuButton, themed.secondaryButton]}>
                    <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
                  </Touchable>
                </View>
              </View>
              {activeFolderMenuId === folder.id ? (
                <ScrollView
                  nestedScrollEnabled
                  style={[styles.folderActionPanel, themed.mutedPanel]}
                  onStartShouldSetResponder={() => true}
                  showsVerticalScrollIndicator={false}>
                  <Touchable
                    activeOpacity={0.78}
                    onPress={() => handleToggleFavoriteFolder(folder)}
                    style={styles.folderActionRow}>
                    <Ionicons name={folder.isFavorite ? 'star' : 'star-outline'} size={17} color={folder.isFavorite ? '#D97706' : '#64748B'} />
                    <Text style={styles.folderActionText}>
                      {folder.isFavorite ? 'Gỡ khỏi bộ từ yêu thích' : 'Thêm bộ từ vào yêu thích'}
                    </Text>
                  </Touchable>
                  <Touchable
                    activeOpacity={0.78}
                    onPress={() => handleDuplicateFolder(folder)}
                    style={styles.folderActionRow}>
                    <Ionicons name="copy-outline" size={17} color="#64748B" />
                    <Text style={styles.folderActionText}>Tạo bản sao</Text>
                  </Touchable>
                  <Touchable
                    activeOpacity={0.78}
                    onPress={() => {
                      setActiveFolderMenuId('');
                      setColorPickerFolderId(folder.id);
                        setSelectedColorDraft(folder.color);
                        setColorNoteDraft(folder.colorNote ?? '');
                    }}
                    style={styles.folderActionRow}>
                    <Ionicons name="color-palette-outline" size={17} color="#64748B" />
                    <Text style={styles.folderActionText}>Thay đổi màu sắc</Text>
                  </Touchable>
                  <Touchable
                    activeOpacity={0.78}
                    onPress={() => {
                      setActiveFolderMenuId('');
                      setRenameFolderId(folder.id);
                      setRenameDraft(folder.name);
                      setRenameError('');
                    }}
                    style={styles.folderActionRow}>
                    <Ionicons name="pencil-outline" size={17} color="#64748B" />
                    <Text style={styles.folderActionText}>Rename</Text>
                  </Touchable>
                  <View style={styles.folderActionDivider} />
                  <Text style={styles.folderActionLabel}>Download</Text>
                  <View style={styles.downloadRow}>
                    {[
                      { label: 'CSV', format: 'csv' as const },
                      { label: 'XLS', format: 'excel' as const },
                      { label: 'Anki', format: 'anki' as const },
                    ].map((item) => (
                      <Touchable
                        key={item.format}
                        activeOpacity={0.78}
                        onPress={() => {
                          setActiveFolderMenuId('');
                          handleExportFolder(folder.id, item.format);
                        }}
                        style={styles.downloadChip}>
                        <Text style={styles.downloadChipText}>{item.label}</Text>
                      </Touchable>
                    ))}
                  </View>
                  <View style={styles.folderActionDivider} />
                  <Text style={styles.folderActionLabel}>Chia sẻ</Text>
                  <View style={styles.downloadRow}>
                    {[
                      { label: 'CSV', format: 'csv' as const },
                      { label: 'XLS', format: 'excel' as const },
                      { label: 'Anki', format: 'anki' as const },
                    ].map((item) => (
                      <Touchable
                        key={`share-${item.format}`}
                        activeOpacity={0.78}
                        onPress={() => handleShareFolder(folder.id, item.format)}
                        style={styles.shareChip}>
                        <Ionicons name="share-social-outline" size={13} color="#0F766E" />
                        <Text style={styles.shareChipText}>{item.label}</Text>
                      </Touchable>
                    ))}
                  </View>
                </ScrollView>
              ) : null}
            </Touchable>
            );
          })}
        </View>
        {!filteredFolders.length ? <Text style={styles.emptyText}>{getEmptyFolderText(activeSegment, query)}</Text> : null}

        <Text style={styles.sectionTitle}>Vừa lưu</Text>
        {recentWords.map((entry) => (
          <Link key={entry.id} href={{ pathname: '/word', params: { word: entry.word } }} asChild>
            <Touchable activeOpacity={0.82} style={styles.savedWord}>
              <View style={styles.savedWordCopy}>
                <Text style={[styles.savedWordTitle, /[\u0600-\u06FF\u0590-\u05FF]/.test(entry.word) && { textAlign: 'right', writingDirection: 'rtl' }]}>{entry.word}</Text>
                <Text style={styles.savedWordMeta}>{entry.definition || 'Từ đã lưu'} · {entry.ipa || 'Đang chờ IPA'}</Text>
                {entry.note ? <Text numberOfLines={2} style={styles.savedWordNote}>{entry.note}</Text> : null}
              </View>
              <View style={styles.savedTag}>
                <Text style={styles.savedTagText}>{entry.folderIds.length} bộ</Text>
              </View>
            </Touchable>
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
      {createPanelOpen ? (
        <View style={styles.addSheetOverlay}>
          <Touchable activeOpacity={1} onPress={closeAddPanel} style={styles.addSheetBackdrop} />
          <View style={[styles.addSheet, themed.bottomSheet, { paddingBottom: 16 + Math.max(insets.bottom, Platform.OS === 'web' ? 8 : 0) }]}>
            <ScrollView
              contentContainerStyle={styles.addSheetContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}>
              {addPanelMode === 'choice' ? (
                <>
                  <Text style={[styles.addSheetTitle, themed.primaryText]}>Thêm vào Tủ từ</Text>
                  <Touchable activeOpacity={0.84} onPress={() => setAddPanelMode('create')} style={[styles.addChoiceCard, themed.mutedPanel]}>
                    <Ionicons name="folder-outline" size={23} color={colors.accentPrimary} />
                    <View style={styles.addChoiceCopy}>
                      <Text style={[styles.addChoiceTitle, themed.primaryText]}>Tạo mới</Text>
                      <Text style={[styles.addChoiceText, themed.mutedText]}>Đặt tên, chọn màu, tag và ảnh đại diện cho bộ từ.</Text>
                    </View>
                  </Touchable>
                  <Touchable activeOpacity={0.84} onPress={handlePickCsv} style={[styles.addChoiceCard, themed.mutedPanel]}>
                    <Ionicons name="cloud-upload-outline" size={23} color={colors.accentPrimary} />
                    <View style={styles.addChoiceCopy}>
                      <Text style={[styles.addChoiceTitle, themed.primaryText]}>Tải lên file</Text>
                      <Text style={[styles.addChoiceText, themed.mutedText]}>Chọn CSV/TSV, đổi tên và cấu hình bộ từ trước khi import.</Text>
                    </View>
                  </Touchable>
                  <Touchable activeOpacity={0.82} onPress={closeAddPanel} style={[styles.addSheetClose, themed.secondaryButton]}>
                    <Text style={[styles.addSheetCloseText, themed.mutedText]}>Đóng</Text>
                  </Touchable>
                </>
              ) : null}
              {addPanelMode === 'create' ? (
                <>
                  <View style={styles.addSheetHeaderRow}>
                    <Touchable accessibilityLabel="Quay lại" accessibilityRole="button" activeOpacity={0.78} onPress={() => setAddPanelMode('choice')} style={[styles.addBackButton, themed.tonalButton]}>
                      <Ionicons name="chevron-back" size={18} color={colors.accentPrimary} />
                    </Touchable>
                    <Text style={[styles.addSheetTitle, themed.primaryText]}>Tạo bộ từ mới</Text>
                  </View>
                  <View style={[styles.createInputBox, themed.input]}>
                    <Ionicons name="folder-outline" size={19} color={colors.accentPrimary} />
                    <TextInput
                      autoCorrect={false}
                      onChangeText={(text) => {
                        setFolderNameDraft(text);
                        setCreateFolderError('');
                      }}
                      placeholder="Tên bộ từ"
                      placeholderTextColor={colors.textTertiary}
                      style={[styles.createInput, themed.primaryText]}
                      value={folderNameDraft}
                    />
                  </View>
                  {createFolderError ? <Text style={styles.createError}>{createFolderError}</Text> : null}
                  {folderMetadataReady ? (
                    <FolderMetadataEditor
                      avatarUri={folderAvatarDraft}
                      color={folderColorDraft}
                      colorNote={folderColorNoteDraft}
                      onAvatarUriChange={setFolderAvatarDraft}
                      onColorChange={setFolderColorDraft}
                      onColorNoteChange={setFolderColorNoteDraft}
                      onTagsChange={setFolderTagsDraft}
                      tags={folderTagsDraft}
                    />
                  ) : null}
                  <View style={styles.addSheetActions}>
                    <Touchable activeOpacity={0.82} onPress={closeAddPanel} style={[styles.addSheetSecondary, themed.secondaryButton]}>
                      <Text style={[styles.addSheetSecondaryText, themed.mutedText]}>Hủy</Text>
                    </Touchable>
                    <Touchable activeOpacity={0.84} onPress={handleCreateFolder} style={[styles.addSheetPrimary, themed.primaryButton]}>
                      <Text style={styles.addSheetPrimaryText}>Tạo bộ từ</Text>
                    </Touchable>
                  </View>
                </>
              ) : null}
              {addPanelMode === 'import' ? (
                <>
                  <View style={styles.addSheetHeaderRow}>
                    <Touchable accessibilityLabel="Quay lại" accessibilityRole="button" activeOpacity={0.78} onPress={() => setAddPanelMode('choice')} style={[styles.addBackButton, themed.tonalButton]}>
                      <Ionicons name="chevron-back" size={18} color={colors.accentPrimary} />
                    </Touchable>
                    <Text style={[styles.addSheetTitle, themed.primaryText]}>Tải lên file</Text>
                  </View>
                  <Touchable activeOpacity={0.82} onPress={handlePickCsv} style={[styles.importPickButton, themed.tonalButton]}>
                    <Ionicons name="cloud-upload-outline" size={18} color={colors.accentPrimary} />
                    <Text style={[styles.importPickText, themed.activeChipText]}>{importFileName ? 'Đổi file' : 'Chọn CSV/TSV'}</Text>
                  </Touchable>
                  {importFileName ? (
                    <>
                      <Text style={[styles.importFileName, themed.mutedText]}>{importFileName} · {importRows.length} từ hợp lệ</Text>
                      <FolderMetadataEditor
                        avatarUri={folderAvatarDraft}
                        color={folderColorDraft}
                        colorNote={folderColorNoteDraft}
                        onAvatarUriChange={setFolderAvatarDraft}
                        onColorChange={setFolderColorDraft}
                        onColorNoteChange={setFolderColorNoteDraft}
                        onTagsChange={setFolderTagsDraft}
                        tags={folderTagsDraft}
                      />
                      <View style={styles.importConfigPanel}>
                        <Text style={styles.importConfigLabel}>Cách đọc dữ liệu</Text>
                        <View style={styles.importOptionGrid}>
                          {importOrientationOptions.map((option) => {
                            const isSelected = importOptions.orientation === option.value;

                            return (
                              <Touchable
                                key={option.value}
                                activeOpacity={0.82}
                                onPress={() => {
                                  const nextOptions = { ...importOptions, orientation: option.value, fieldMapping: {} };
                                  setImportFieldMapping({});
                                  updateImportOptions(nextOptions);
                                }}
                                style={[styles.importOptionCard, isSelected && styles.activeImportOptionCard]}>
                                <Ionicons
                                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                  size={17}
                                  color={isSelected ? '#7C3AED' : '#94A3B8'}
                                />
                                <View style={styles.importOptionCopy}>
                                  <Text style={[styles.importOptionTitle, isSelected && styles.activeImportOptionTitle]}>
                                    {option.label}
                                  </Text>
                                  <Text style={styles.importOptionText}>{option.description}</Text>
                                </View>
                              </Touchable>
                            );
                          })}
                        </View>
                        <Touchable
                          activeOpacity={0.82}
                          onPress={() => {
                            const nextOptions = { ...importOptions, hasHeader: !importOptions.hasHeader, fieldMapping: {} };
                            setImportFieldMapping({});
                            updateImportOptions(nextOptions);
                          }}
                          style={styles.importHeaderToggle}>
                          <Ionicons
                            name={importOptions.hasHeader ? 'checkbox' : 'square-outline'}
                            size={20}
                            color={importOptions.hasHeader ? '#7C3AED' : '#94A3B8'}
                          />
                          <View style={styles.importFlashcardCopy}>
                            <Text style={styles.importFlashcardTitle}>Dùng hàng/cột đầu làm tên trường</Text>
                            <Text style={styles.importFlashcardText}>
                              Bật khi file có nhãn như word, definition, ipa, note, tags.
                            </Text>
                          </View>
                        </Touchable>
                        {importHeaders.length ? (
                          <>
                            <Text style={styles.importConfigLabel}>Mapping trường</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mappingRow}>
                              {importHeaders.map((header, index) => {
                                const mapped = importFieldMapping[index] ?? 'ignore';

                                return (
                                  <View key={`${header}-${index}`} style={styles.mappingCard}>
                                    <Text style={styles.mappingHeader} numberOfLines={1}>{header || `Trường ${index + 1}`}</Text>
                                    <Touchable
                                      activeOpacity={0.82}
                                      onPress={() => handleCycleImportFieldMapping(index)}
                                      style={[styles.mappingButton, mapped !== 'ignore' && styles.mappingButtonActive]}>
                                      <Text style={[styles.mappingButtonText, mapped !== 'ignore' && styles.mappingButtonTextActive]}>
                                        {mapped === 'ignore' ? 'Bỏ qua' : mapped}
                                      </Text>
                                    </Touchable>
                                  </View>
                                );
                              })}
                            </ScrollView>
                          </>
                        ) : null}
                        <Text style={styles.importConfigLabel}>Khóa chính</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.importPrimaryRow}>
                          {primaryFieldOptions.map((option) => {
                            const isSelected = importOptions.primaryField === option.value;

                            return (
                              <Touchable
                                key={option.value}
                                activeOpacity={0.82}
                                onPress={() => updateImportOptions({ ...importOptions, primaryField: option.value })}
                                style={[styles.importPrimaryChip, isSelected && styles.activeImportPrimaryChip]}>
                                <Text style={[styles.importPrimaryText, isSelected && styles.activeImportPrimaryText]}>
                                  {option.label}
                                </Text>
                              </Touchable>
                            );
                          })}
                        </ScrollView>
                      </View>
                      <View style={styles.importModeRow}>
                        <Touchable
                          activeOpacity={0.82}
                          onPress={() => setImportTargetMode('new')}
                          style={[styles.importModeButton, importTargetMode === 'new' && styles.activeImportModeButton]}>
                          <Ionicons
                            name={importTargetMode === 'new' ? 'radio-button-on' : 'radio-button-off'}
                            size={17}
                            color={importTargetMode === 'new' ? '#7C3AED' : '#94A3B8'}
                          />
                          <Text style={[styles.importModeText, importTargetMode === 'new' && styles.activeImportModeText]}>
                            Bộ từ mới
                          </Text>
                        </Touchable>
                        <Touchable
                          activeOpacity={0.82}
                          onPress={() => {
                            setImportTargetMode('existing');
                            setSelectedImportFolderId((current) => current || importTargetFolders[0]?.id || '');
                          }}
                          style={[styles.importModeButton, importTargetMode === 'existing' && styles.activeImportModeButton]}>
                          <Ionicons
                            name={importTargetMode === 'existing' ? 'radio-button-on' : 'radio-button-off'}
                            size={17}
                            color={importTargetMode === 'existing' ? '#7C3AED' : '#94A3B8'}
                          />
                          <Text style={[styles.importModeText, importTargetMode === 'existing' && styles.activeImportModeText]}>
                            Bộ từ có sẵn
                          </Text>
                        </Touchable>
                      </View>
                      {importTargetMode === 'new' ? (
                        <View style={styles.createInputBox}>
                          <Ionicons name="folder-outline" size={19} color="#7C3AED" />
                          <TextInput
                            autoCorrect={false}
                            onChangeText={setImportFolderName}
                            placeholder="Tên bộ từ sau khi import"
                            placeholderTextColor="#94A3B8"
                            style={styles.createInput}
                            value={importFolderName}
                          />
                        </View>
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.importFolderRow}>
                          {importTargetFolders.map((folder) => {
                            const isSelected = selectedImportFolderId === folder.id;

                            return (
                              <Touchable
                                key={folder.id}
                                activeOpacity={0.82}
                                onPress={() => setSelectedImportFolderId(folder.id)}
                                style={[styles.importFolderChip, isSelected && styles.activeImportFolderChip]}>
                                <Text
                                  numberOfLines={1}
                                  style={[styles.importFolderChipText, isSelected && styles.activeImportFolderChipText]}>
                                  {folder.name}
                                </Text>
                              </Touchable>
                            );
                          })}
                        </ScrollView>
                      )}
                      <Touchable
                        activeOpacity={0.82}
                        onPress={() => setShouldCreateImportFlashcards((value) => !value)}
                        style={styles.importFlashcardToggle}>
                        <Ionicons
                          name={shouldCreateImportFlashcards ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={shouldCreateImportFlashcards ? '#7C3AED' : '#94A3B8'}
                        />
                        <View style={styles.importFlashcardCopy}>
                          <Text style={styles.importFlashcardTitle}>Tạo flashcard sau import</Text>
                          <Text style={styles.importFlashcardText}>Tạo thẻ bilingual và từ-nghĩa cho các từ vừa nhập.</Text>
                        </View>
                      </Touchable>
                      {importRows.slice(0, 3).map((row) => (
                        <View key={row.word} style={styles.importPreviewRow}>
                          <Text style={styles.importPreviewWord}>{row.word}</Text>
                          <Text numberOfLines={1} style={styles.importPreviewDefinition}>{row.definition || row.ipa || 'Chưa có định nghĩa'}</Text>
                        </View>
                      ))}
                      {importErrors.slice(0, 4).map((error) => (
                        <Text key={error} style={styles.importError}>{error}</Text>
                      ))}
                      <Touchable activeOpacity={0.82} onPress={handleImportCsv} style={styles.importSubmitButton}>
                        <Text style={styles.importSubmitText}>Import vào bộ từ</Text>
                      </Touchable>
                    </>
                  ) : (
                    <Text style={styles.importHint}>
                      CSV/TSV có thể đọc theo hàng hoặc theo cột. Các trường hỗ trợ: word, definition, ipa, note, tags.
                    </Text>
                  )}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      ) : null}
      {colorPickerFolderId ? (
        <View style={styles.colorPickerOverlay}>
          <Touchable style={styles.colorPickerBackdrop} activeOpacity={1} onPress={() => setColorPickerFolderId('')} />
          <View style={styles.colorPickerSheet}>
            <Text style={styles.colorPickerTitle}>Chọn màu cho bộ từ</Text>
                  <View style={styles.colorSwatchRow}>
                    {folderColorOptions.map((c) => (
                      <Touchable
                        key={c}
                        activeOpacity={0.85}
                        onPress={() => setSelectedColorDraft(c)}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: c },
                          selectedColorDraft === c ? styles.colorSwatchSelected : null,
                        ]}
                      />
                    ))}
                  </View>
                  <TextInput
                    value={colorNoteDraft}
                    onChangeText={setColorNoteDraft}
                    placeholder="Ghi chú cho màu này (ví dụ: 'Học vựng hằng ngày')"
                    placeholderTextColor="#94A3B8"
                    style={styles.colorNoteInput}
                  />
                  <View style={styles.colorPickerActions}>
                    <Touchable onPress={() => setColorPickerFolderId('')} style={styles.colorPickerCancel}>
                      <Text style={styles.colorPickerCancelText}>Hủy</Text>
                    </Touchable>
                    <Touchable
                      activeOpacity={0.85}
                      onPress={() => {
                        const folderId = colorPickerFolderId;
                        const colorToSave = selectedColorDraft || libraryState.folders.find((f) => f.id === folderId)?.color || DEFAULT_FOLDER_COLOR;
                        updateFolderColorAndNote(libraryState, folderId, colorToSave, colorNoteDraft ?? '').then((nextState: LibraryState) => {
                          setLibraryState(nextState);
                          setColorPickerFolderId('');
                        });
                      }}
                      style={styles.colorPickerSave}>
                      <Text style={styles.colorPickerSaveText}>Lưu</Text>
                    </Touchable>
                  </View>
          </View>
        </View>
      ) : null}
      {renameFolderId ? (
        <View style={styles.colorPickerOverlay}>
          <Touchable style={styles.colorPickerBackdrop} activeOpacity={1} onPress={() => { setRenameFolderId(''); setRenameDraft(''); setRenameError(''); }} />
          <View style={styles.colorPickerSheet}>
            <Text style={styles.colorPickerTitle}>Đổi tên bộ từ</Text>
            <TextInput
              value={renameDraft}
              onChangeText={(text) => { setRenameDraft(text); setRenameError(''); }}
              placeholder="Tên mới cho bộ từ"
              placeholderTextColor="#94A3B8"
              style={styles.renameInput}
            />
            {renameError ? <Text style={styles.renameError}>{renameError}</Text> : null}
            <View style={styles.colorPickerActions}>
              <Touchable onPress={() => { setRenameFolderId(''); setRenameDraft(''); setRenameError(''); }} style={styles.colorPickerCancel}>
                <Text style={styles.colorPickerCancelText}>Hủy</Text>
              </Touchable>
              <Touchable
                activeOpacity={0.85}
                onPress={() => {
                  const trimmed = renameDraft.trim();
                  if (!trimmed) { setRenameError('Tên không được để trống'); return; }
                  if (libraryState.folders.some((f) => f.name.toLowerCase() === trimmed.toLowerCase() && f.id !== renameFolderId)) {
                    setRenameError('Tên bộ từ đã tồn tại');
                    return;
                  }

                  renameFolder(libraryState, renameFolderId, trimmed).then((nextState: LibraryState) => {
                    setLibraryState(nextState);
                    setRenameFolderId('');
                    setRenameDraft('');
                    setRenameError('');
                  });
                }}
                style={styles.colorPickerSave}>
                <Text style={styles.colorPickerSaveText}>Lưu</Text>
              </Touchable>
            </View>
          </View>
        </View>
      ) : null}
      <Touchable
        accessibilityLabel="Thêm bộ từ"
        accessibilityRole="button"
        activeOpacity={0.86}
        onPress={handleOpenCreateFolder}
        style={[styles.floatingAddButton, { bottom: floatingButtonBottom, height: FAB_SIZE, width: FAB_SIZE }]}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Touchable>
      </View>
    </Screen>
  );
}

function getEmptyFolderText(segment: LibrarySegment, query: string) {
  if (query.trim()) return 'Không tìm thấy bộ từ phù hợp.';
  if (segment === 'favorites') return 'Chưa có bộ từ yêu thích.';
  if (segment === 'imported') return 'Chưa có bộ từ từ dữ liệu import.';

  return 'Chưa có bộ từ nào.';
}
