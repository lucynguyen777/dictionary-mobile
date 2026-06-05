import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Screen from '@/components/app/Screen';
import { useToken } from '@/hooks/use-token';
import {
  VocabularyImportField,
  VocabularyImportOptions,
  VocabularyImportOrientation,
  VocabularyImportRow,
  detectHeaderFieldMapping,
  parseVocabularyCsv,
} from '@/data/csvImport';
import {
  FlashcardType,
  Folder,
  LibraryState,
  createFlashcardsFromWordIds,
  createFolder,
  duplicateFolder,
  exportFolderToAnkiTsv,
  exportFolderToCsv,
  exportFolderToExcel,
  FolderExportFormat,
  shareFolder,
  getDefaultLibraryState,
  getFavoriteFolderId,
  getFolderWords,
  importVocabularyRowsToFolder,
  isFavoriteWordsFolder,
  loadLibraryState,
  renameFolder,
  toggleFavoriteFolder,
  updateFolderColorAndNote,
} from '@/data/libraryStore';

type LibrarySegment = 'folders' | 'favorites' | 'imported';
type ImportTargetMode = 'new' | 'existing';
type AddPanelMode = 'choice' | 'create' | 'import';
type FolderSortOption = 'recent' | 'oldest' | 'az' | 'za' | 'mostWords' | 'leastWords' | 'favoritesFirst';
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

const sortOptions: { value: FolderSortOption; label: string }[] = [
  { value: 'recent', label: 'Gần đây nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' },
  { value: 'mostWords', label: 'Nhiều từ nhất' },
  { value: 'leastWords', label: 'Ít từ nhất' },
  { value: 'favoritesFirst', label: 'Yêu thích trước' },
];

const viewModeOptions: { value: FolderViewMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'grid', label: 'Lưới', icon: 'grid-outline' },
  { value: 'list', label: 'Danh sách', icon: 'list-outline' },
];

