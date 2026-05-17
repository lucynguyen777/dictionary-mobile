import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import { DictionaryEntry } from '@/data/dictionary';
import {
    LibraryState,
    createFlashcardsFromWordIds,
    getDefaultLibraryState,
    getFavoriteFolderId,
    loadLibraryState,
    saveWordToFolder,
} from '@/data/libraryStore';
import {
    ReaderSettings,
    ReaderState,
    getDefaultReaderState,
    importReaderText,
    loadReaderState,
    selectReaderDocument,
    updateReaderSettings,
} from '@/data/readerStore';
import {
  extractReaderDocument,
  extractReaderText,
  getReaderImportFormat,
  getUnsupportedReaderImportMessage,
  isEnabledReaderImportFormat,
} from '@/data/readerImport';

const fontOptions: { label: string; value: ReaderSettings['fontFamily'] }[] = [
  { label: 'System', value: 'system' },
  { label: 'Serif', value: 'serif' },
  { label: 'Mono', value: 'mono' },
];

const backgroundOptions: { label: string; value: ReaderSettings['backgroundColor'] }[] = [
  { label: 'Light', value: '#F8FAFC' },
  { label: 'Warm', value: '#FFF7ED' },
  { label: 'Mint', value: '#ECFDF5' },
];

export default function ReaderScreen() {
  const [readerState, setReaderState] = useState<ReaderState>(getDefaultReaderState());
  const [libraryState, setLibraryState] = useState<LibraryState>(getDefaultLibraryState());
  const [quickNote, setQuickNote] = useState('');
  const [readerSaveMessage, setReaderSaveMessage] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      Promise.all([loadReaderState(), loadLibraryState()]).then(([nextReaderState, nextLibraryState]) => {
        if (!isMounted) return;

        setReaderState(nextReaderState);
        setLibraryState(nextLibraryState);
      });

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const selectedDocument = readerState.documents.find((document) => document.id === readerState.selectedDocumentId);
  const readerTokens = useMemo(() => tokenizeReaderText(selectedDocument?.content ?? ''), [selectedDocument?.content]);

  const selectedHighlightText = useMemo(() => {
    if (!selectionRange) return '';

    return readerTokens.slice(selectionRange.start, selectionRange.end + 1).join('').trim();
  }, [selectionRange, readerTokens]);

  const handlePickText = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        base64: false,
        copyToCacheDirectory: true,
        type: [
          'text/plain',
          'text/html',
          'text/*',
          'application/epub+zip',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const importFormat = getReaderImportFormat(asset.name, asset.mimeType);

      if (!isEnabledReaderImportFormat(importFormat)) {
        Alert.alert('Import Reader', getUnsupportedReaderImportMessage(importFormat));
        return;
      }

      const pickedFile = asset.file ?? new File(asset.uri);
      const importedDocument =
        importFormat === 'docx'
          ? await extractReaderDocument(asset.name, await pickedFile.arrayBuffer(), asset.mimeType)
          : extractReaderText(asset.name, await pickedFile.text());

      if (!importedDocument.content.trim()) {
        Alert.alert('Import Reader', 'File này không có nội dung text có thể đọc.');
        return;
      }

      importReaderText(
        readerState,
        importedDocument.title,
        importedDocument.content,
        importedDocument.sourceFormat
      ).then(setReaderState);
    } catch (error) {
      Alert.alert('Import Reader thất bại', error instanceof Error ? error.message : 'Chưa thể đọc file này.');
    }
  };

  const handleSelectDocument = (documentId: string) => {
    selectReaderDocument(readerState, documentId).then(setReaderState);
  };

  const handleUpdateSettings = (settings: Partial<ReaderSettings>) => {
    updateReaderSettings(readerState, settings).then(setReaderState);
  };

  const handleTokenPress = (index: number) => {
    if (!selectionRange) {
      setSelectionRange({ start: index, end: index });
      setQuickNote('');
      setReaderSaveMessage('');
      return;
    }

    // Check if the tapped token is adjacent (allowing 1 token gap for space/punctuation)
    const isAdjacentAfter = index === selectionRange.end + 1 || index === selectionRange.end + 2;
    const isAdjacentBefore = index === selectionRange.start - 1 || index === selectionRange.start - 2;

    if (isAdjacentAfter) {
      setSelectionRange({ start: selectionRange.start, end: index });
    } else if (isAdjacentBefore) {
      setSelectionRange({ start: index, end: selectionRange.end });
    } else {
      // Start a new selection if tapped far away
      setSelectionRange({ start: index, end: index });
      setQuickNote('');
      setReaderSaveMessage('');
    }
  };

  const handleOpenLookup = () => {
    if (!selectedHighlightText) return;

    router.push({ pathname: '/word', params: { sourceLang: 'en', targetLang: 'vi', word: selectedHighlightText } });
  };

  const handleCloseSelection = () => {
    setSelectionRange(null);
    setQuickNote('');
    setReaderSaveMessage('');
  };

  const handleCreateFlashcardFromSelection = () => {
    if (!selectedHighlightText) return;

    const folderId = getReaderSaveFolderId(libraryState);

    saveWordToFolder(libraryState, createReaderDictionaryEntry(selectedHighlightText), folderId, quickNote)
      .then((nextState) => {
        const savedWordId = `word-${selectedHighlightText.toLowerCase()}`;
        return createFlashcardsFromWordIds(nextState, [savedWordId], ['bilingual']);
      })
      .then((finalState) => {
        setLibraryState(finalState);
        setReaderSaveMessage(`Đã tạo flashcard cho "${selectedHighlightText}".`);
        setQuickNote('');
      })
      .catch((err) => {
        Alert.alert('Lỗi tạo flashcard', err instanceof Error ? err.message : 'Không thể tạo flashcard.');
      });
  };

  const handleSaveSelection = () => {
    if (!selectedHighlightText) return;

    const folderId = getReaderSaveFolderId(libraryState);

    saveWordToFolder(libraryState, createReaderDictionaryEntry(selectedHighlightText), folderId, quickNote)
      .then((nextState) => {
        setLibraryState(nextState);
        setReaderSaveMessage(`Đã lưu cụm từ "${selectedHighlightText}".`);
        setQuickNote('');
      })
      .catch((err) => {
        Alert.alert('Lỗi lưu', err instanceof Error ? err.message : 'Không thể lưu cụm từ.');
      });
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.82} onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.82} onPress={handlePickText} style={styles.importButton}>
            <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
            <Text style={styles.importButtonText}>Nhập file</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.kicker}>Trình đọc MVP</Text>
        <Text style={styles.title}>Đọc và tra từ nhanh</Text>

        {readerState.documents.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.documentRow}>
            {readerState.documents.map((document) => {
              const isSelected = document.id === readerState.selectedDocumentId;

              return (
                <TouchableOpacity
                  key={document.id}
                  activeOpacity={0.82}
                  onPress={() => handleSelectDocument(document.id)}
                  style={[styles.documentChip, isSelected && styles.activeDocumentChip]}>
                  <Text style={[styles.documentChipText, isSelected && styles.activeDocumentChipText]}>{document.title}</Text>
                  <Text style={[styles.documentFormatText, isSelected && styles.activeDocumentFormatText]}>
                    {(document.sourceFormat ?? 'txt').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.settingsPanel}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Cỡ chữ</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => handleUpdateSettings({ fontSize: Math.max(14, readerState.settings.fontSize - 1) })}
                style={styles.stepButton}>
                <Ionicons name="remove" size={17} color="#2563EB" />
              </TouchableOpacity>
              <Text style={styles.stepValue}>{readerState.settings.fontSize}</Text>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => handleUpdateSettings({ fontSize: Math.min(26, readerState.settings.fontSize + 1) })}
                style={styles.stepButton}>
                <Ionicons name="add" size={17} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.optionRow}>
            {fontOptions.map((option) => {
              const isSelected = readerState.settings.fontFamily === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.82}
                  onPress={() => handleUpdateSettings({ fontFamily: option.value })}
                  style={[styles.optionButton, isSelected && styles.activeOptionButton]}>
                  <Text style={[styles.optionText, isSelected && styles.activeOptionText]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.optionRow}>
            {backgroundOptions.map((option) => {
              const isSelected = readerState.settings.backgroundColor === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.82}
                  onPress={() => handleUpdateSettings({ backgroundColor: option.value })}
                  style={[
                    styles.backgroundButton,
                    { backgroundColor: option.value },
                    isSelected && styles.activeBackgroundButton,
                  ]}>
                  <Text style={styles.backgroundButtonText}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedDocument ? (
          <View style={[styles.readerPage, { backgroundColor: readerState.settings.backgroundColor }]}>
            <Text style={styles.readerTitle}>{selectedDocument.title}</Text>
            <View style={styles.readerTextWrap}>
              {readerTokens.slice(0, 900).map((token, index) => {
                const isWord = /[A-Za-z]/.test(token);
                const inSelection = selectionRange ? index >= selectionRange.start && index <= selectionRange.end : false;

                return isWord ? (
                  <TouchableOpacity
                    key={`${token}-${index}`}
                    activeOpacity={0.72}
                    onPress={() => handleTokenPress(index)}>
                    <Text
                      style={[
                        styles.readerWord,
                        getReaderTextStyle(readerState.settings),
                        inSelection && styles.selectedRangeWord,
                      ]}>
                      {token}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text key={`${token}-${index}`} style={[styles.readerWord, getReaderTextStyle(readerState.settings)]}>
                    {token}
                  </Text>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="reader-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Chưa có văn bản</Text>
            <Text style={styles.emptyText}>Import file TXT hoặc HTML để đọc. Bấm vào một từ tiếng Anh để tra nghĩa, lưu từ hoặc ghi chú nhanh.</Text>
          </View>
        )}
        {selectionRange && selectedHighlightText ? (
          <View style={styles.readerActionPanel}>
            <View style={styles.readerActionHeader}>
              <View>
                <Text style={styles.readerActionKicker}>Highlight</Text>
                <Text style={styles.readerActionWord}>{selectedHighlightText}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.75} onPress={handleCloseSelection} style={styles.readerActionClose}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <TextInput
              multiline
              onChangeText={setQuickNote}
              placeholder="Ghi chú cho cụm từ..."
              placeholderTextColor="#94A3B8"
              style={styles.quickNoteInput}
              value={quickNote}
            />
            {readerSaveMessage ? <Text style={styles.readerSaveMessage}>{readerSaveMessage}</Text> : null}
            <View style={styles.readerActionButtons}>
              <TouchableOpacity activeOpacity={0.82} onPress={handleOpenLookup} style={styles.lookupActionButton}>
                <Ionicons name="search" size={17} color="#2563EB" />
                <Text style={styles.lookupActionText}>Tra nghĩa</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.82} onPress={handleSaveSelection} style={styles.saveActionButton}>
                <Ionicons name="bookmark-outline" size={17} color="#FFFFFF" />
                <Text style={styles.saveActionText}>Lưu cụm từ</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.82} onPress={handleCreateFlashcardFromSelection} style={styles.saveActionButton}>
                <Ionicons name="albums-outline" size={17} color="#FFFFFF" />
                <Text style={styles.saveActionText}>Tạo thẻ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function tokenizeReaderText(text: string) {
  return text.replace(/\s+/g, ' ').match(/[A-Za-z][A-Za-z'-]*|[^A-Za-z]+/g) ?? [];
}

function getReaderTextStyle(settings: ReaderSettings) {
  return {
    fontFamily: getFontFamily(settings.fontFamily),
    fontSize: settings.fontSize,
    lineHeight: Math.round(settings.fontSize * 1.55),
  };
}

function getFontFamily(fontFamily: ReaderSettings['fontFamily']) {
  if (fontFamily === 'serif') return 'Georgia';
  if (fontFamily === 'mono') return 'Courier New';

  return undefined;
}

function getReaderSaveFolderId(libraryState: LibraryState) {
  const dailyReviewFolder = libraryState.folders.find((folder) => folder.name.toLowerCase() === 'daily review');

  return dailyReviewFolder?.id ?? getFavoriteFolderId();
}

function createReaderDictionaryEntry(word: string): DictionaryEntry {
  return {
    word,
    ipa: '',
    audio: '',
    level: 'TXT',
    topic: 'Reader',
    vietnamese: 'Reader highlight',
    shortDefinition: 'Saved from Reader.',
    definitions: [
      {
        partOfSpeech: 'reader',
        meaning: 'Saved from Reader.',
        vietnamese: 'Từ được lưu khi đọc văn bản.',
        examples: [],
      },
    ],
    synonyms: [],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [],
    etymology: '',
    pronunciationTips: [],
  };
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
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  importButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  kicker: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 20,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 4,
  },
  documentRow: {
    gap: 8,
    paddingVertical: 14,
  },
  documentChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeDocumentChip: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  documentChipText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  activeDocumentChipText: {
    color: '#FFFFFF',
  },
  documentFormatText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
  },
  activeDocumentFormatText: {
    color: '#BFDBFE',
  },
  settingsPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 14,
    padding: 14,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settingLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  stepButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    minWidth: 24,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 9,
  },
  activeOptionButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  optionText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  activeOptionText: {
    color: '#2563EB',
  },
  backgroundButton: {
    alignItems: 'center',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 9,
  },
  activeBackgroundButton: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  backgroundButtonText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  readerPage: {
    borderRadius: 8,
    marginTop: 14,
    padding: 16,
  },
  readerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  readerTextWrap: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  readerWord: {
    color: '#1E293B',
  },
  selectedReaderWord: {
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    color: '#1D4ED8',
  },
  selectedRangeWord: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    color: '#92400E',
  },
  readerActionPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DBEAFE',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  readerActionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readerActionKicker: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  readerActionWord: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  readerActionClose: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  quickNoteInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    minHeight: 76,
    padding: 11,
    textAlignVertical: 'top',
  },
  readerSaveMessage: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 9,
  },
  readerActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  lookupActionButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  lookupActionText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
  },
  saveActionButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  saveActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 14,
    padding: 18,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
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
