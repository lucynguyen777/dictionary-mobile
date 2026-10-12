import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import Touchable from '@/components/app/Touchable';
import { DEFAULT_FOLDER_COLOR, FolderMetadataEditor, parseTagDraft } from '@/components/library/FolderMetadataEditor';
import { styles } from '@/components/library/styles';
import { VocabularyImportField, VocabularyImportOptions, VocabularyImportOrientation, VocabularyImportRow, detectHeaderFieldMapping, parseVocabularyCsv } from '@/data/csvImport';
import { FlashcardType, LibraryState, createFlashcardsFromWordIds, createFolder, getFavoriteFolderId, importVocabularyRowsToFolder } from '@/data/libraryStore';
import { useToken } from '@/hooks/use-token';

type ImportTargetMode = 'new' | 'existing';

type AddPanelMode = 'choice' | 'create' | 'import';

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

type Props = {
  bottomInset: number;
  libraryState: LibraryState;
  onClose: () => void;
  onFolderCreated: () => void;
  onLibraryChange: (state: LibraryState) => void;
  // The Library screen's theme overrides (light/dark surfaces and text).
  themed: Record<string, StyleProp<ViewStyle & TextStyle>>;
};

// Library "add" bottom sheet: create a folder, or import vocabulary from a CSV/TSV file into a new
// or existing folder (optionally with flashcards). Drafts live here and reset when the sheet closes.
export default function AddToLibrarySheet({ bottomInset, libraryState, onClose, onFolderCreated, onLibraryChange, themed }: Props) {
  const { colors } = useToken();
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
    onClose();
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
      onLibraryChange(nextState);
      closeAddPanel();
      onFolderCreated();
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

      onLibraryChange(nextState);
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
      onFolderCreated();
    });
  };

  return (
    <View style={styles.addSheetOverlay}>
      <Touchable activeOpacity={1} onPress={closeAddPanel} style={styles.addSheetBackdrop} />
      <View style={[styles.addSheet, themed.bottomSheet, { paddingBottom: 16 + Math.max(bottomInset, Platform.OS === 'web' ? 8 : 0) }]}>
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
  );
}