const FAB_SIZE = 48;
const FAB_BOTTOM_GAP = 16;
const SCROLL_BOTTOM_PADDING = 148;
const folderColorOptions = ['#E8F0FF', '#EAF8F0', '#FFF1E8', '#F1ECFF', '#FFEFF3', '#EAF7FA'];

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
  const [folderColorDraft, setFolderColorDraft] = useState('#E8F0FF');
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
    setFolderColorDraft('#E8F0FF');
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
      setFolderColorDraft('#E8F0FF');
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
              <TouchableOpacity
                key={segment.key}
                activeOpacity={0.82}
                onPress={() => setActiveSegment(segment.key)}
                style={isActive ? [styles.segmentActive, themed.activeChip] : styles.segmentItem}>
                <Text style={isActive ? [styles.segmentActiveText, themed.activeChipText] : [styles.segmentText, themed.mutedText]}>{segment.label}</Text>
              </TouchableOpacity>
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
          <TouchableOpacity
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
          </TouchableOpacity>
          <View style={[styles.viewToggle, themed.card]}>
            {viewModeOptions.map((option) => {
              const isActive = folderViewMode === option.value;

              return (
                <TouchableOpacity
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
                </TouchableOpacity>
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
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.82}
                  onPress={() => {
                    setFolderSort(option.value);
                    setSortPanelOpen(false);
                  }}
                  style={[styles.controlChip, themed.card, isActive && styles.controlChipActive, isActive && themed.activeChip]}>
                  <Text style={[styles.controlChipText, themed.mutedText, isActive && styles.controlChipTextActive, isActive && themed.activeChipText]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
        <View style={[styles.grid, folderViewMode !== 'grid' && styles.gridList]}>
          {filteredFolders.map((folder) => {
            const wordCount = getFolderWords(libraryState, folder.id).length;
            const isList = folderViewMode === 'list';

            return (
            <TouchableOpacity
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
                    <Ionicons name="folder-open-outline" size={28} color={colors.textPrimary} />
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
                  <TouchableOpacity
                    activeOpacity={0.78}
                    onPress={(event) => {
                      event.stopPropagation();
                      handleToggleFolderMenu(folder.id);
                    }}
                    style={[styles.folderMenuButton, themed.secondaryButton]}>
                    <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              {activeFolderMenuId === folder.id ? (
                <ScrollView
                  nestedScrollEnabled
                  style={[styles.folderActionPanel, themed.mutedPanel]}
                  onStartShouldSetResponder={() => true}
                  showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    activeOpacity={0.78}
                    onPress={() => handleToggleFavoriteFolder(folder)}
                    style={styles.folderActionRow}>
                    <Ionicons name={folder.isFavorite ? 'star' : 'star-outline'} size={17} color={folder.isFavorite ? '#D97706' : '#64748B'} />
                    <Text style={styles.folderActionText}>
                      {folder.isFavorite ? 'Gỡ khỏi bộ từ yêu thích' : 'Thêm bộ từ vào yêu thích'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.78}
                    onPress={() => handleDuplicateFolder(folder)}
                    style={styles.folderActionRow}>
                    <Ionicons name="copy-outline" size={17} color="#64748B" />
                    <Text style={styles.folderActionText}>Tạo bản sao</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
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
                  </TouchableOpacity>
                  <TouchableOpacity
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
                  </TouchableOpacity>
                  <View style={styles.folderActionDivider} />
                  <Text style={styles.folderActionLabel}>Download</Text>
                  <View style={styles.downloadRow}>
                    {[
                      { label: 'CSV', format: 'csv' as const },
                      { label: 'XLS', format: 'excel' as const },
                      { label: 'Anki', format: 'anki' as const },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.format}
                        activeOpacity={0.78}
                        onPress={() => {
                          setActiveFolderMenuId('');
                          handleExportFolder(folder.id, item.format);
                        }}
                        style={styles.downloadChip}>
                        <Text style={styles.downloadChipText}>{item.label}</Text>
                      </TouchableOpacity>
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
                      <TouchableOpacity
                        key={`share-${item.format}`}
                        activeOpacity={0.78}
                        onPress={() => handleShareFolder(folder.id, item.format)}
                        style={styles.shareChip}>
                        <Ionicons name="share-social-outline" size={13} color="#0F766E" />
                        <Text style={styles.shareChipText}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              ) : null}
            </TouchableOpacity>
            );
          })}
        </View>
        {!filteredFolders.length ? <Text style={styles.emptyText}>{getEmptyFolderText(activeSegment, query)}</Text> : null}

        <Text style={styles.sectionTitle}>Vừa lưu</Text>
        {recentWords.map((entry) => (
          <Link key={entry.id} href={{ pathname: '/word', params: { word: entry.word } }} asChild>
            <TouchableOpacity activeOpacity={0.82} style={styles.savedWord}>
              <View style={styles.savedWordCopy}>
                <Text style={[styles.savedWordTitle, /[\u0600-\u06FF\u0590-\u05FF]/.test(entry.word) && { textAlign: 'right', writingDirection: 'rtl' }]}>{entry.word}</Text>
                <Text style={styles.savedWordMeta}>{entry.definition || 'Từ đã lưu'} · {entry.ipa || 'Đang chờ IPA'}</Text>
                {entry.note ? <Text numberOfLines={2} style={styles.savedWordNote}>{entry.note}</Text> : null}
              </View>
              <View style={styles.savedTag}>
                <Text style={styles.savedTagText}>{entry.folderIds.length} bộ</Text>
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
      {createPanelOpen ? (
        <View style={styles.addSheetOverlay}>
          <TouchableOpacity activeOpacity={1} onPress={closeAddPanel} style={styles.addSheetBackdrop} />
          <View style={[styles.addSheet, themed.bottomSheet, { paddingBottom: 16 + Math.max(insets.bottom, Platform.OS === 'web' ? 8 : 0) }]}>
            <ScrollView
              contentContainerStyle={styles.addSheetContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}>
              {addPanelMode === 'choice' ? (
                <>
                  <Text style={[styles.addSheetTitle, themed.primaryText]}>Thêm vào Tủ từ</Text>
                  <TouchableOpacity activeOpacity={0.84} onPress={() => setAddPanelMode('create')} style={[styles.addChoiceCard, themed.mutedPanel]}>
                    <Ionicons name="folder-outline" size={23} color={colors.accentPrimary} />
                    <View style={styles.addChoiceCopy}>
                      <Text style={[styles.addChoiceTitle, themed.primaryText]}>Tạo mới</Text>
                      <Text style={[styles.addChoiceText, themed.mutedText]}>Đặt tên, chọn màu, tag và ảnh đại diện cho bộ từ.</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.84} onPress={handlePickCsv} style={[styles.addChoiceCard, themed.mutedPanel]}>
                    <Ionicons name="cloud-upload-outline" size={23} color={colors.accentPrimary} />
                    <View style={styles.addChoiceCopy}>
                      <Text style={[styles.addChoiceTitle, themed.primaryText]}>Tải lên file</Text>
                      <Text style={[styles.addChoiceText, themed.mutedText]}>Chọn CSV/TSV, đổi tên và cấu hình bộ từ trước khi import.</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.82} onPress={closeAddPanel} style={[styles.addSheetClose, themed.secondaryButton]}>
                    <Text style={[styles.addSheetCloseText, themed.mutedText]}>Đóng</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              {addPanelMode === 'create' ? (
                <>
                  <View style={styles.addSheetHeaderRow}>
                    <TouchableOpacity activeOpacity={0.78} onPress={() => setAddPanelMode('choice')} style={[styles.addBackButton, themed.tonalButton]}>
                      <Ionicons name="chevron-back" size={18} color={colors.accentPrimary} />
                    </TouchableOpacity>
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
                    <TouchableOpacity activeOpacity={0.82} onPress={closeAddPanel} style={[styles.addSheetSecondary, themed.secondaryButton]}>
                      <Text style={[styles.addSheetSecondaryText, themed.mutedText]}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.84} onPress={handleCreateFolder} style={[styles.addSheetPrimary, themed.primaryButton]}>
                      <Text style={styles.addSheetPrimaryText}>Tạo bộ từ</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
              {addPanelMode === 'import' ? (
                <>
                  <View style={styles.addSheetHeaderRow}>
                    <TouchableOpacity activeOpacity={0.78} onPress={() => setAddPanelMode('choice')} style={[styles.addBackButton, themed.tonalButton]}>
                      <Ionicons name="chevron-back" size={18} color={colors.accentPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.addSheetTitle, themed.primaryText]}>Tải lên file</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.82} onPress={handlePickCsv} style={[styles.importPickButton, themed.tonalButton]}>
                    <Ionicons name="cloud-upload-outline" size={18} color={colors.accentPrimary} />
                    <Text style={[styles.importPickText, themed.activeChipText]}>{importFileName ? 'Đổi file' : 'Chọn CSV/TSV'}</Text>
                  </TouchableOpacity>
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
                              <TouchableOpacity
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
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <TouchableOpacity
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
                        </TouchableOpacity>
                        {importHeaders.length ? (
                          <>
                            <Text style={styles.importConfigLabel}>Mapping trường</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mappingRow}>
                              {importHeaders.map((header, index) => {
                                const mapped = importFieldMapping[index] ?? 'ignore';

                                return (
                                  <View key={`${header}-${index}`} style={styles.mappingCard}>
                                    <Text style={styles.mappingHeader} numberOfLines={1}>{header || `Trường ${index + 1}`}</Text>
                                    <TouchableOpacity
                                      activeOpacity={0.82}
                                      onPress={() => handleCycleImportFieldMapping(index)}
                                      style={[styles.mappingButton, mapped !== 'ignore' && styles.mappingButtonActive]}>
                                      <Text style={[styles.mappingButtonText, mapped !== 'ignore' && styles.mappingButtonTextActive]}>
                                        {mapped === 'ignore' ? 'Bỏ qua' : mapped}
                                      </Text>
                                    </TouchableOpacity>
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
                              <TouchableOpacity
                                key={option.value}
                                activeOpacity={0.82}
                                onPress={() => updateImportOptions({ ...importOptions, primaryField: option.value })}
                                style={[styles.importPrimaryChip, isSelected && styles.activeImportPrimaryChip]}>
                                <Text style={[styles.importPrimaryText, isSelected && styles.activeImportPrimaryText]}>
                                  {option.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                      <View style={styles.importModeRow}>
                        <TouchableOpacity
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
                        </TouchableOpacity>
                        <TouchableOpacity
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
                        </TouchableOpacity>
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
                              <TouchableOpacity
                                key={folder.id}
                                activeOpacity={0.82}
                                onPress={() => setSelectedImportFolderId(folder.id)}
                                style={[styles.importFolderChip, isSelected && styles.activeImportFolderChip]}>
                                <Text
                                  numberOfLines={1}
                                  style={[styles.importFolderChipText, isSelected && styles.activeImportFolderChipText]}>
                                  {folder.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      )}
                      <TouchableOpacity
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
                      </TouchableOpacity>
                      {importRows.slice(0, 3).map((row) => (
                        <View key={row.word} style={styles.importPreviewRow}>
                          <Text style={styles.importPreviewWord}>{row.word}</Text>
                          <Text numberOfLines={1} style={styles.importPreviewDefinition}>{row.definition || row.ipa || 'Chưa có định nghĩa'}</Text>
                        </View>
                      ))}
                      {importErrors.slice(0, 4).map((error) => (
                        <Text key={error} style={styles.importError}>{error}</Text>
                      ))}
                      <TouchableOpacity activeOpacity={0.82} onPress={handleImportCsv} style={styles.importSubmitButton}>
                        <Text style={styles.importSubmitText}>Import vào bộ từ</Text>
                      </TouchableOpacity>
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
          <TouchableOpacity style={styles.colorPickerBackdrop} activeOpacity={1} onPress={() => setColorPickerFolderId('')} />
          <View style={styles.colorPickerSheet}>
            <Text style={styles.colorPickerTitle}>Chọn màu cho bộ từ</Text>
                  <View style={styles.colorSwatchRow}>
                    {['#E8F0FF', '#EAF8F0', '#FFF1E8', '#F1ECFF', '#FFEFF3', '#EAF7FA'].map((c) => (
                      <TouchableOpacity
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
                    <TouchableOpacity onPress={() => setColorPickerFolderId('')} style={styles.colorPickerCancel}>
                      <Text style={styles.colorPickerCancelText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        const folderId = colorPickerFolderId;
                        const colorToSave = selectedColorDraft || libraryState.folders.find((f) => f.id === folderId)?.color || '#E8F0FF';
                        updateFolderColorAndNote(libraryState, folderId, colorToSave, colorNoteDraft ?? '').then((nextState: LibraryState) => {
                          setLibraryState(nextState);
                          setColorPickerFolderId('');
                        });
                      }}
                      style={styles.colorPickerSave}>
                      <Text style={styles.colorPickerSaveText}>Lưu</Text>
                    </TouchableOpacity>
                  </View>
          </View>
        </View>
      ) : null}
      {renameFolderId ? (
        <View style={styles.colorPickerOverlay}>
          <TouchableOpacity style={styles.colorPickerBackdrop} activeOpacity={1} onPress={() => { setRenameFolderId(''); setRenameDraft(''); setRenameError(''); }} />
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
              <TouchableOpacity onPress={() => { setRenameFolderId(''); setRenameDraft(''); setRenameError(''); }} style={styles.colorPickerCancel}>
                <Text style={styles.colorPickerCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
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
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={handleOpenCreateFolder}
        style={[styles.floatingAddButton, { bottom: floatingButtonBottom, height: FAB_SIZE, width: FAB_SIZE }]}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
      </View>
    </Screen>
  );
}

function FolderMetadataEditor({
  avatarUri,
  color,
  colorNote,
  onAvatarUriChange,
  onColorChange,
  onColorNoteChange,
  onTagsChange,
  tags,
}: {
  avatarUri: string;
  color: string;
  colorNote: string;
  onAvatarUriChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onColorNoteChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  tags: string;
}) {
  return (
    <View style={styles.metadataPanel}>
      <Text style={styles.metadataTitle}>Tùy chỉnh bộ từ</Text>
      <View style={styles.colorSwatchRow}>
        {folderColorOptions.map((option) => (
          <TouchableOpacity
            key={option}
            activeOpacity={0.85}
            onPress={() => onColorChange(option)}
            style={[styles.colorSwatch, { backgroundColor: option }, color === option && styles.colorSwatchSelected]}
          />
        ))}
      </View>
      <TextInput
        onChangeText={onColorNoteChange}
        placeholder="Ghi chú màu sắc"
        placeholderTextColor="#94A3B8"
        style={styles.metadataInput}
        value={colorNote}
      />
      <TextInput
        onChangeText={onTagsChange}
        placeholder="Tag, phân tách bằng dấu phẩy"
        placeholderTextColor="#94A3B8"
        style={styles.metadataInput}
        value={tags}
      />
      <TextInput
        autoCapitalize="none"
        onChangeText={onAvatarUriChange}
        placeholder="Ảnh đại diện URL"
        placeholderTextColor="#94A3B8"
        style={styles.metadataInput}
        value={avatarUri}
      />
    </View>
  );
}

function parseTagDraft(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

const styles = StyleSheet.create({
  screenBody: {
    flex: 1,
  },
  content: {
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
    fontWeight: '700',
    marginTop: 4,
  },
  floatingAddButton: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 24,
    elevation: 45,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    boxShadow: '0px 8px 18px rgba(15, 23, 42, 0.2)',
    zIndex: 45,
  },
  addSheetOverlay: {
    bottom: 0,
    left: 0,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 70,
  },
  addSheetBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  addSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    bottom: 0,
    left: 0,
    maxHeight: '82%',
    paddingHorizontal: 14,
    paddingTop: 14,
    position: 'absolute',
    right: 0,
    boxShadow: '0px -8px 20px rgba(15, 23, 42, 0.16)',
  },
  addSheetContent: {
    gap: 10,
    paddingBottom: 4,
  },
  addSheetTitle: {
    color: '#0F172A',
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  addSheetHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addBackButton: {
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  addChoiceCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#DCE6F5',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  addChoiceCopy: {
    flex: 1,
    gap: 3,
  },
  addChoiceTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  addChoiceText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  addSheetClose: {
    alignItems: 'center',
    backgroundColor: '#EEF2F7',
    borderRadius: 8,
    paddingVertical: 13,
  },
  addSheetCloseText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  addSheetActions: {
    flexDirection: 'row',
    gap: 10,
  },
  addSheetPrimary: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
  addSheetPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  addSheetSecondary: {
    alignItems: 'center',
    backgroundColor: '#EEF2F7',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
  addSheetSecondaryText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  segment: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    marginTop: 18,
    padding: 5,
  },
  createInputBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  createInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    paddingVertical: 11,
  },
  createError: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  createActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  metadataPanel: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 9,
    marginTop: 12,
    padding: 11,
  },
  metadataTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metadataInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  cancelCreateButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 11,
  },
  cancelCreateText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  submitCreateButton: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 11,
  },
  submitCreateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  importPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 14,
  },
  importHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  importKicker: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  importTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 3,
  },
  importPickButton: {
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  importPickText: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '700',
  },
  importHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 10,
  },
  importFileName: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  importConfigPanel: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 11,
  },
  importConfigLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  importOptionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  importOptionCard: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    padding: 10,
  },
  activeImportOptionCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#C4B5FD',
  },
  importOptionCopy: {
    flex: 1,
  },
  importOptionTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  activeImportOptionTitle: {
    color: '#7C3AED',
  },
  importOptionText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 3,
  },
  importHeaderToggle: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginBottom: 10,
    padding: 10,
  },
  importPrimaryRow: {
    gap: 8,
  },
  importPrimaryChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  activeImportPrimaryChip: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
  },
  importPrimaryText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  activeImportPrimaryText: {
    color: '#7C3AED',
  },
  importModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  importModeButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  activeImportModeButton: {
    backgroundColor: '#F5F3FF',
    borderColor: '#C4B5FD',
  },
  importModeText: {
    color: '#64748B',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  activeImportModeText: {
    color: '#7C3AED',
  },
  importFolderRow: {
    gap: 8,
    paddingTop: 12,
  },
  importFolderChip: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 160,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeImportFolderChip: {
    backgroundColor: '#F3E8FF',
    borderColor: '#C4B5FD',
  },
  importFolderChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  activeImportFolderChipText: {
    color: '#7C3AED',
  },
  importFlashcardToggle: {
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
    padding: 11,
  },
  importFlashcardCopy: {
    flex: 1,
  },
  importFlashcardTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  importFlashcardText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 3,
  },
  importPreviewRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginTop: 8,
    padding: 10,
  },
  mappingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  mappingCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    width: 110,
  },
  mappingHeader: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  mappingButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  mappingButtonActive: {
    backgroundColor: '#F5F3FF',
  },
  mappingButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  mappingButtonTextActive: {
    color: '#7C3AED',
  },
  importPreviewWord: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  importPreviewDefinition: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  importError: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  importSubmitButton: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    marginTop: 10,
    paddingVertical: 11,
  },
  importSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  importMessage: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    flex: 1,
    overflow: 'hidden',
    paddingVertical: 9,
  },
  segmentActiveText: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  segmentItem: {
    borderRadius: 6,
    flex: 1,
    paddingVertical: 9,
  },
  segmentText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
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
    gap: 10,
    marginTop: 18,
    ...(Platform.OS === 'web'
      ? {
          flexWrap: 'wrap',
        }
      : {}),
  },
  toolbarLeft: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toolbarText: {
    color: '#64748B',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  viewToggle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    flexShrink: 0,
    gap: 4,
    padding: 4,
  },
  viewIconButton: {
    alignItems: 'center',
    borderRadius: 7,
    height: 34,
    justifyContent: 'center',
    width: 38,
  },
  viewIconButtonActive: {
    backgroundColor: '#F5F3FF',
  },
  folderControlsDropdown: {
    elevation: 25,
    zIndex: 25,
  },
  optionStrip: {
    gap: 8,
    paddingTop: 10,
  },
  controlChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  controlChipActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
  },
  controlChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  controlChipTextActive: {
    color: '#7C3AED',
  },
  viewModePanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    padding: 8,
    ...(Platform.OS === 'web'
      ? {
          flexWrap: 'wrap',
        }
      : {}),
  },
  viewModeButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  colorPickerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
    zIndex: 60,
    elevation: 60,
  },
  colorPickerBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
    zIndex: 50,
  },
  colorPickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 14,
    borderColor: '#E2E8F0',
    borderTopWidth: 1,
    zIndex: 61,
    elevation: 61,
  },
  colorPickerTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  colorSwatchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6EEF8',
  },
  colorPickerCancel: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 10,
  },
  colorPickerCancelText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  colorNoteInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 10,
  },
  colorPickerActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  colorPickerSave: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  colorPickerSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  renameInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 8,
  },
  renameError: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  viewModeButtonActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
  },
  viewModeText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  viewModeTextActive: {
    color: '#7C3AED',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 18,
    overflow: 'visible',
  },
  gridList: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
  },
  folderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'visible',
    padding: 10,
    position: 'relative',
    width: '48%',
  },
  folderCardMenuOpen: {
    elevation: 50,
    zIndex: 50,
  },
  folderCardList: {
    width: '100%',
  },
  folderCardCompact: {
    marginBottom: 8,
    padding: 8,
    width: '100%',
  },
  folderContentList: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  cover: {
    alignItems: 'center',
    borderRadius: 8,
    height: 86,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  folderAvatarImage: {
    height: '100%',
    width: '100%',
  },
  coverList: {
    height: 58,
    width: 72,
  },
  coverCompact: {
    height: 42,
    width: 48,
  },
  folderInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  folderInfoList: {
    flex: 1,
    marginTop: 0,
  },
  folderCopy: {
    flex: 1,
  },
  folderNameRow: {
    alignItems: 'flex-start',
    gap: 6,
  },
  folderFavoritePill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  folderFavoriteText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  folderMenuButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
    zIndex: 35,
  },
  folderActionPanel: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginTop: 10,
    maxHeight: 340,
    padding: 9,
    zIndex: 30,
    elevation: 30,
  },
  folderActionRow: {
    alignItems: 'center',
    borderRadius: 7,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  folderActionText: {
    color: '#334155',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  folderActionDivider: {
    backgroundColor: '#E2E8F0',
    height: 1,
    marginVertical: 5,
  },
  folderActionLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    textTransform: 'uppercase',
  },
  downloadRow: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  downloadChip: {
    backgroundColor: '#F3E8FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  downloadChipText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '700',
  },
  shareChip: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  shareChipText: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '700',
  },
  folderName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  wordNumber: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  folderTagText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
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
    fontWeight: '700',
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
    backgroundColor: '#F5F3FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedTagText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '700',
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
    fontWeight: '700',
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

