import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import {
  ReaderSettings,
  ReaderState,
  getDefaultReaderState,
  importReaderText,
  loadReaderState,
  selectReaderDocument,
  updateReaderSettings,
} from '@/data/readerStore';

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

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      loadReaderState().then((state) => {
        if (isMounted) setReaderState(state);
      });

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const selectedDocument = readerState.documents.find((document) => document.id === readerState.selectedDocumentId);
  const readerTokens = useMemo(() => tokenizeReaderText(selectedDocument?.content ?? ''), [selectedDocument?.content]);

  const handlePickText = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        base64: false,
        copyToCacheDirectory: true,
        type: ['text/plain', 'text/*'],
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const content = asset.file ? await asset.file.text() : await new File(asset.uri).text();

      if (!content.trim()) {
        Alert.alert('Reader import', 'File này không có nội dung text.');
        return;
      }

      importReaderText(readerState, asset.name.replace(/\.[^/.]+$/, ''), content).then(setReaderState);
    } catch (error) {
      Alert.alert('Reader import failed', error instanceof Error ? error.message : 'Could not read this text file.');
    }
  };

  const handleSelectDocument = (documentId: string) => {
    selectReaderDocument(readerState, documentId).then(setReaderState);
  };

  const handleUpdateSettings = (settings: Partial<ReaderSettings>) => {
    updateReaderSettings(readerState, settings).then(setReaderState);
  };

  const handleLookupToken = (token: string) => {
    const word = token.toLowerCase().replace(/[^a-z'-]/g, '');
    if (!word || !/[a-z]/.test(word)) return;

    router.push({ pathname: '/word', params: { sourceLang: 'en', targetLang: 'vi', word } });
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
            <Text style={styles.importButtonText}>Import TXT</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.kicker}>Reader MVP</Text>
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

                return isWord ? (
                  <TouchableOpacity key={`${token}-${index}`} activeOpacity={0.72} onPress={() => handleLookupToken(token)}>
                    <Text style={[styles.readerWord, getReaderTextStyle(readerState.settings)]}>{token}</Text>
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
            <Text style={styles.emptyText}>Import file TXT để đọc. Bấm vào một từ tiếng Anh trong reader để mở trang Tra cứu.</Text>
          </View>
        )}
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
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
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

