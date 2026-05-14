import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import {
  VocabularyImportField,
  VocabularyImportOptions,
  VocabularyImportOrientation,
  VocabularyImportRow,
  parseVocabularyCsv,
} from '@/data/csvImport';
import {
  LibraryState,
  createFlashcardsFromWordIds,
  createFolder,
  exportFolderToCsv,
  exportFolderToExcel,
  getDefaultLibraryState,
  getFavoriteFolderId,
  getFolderWords,
  importVocabularyRowsToFolder,
  loadLibraryState,
} from '@/data/libraryStore';

type LibrarySegment = 'folders' | 'favorites' | 'imported';
type ImportTargetMode = 'new' | 'existing';

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

export default function LibraryScreen() {
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [query, setQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState<LibrarySegment>('folders');
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [folderNameDraft, setFolderNameDraft] = useState('');
  const [createFolderError, setCreateFolderError] = useState('');
  const [importCsvContent, setImportCsvContent] = useState('');
  const [importRows, setImportRows] = useState<VocabularyImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importOptions, setImportOptions] = useState<VocabularyImportOptions>(defaultImportOptions);
  const [importFolderName, setImportFolderName] = useState('');
  const [importTargetMode, setImportTargetMode] = useState<ImportTargetMode>('new');
  const [selectedImportFolderId, setSelectedImportFolderId] = useState('');
  const [shouldCreateImportFlashcards, setShouldCreateImportFlashcards] = useState(false);
  const [importMessage, setImportMessage] = useState('');

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
    const favoriteFolderId = getFavoriteFolderId();
    const foldersBySegment = libraryState.folders.filter((folder) => {
      if (activeSegment === 'favorites') return folder.id === favoriteFolderId;
      if (activeSegment === 'imported') {
        return libraryState.savedWords.some((word) => word.source === 'import' && word.folderIds.includes(folder.id));
      }

      return true;
    });

    if (!normalizedQuery) return foldersBySegment;

    return foldersBySegment.filter((folder) => folder.name.toLowerCase().includes(normalizedQuery));
  }, [activeSegment, libraryState.folders, libraryState.savedWords, query]);

  const recentWords = libraryState.savedWords.slice(0, 6);
  const importTargetFolders = libraryState.folders.filter((folder) => folder.id !== getFavoriteFolderId());

  const updateImportOptions = (nextOptions: VocabularyImportOptions) => {
    setImportOptions(nextOptions);

    if (!importCsvContent) return;

    const parsed = parseVocabularyCsv(importCsvContent, nextOptions);
    setImportRows(parsed.rows);
    setImportErrors(parsed.errors);
    setImportMessage('');
  };

  const handleOpenCreateFolder = () => {
    setCreatePanelOpen((isOpen) => !isOpen);
    setCreateFolderError('');
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

    createFolder(libraryState, trimmedName).then((nextState) => {
      setLibraryState(nextState);
      setFolderNameDraft('');
      setCreateFolderError('');
      setCreatePanelOpen(false);
      setActiveSegment('folders');
      setQuery('');
    });
  };

  const handleExportFolder = async (folderId: string, format: 'csv' | 'excel') => {
    try {
      const result = format === 'excel' ? await exportFolderToExcel(libraryState, folderId) : await exportFolderToCsv(libraryState, folderId);

      Alert.alert(result.ok ? 'Export complete' : 'Export unavailable', result.message);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Could not export this folder.');
    }
  };

  const handlePickCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        base64: false,
        copyToCacheDirectory: true,
        type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const csv = asset.file ? await asset.file.text() : await new File(asset.uri).text();
      const parsed = parseVocabularyCsv(csv, defaultImportOptions);
      const defaultFolderName = asset.name.replace(/\.[^/.]+$/, '').trim() || 'Imported words';

      setImportCsvContent(csv);
      setImportRows(parsed.rows);
      setImportErrors(parsed.errors);
      setImportFileName(asset.name);
      setImportOptions(defaultImportOptions);
      setImportFolderName(defaultFolderName);
      setImportTargetMode('new');
      setSelectedImportFolderId(importTargetFolders[0]?.id ?? '');
      setShouldCreateImportFlashcards(false);
      setImportMessage('');
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Could not read this CSV file.');
    }
  };

  const handleImportCsv = () => {
    if (!importRows.length) {
      Alert.alert('Import unavailable', 'Chọn một CSV hợp lệ trước khi import.');
      return;
    }

    const targetFolder = libraryState.folders.find((folder) => folder.id === selectedImportFolderId);
    const importTarget =
      importTargetMode === 'existing' && targetFolder
        ? { folderId: targetFolder.id, folderName: targetFolder.name }
        : { folderName: importFolderName };
    const importedWordIds = importRows.map((row) => `word-${row.word.toLowerCase()}`);

    importVocabularyRowsToFolder(libraryState, importRows, importTarget).then((nextState) => {
      if (!shouldCreateImportFlashcards) return nextState;

      return createFlashcardsFromWordIds(nextState, importedWordIds, ['bilingual', 'word-definition']);
    }).then((nextState) => {
      const folderLabel = importTarget.folderName || 'Imported words';

      setLibraryState(nextState);
      setImportMessage(
        `Đã import ${importRows.length} từ vào "${folderLabel}"${
          shouldCreateImportFlashcards ? ' và tạo flashcard.' : '.'
        }`
      );
      setImportRows([]);
      setImportErrors([]);
      setImportCsvContent('');
      setImportFileName('');
      setImportOptions(defaultImportOptions);
      setImportFolderName('');
      setImportTargetMode('new');
      setSelectedImportFolderId('');
      setShouldCreateImportFlashcards(false);
      setActiveSegment('folders');
      setQuery('');
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Library</Text>
            <Text style={styles.title}>Tủ từ của bạn</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={handleOpenCreateFolder} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {createPanelOpen ? (
          <View style={styles.createPanel}>
            <Text style={styles.createTitle}>Tạo bộ từ mới</Text>
            <View style={styles.createInputBox}>
              <Ionicons name="folder-outline" size={19} color="#2563EB" />
              <TextInput
                autoCorrect={false}
                onChangeText={(value) => {
                  setFolderNameDraft(value);
                  setCreateFolderError('');
                }}
                onSubmitEditing={handleCreateFolder}
                placeholder="Ví dụ: Academic writing"
                placeholderTextColor="#94A3B8"
                returnKeyType="done"
                style={styles.createInput}
                value={folderNameDraft}
              />
            </View>
            {createFolderError ? <Text style={styles.createError}>{createFolderError}</Text> : null}
            <View style={styles.createActions}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => {
                  setCreatePanelOpen(false);
                  setCreateFolderError('');
                }}
                style={styles.cancelCreateButton}>
                <Text style={styles.cancelCreateText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.82} onPress={handleCreateFolder} style={styles.submitCreateButton}>
                <Text style={styles.submitCreateText}>Tạo bộ từ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.segment}>
          {segments.map((segment) => {
            const isActive = activeSegment === segment.key;

            return (
              <TouchableOpacity
                key={segment.key}
                activeOpacity={0.82}
                onPress={() => setActiveSegment(segment.key)}
                style={isActive ? styles.segmentActive : styles.segmentItem}>
                <Text style={isActive ? styles.segmentActiveText : styles.segmentText}>{segment.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.importPanel}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importKicker}>CSV import</Text>
              <Text style={styles.importTitle}>Thêm bộ từ từ file</Text>
            </View>
            <TouchableOpacity activeOpacity={0.82} onPress={handlePickCsv} style={styles.importPickButton}>
              <Ionicons name="cloud-upload-outline" size={18} color="#2563EB" />
              <Text style={styles.importPickText}>Chọn CSV</Text>
            </TouchableOpacity>
          </View>
          {importFileName ? (
            <>
              <Text style={styles.importFileName}>{importFileName} · {importRows.length} từ hợp lệ</Text>
              <View style={styles.importConfigPanel}>
                <Text style={styles.importConfigLabel}>Cách đọc dữ liệu</Text>
                <View style={styles.importOptionGrid}>
                  {importOrientationOptions.map((option) => {
                    const isSelected = importOptions.orientation === option.value;

                    return (
                      <TouchableOpacity
                        key={option.value}
                        activeOpacity={0.82}
                        onPress={() => updateImportOptions({ ...importOptions, orientation: option.value })}
                        style={[styles.importOptionCard, isSelected && styles.activeImportOptionCard]}>
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={17}
                          color={isSelected ? '#2563EB' : '#94A3B8'}
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
                  onPress={() => updateImportOptions({ ...importOptions, hasHeader: !importOptions.hasHeader })}
                  style={styles.importHeaderToggle}>
                  <Ionicons
                    name={importOptions.hasHeader ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={importOptions.hasHeader ? '#2563EB' : '#94A3B8'}
                  />
                  <View style={styles.importFlashcardCopy}>
                    <Text style={styles.importFlashcardTitle}>Dùng hàng/cột đầu làm tên trường</Text>
                    <Text style={styles.importFlashcardText}>
                      Bật khi file có nhãn như word, definition, ipa, note, tags.
                    </Text>
                  </View>
                </TouchableOpacity>
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
                    color={importTargetMode === 'new' ? '#2563EB' : '#94A3B8'}
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
                    color={importTargetMode === 'existing' ? '#2563EB' : '#94A3B8'}
                  />
                  <Text style={[styles.importModeText, importTargetMode === 'existing' && styles.activeImportModeText]}>
                    Bộ từ có sẵn
                  </Text>
                </TouchableOpacity>
              </View>
              {importTargetMode === 'new' ? (
                <View style={styles.createInputBox}>
                  <Ionicons name="folder-outline" size={19} color="#2563EB" />
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
                  color={shouldCreateImportFlashcards ? '#2563EB' : '#94A3B8'}
                />
                <View style={styles.importFlashcardCopy}>
                  <Text style={styles.importFlashcardTitle}>Tạo flashcard sau import</Text>
                  <Text style={styles.importFlashcardText}>Tạo thẻ bilingual và từ-nghĩa cho các từ vừa nhập.</Text>
                </View>
              </TouchableOpacity>
              {importRows.slice(0, 3).map((row) => (
                <View key={row.word} style={styles.importPreviewRow}>
                  <Text style={styles.importPreviewWord}>{row.word}</Text>
                  <Text numberOfLines={1} style={styles.importPreviewDefinition}>{row.definition || row.ipa || 'No definition yet'}</Text>
                </View>
              ))}
              {importErrors.slice(0, 2).map((error) => (
                <Text key={error} style={styles.importError}>{error}</Text>
              ))}
              <TouchableOpacity activeOpacity={0.82} onPress={handleImportCsv} style={styles.importSubmitButton}>
                <Text style={styles.importSubmitText}>Import vào bộ từ</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.importHint}>
              CSV có thể đọc theo hàng hoặc theo cột. Các trường hỗ trợ: word, definition, ipa, note, tags.
            </Text>
          )}
          {importMessage ? <Text style={styles.importMessage}>{importMessage}</Text> : null}
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#2563EB" />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Tìm bộ từ đã lưu"
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
                  <Text style={styles.wordNumber}>{wordCount} từ</Text>
                </View>
                <View style={styles.exportActions}>
                  <TouchableOpacity
                    onPress={(event) => {
                      event.stopPropagation();
                      handleExportFolder(folder.id, 'csv');
                    }}
                    style={styles.exportButton}>
                    <Text style={styles.exportButtonText}>CSV</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(event) => {
                      event.stopPropagation();
                      handleExportFolder(folder.id, 'excel');
                    }}
                    style={styles.exportButton}>
                    <Text style={styles.exportButtonText}>XLS</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
                <Text style={styles.savedWordTitle}>{entry.word}</Text>
                <Text style={styles.savedWordMeta}>{entry.definition || 'Từ đã lưu'} · {entry.ipa || 'IPA pending'}</Text>
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
  createPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DBEAFE',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 14,
  },
  createTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
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
    fontWeight: '900',
  },
  submitCreateButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 11,
  },
  submitCreateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
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
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  importTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 3,
  },
  importPickButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  importPickText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '900',
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
    fontWeight: '900',
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
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  importOptionCopy: {
    flex: 1,
  },
  importOptionTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  activeImportOptionTitle: {
    color: '#2563EB',
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
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  importPrimaryText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  activeImportPrimaryText: {
    color: '#2563EB',
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
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  importModeText: {
    color: '#64748B',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  activeImportModeText: {
    color: '#2563EB',
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
    backgroundColor: '#EAF1FF',
    borderColor: '#BFDBFE',
  },
  importFolderChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  activeImportFolderChipText: {
    color: '#2563EB',
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
    fontWeight: '900',
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
  importPreviewWord: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
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
    backgroundColor: '#2563EB',
    borderRadius: 8,
    marginTop: 10,
    paddingVertical: 11,
  },
  importSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
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
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
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
  exportActions: {
    flexDirection: 'row',
    gap: 6,
  },
  exportButton: {
    backgroundColor: '#EAF1FF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  exportButtonText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '900',
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

function getEmptyFolderText(segment: LibrarySegment, query: string) {
  if (query.trim()) return 'Không tìm thấy bộ từ phù hợp.';
  if (segment === 'favorites') return 'Chưa có bộ từ yêu thích.';
  if (segment === 'imported') return 'Chưa có bộ từ từ dữ liệu import.';

  return 'Chưa có bộ từ nào.';
}