function getEmptyFolderText(segment: LibrarySegment, query: string) {
  if (query.trim()) return 'Không tìm thấy bộ từ phù hợp.';
  if (segment === 'favorites') return 'Chưa có bộ từ yêu thích.';
  if (segment === 'imported') return 'Chưa có bộ từ từ dữ liệu import.';

  return 'Chưa có bộ từ nào.';
}

function getSortLabel(sortOption: FolderSortOption) {
  return sortOptions.find((option) => option.value === sortOption)?.label ?? 'Gần đây nhất';
}

function sortFolders(leftFolder: Folder, rightFolder: Folder, sortOption: FolderSortOption, state: LibraryState) {
  const leftWordCount = getFolderWords(state, leftFolder.id).length;
  const rightWordCount = getFolderWords(state, rightFolder.id).length;

  switch (sortOption) {
    case 'oldest':
      return new Date(leftFolder.createdAt).getTime() - new Date(rightFolder.createdAt).getTime();
    case 'az':
      return leftFolder.name.localeCompare(rightFolder.name);
    case 'za':
      return rightFolder.name.localeCompare(leftFolder.name);
    case 'mostWords':
      return rightWordCount - leftWordCount || rightFolder.name.localeCompare(leftFolder.name);
    case 'leastWords':
      return leftWordCount - rightWordCount || leftFolder.name.localeCompare(rightFolder.name);
    case 'favoritesFirst':
      if (leftFolder.isFavorite !== rightFolder.isFavorite) return leftFolder.isFavorite ? -1 : 1;
      return rightWordCount - leftWordCount || leftFolder.name.localeCompare(rightFolder.name);
    case 'recent':
    default:
      return new Date(rightFolder.updatedAt).getTime() - new Date(leftFolder.updatedAt).getTime();
  }
}
