import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Touchable from '@/components/app/Touchable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '@/components/app/Screen';
import { useToken } from '@/hooks/use-token';
import { Folder, LibraryState, duplicateFolder, exportFolderToAnkiTsv, exportFolderToCsv, exportFolderToExcel, FolderExportFormat, shareFolder, getDefaultLibraryState, getFolderWords, isFavoriteWordsFolder, loadLibraryState, toggleFavoriteFolder } from '@/data/libraryStore';

import { getSortLabel, sortFolders, sortOptions, type FolderSortOption } from '@/components/library/folderSorting';
import AddToLibrarySheet from '@/components/library/AddToLibrarySheet';
import { FolderColorSheet, RenameFolderSheet } from '@/components/library/FolderEditSheets';
import { styles } from '@/components/library/styles';

type LibrarySegment = 'folders' | 'favorites' | 'imported';

type FolderViewMode = 'grid' | 'list';

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
  const [folderSort, setFolderSort] = useState<FolderSortOption>('recent');
  const [folderViewMode, setFolderViewMode] = useState<FolderViewMode>('grid');
  const [activeFolderMenuId, setActiveFolderMenuId] = useState('');
  const [colorPickerFolderId, setColorPickerFolderId] = useState('');
  const [renameFolderId, setRenameFolderId] = useState('');
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
  const colorPickerFolder = libraryState.folders.find((folder) => folder.id === colorPickerFolderId);
  const renameFolderTarget = libraryState.folders.find((folder) => folder.id === renameFolderId);

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
                    accessibilityLabel={`Tùy chọn bộ từ ${folder.name}`}
                    accessibilityState={{ expanded: activeFolderMenuId === folder.id }}
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
                    }}
                    style={styles.folderActionRow}>
                    <Ionicons name="pencil-outline" size={17} color="#64748B" />
                    <Text style={styles.folderActionText}>Đổi tên</Text>
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
        <AddToLibrarySheet
          bottomInset={insets.bottom}
          libraryState={libraryState}
          onClose={() => setCreatePanelOpen(false)}
          onFolderCreated={() => {
            setActiveSegment('folders');
            setQuery('');
          }}
          onLibraryChange={setLibraryState}
          themed={themed}
        />
      ) : null}
      {colorPickerFolder ? (
        <FolderColorSheet
          folder={colorPickerFolder}
          libraryState={libraryState}
          onClose={() => setColorPickerFolderId('')}
          onLibraryChange={setLibraryState}
        />
      ) : null}
      {renameFolderTarget ? (
        <RenameFolderSheet
          folder={renameFolderTarget}
          libraryState={libraryState}
          onClose={() => setRenameFolderId('')}
          onLibraryChange={setLibraryState}
        />
      ) : null}
      <Touchable
        accessibilityLabel="Thêm bộ từ"
        accessibilityRole="button"
        activeOpacity={0.86}
        onPress={() => setCreatePanelOpen((isOpen) => !isOpen)}
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
