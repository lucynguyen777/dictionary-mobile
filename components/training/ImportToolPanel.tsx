import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, type Href } from 'expo-router';
import { ComponentProps, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { FlashcardType, LibraryState, getFavoriteFolderId } from '@/data/libraryStore';

import { FilterChip, flashcardOptions } from '@/components/training/shared';
import { styles } from '@/components/training/styles';

type ImportSourceId = 'csv-tsv' | 'reader-highlights' | 'class-list';

const importSourceOptions: {
  id: ImportSourceId;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  status: string;
}[] = [
  {
    id: 'csv-tsv',
    title: 'CSV / TSV',
    description: 'File bảng từ vựng có word, definition, ipa, note, tags.',
    icon: 'document-attach-outline',
    status: 'Đã hỗ trợ trong Library',
  },
  {
    id: 'reader-highlights',
    title: 'Highlight Reader',
    description: 'Từ và ghi chú đã lưu khi đọc TXT/HTML.',
    icon: 'reader-outline',
    status: 'Dùng qua Reader',
  },
  {
    id: 'class-list',
    title: 'Danh sách lớp học',
    description: 'Paste danh sách từ, mỗi dòng một mục để chuẩn hóa sau.',
    icon: 'clipboard-outline',
    status: 'Cập nhật trong phiên bản sau',
  },
];

const importMappingPreview: Record<ImportSourceId, { source: string; target: string; note: string }[]> = {
  'csv-tsv': [
    { source: 'word / term', target: 'word', note: 'Bắt buộc' },
    { source: 'definition / meaning', target: 'definition', note: 'Tự nhận diện header' },
    { source: 'ipa / pronunciation', target: 'ipa', note: 'Tùy chọn' },
    { source: 'note, tags', target: 'note, tags', note: 'Gộp vào metadata' },
  ],
  'reader-highlights': [
    { source: 'highlight text', target: 'word', note: 'Từ hoặc cụm từ đã chọn' },
    { source: 'reader note', target: 'note', note: 'Ghi chú khi đọc' },
    { source: 'document title', target: 'tags', note: 'Nguồn ngữ cảnh' },
  ],
  'class-list': [
    { source: 'line 1..n', target: 'word', note: 'Một từ mỗi dòng' },
    { source: 'word - meaning', target: 'definition', note: 'Tách nghĩa nếu có dấu phân cách' },
    { source: '#tag', target: 'tags', note: 'Chuẩn hóa topic' },
  ],
};

export function ImportToolPanel({ libraryState }: { libraryState: LibraryState }) {
  const libraryHref = '/library' as Href;
  const [sourceId, setSourceId] = useState<ImportSourceId>('csv-tsv');
  const [destinationMode, setDestinationMode] = useState<'new' | 'existing'>('new');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [flashcardChecks, setFlashcardChecks] = useState<Record<FlashcardType, boolean>>({
    bilingual: true,
    'word-definition': true,
    'definition-word': false,
    'word-pronunciation': false,
  });

  const targetFolders = useMemo(
    () => libraryState.folders.filter((folder) => folder.id !== getFavoriteFolderId()),
    [libraryState.folders]
  );
  const selectedSource = importSourceOptions.find((source) => source.id === sourceId) ?? importSourceOptions[0];
  const selectedFolder = targetFolders.find((folder) => folder.id === selectedFolderId);
  const importedWordCount = libraryState.savedWords.filter((word) => word.source === 'import').length;
  const enabledFlashcardCount = Object.values(flashcardChecks).filter(Boolean).length;

  useEffect(() => {
    if (!selectedFolderId && targetFolders.length) {
      setSelectedFolderId(targetFolders[0].id);
    }
  }, [selectedFolderId, targetFolders]);

  const handleToggleFlashcardCheck = (type: FlashcardType) => {
    setFlashcardChecks((current) => ({ ...current, [type]: !current[type] }));
  };

  return (
    <View style={styles.toolPanel}>
      <View style={styles.toolPanelHeader}>
        <View style={[styles.iconWrap, { backgroundColor: '#FFF1E8' }]}>
          <Ionicons name="cloud-upload-outline" size={28} color="#0F172A" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.featureTitle}>Nhập dữ liệu</Text>
          <Text style={styles.description}>Chuẩn bị nguồn, mapping, validate và flashcard trước khi mở flow import thật trong Library.</Text>
        </View>
      </View>

      <Text style={styles.toolSectionLabel}>Nguồn dữ liệu</Text>
      <View style={styles.importSourceGrid}>
        {importSourceOptions.map((source) => {
          const isSelected = sourceId === source.id;

          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={source.id}
              onPress={() => setSourceId(source.id)}
              style={[styles.importSourceCard, isSelected && styles.importSourceCardActive]}>
              <View style={styles.importSourceHeader}>
                <Ionicons name={source.icon} size={18} color={isSelected ? '#7C3AED' : '#64748B'} />
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={isSelected ? '#7C3AED' : '#CBD5E1'}
                />
              </View>
              <Text style={[styles.importSourceTitle, isSelected && styles.importSourceTitleActive]}>{source.title}</Text>
              <Text style={styles.importSourceText}>{source.description}</Text>
              <Text style={styles.importSourceStatus}>{source.status}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.importPreviewPanel}>
        <View style={styles.importPreviewHeader}>
          <Text style={styles.importPreviewTitle}>Mapping preview</Text>
          <Text style={styles.importPreviewBadge}>{selectedSource.title}</Text>
        </View>
        {importMappingPreview[sourceId].map((item) => (
          <View key={`${item.source}-${item.target}`} style={styles.importMappingPreviewRow}>
            <Text style={styles.importMappingSource} numberOfLines={1}>{item.source}</Text>
            <Ionicons name="arrow-forward" size={15} color="#94A3B8" />
            <Text style={styles.importMappingTarget} numberOfLines={1}>{item.target}</Text>
            <Text style={styles.importMappingNote} numberOfLines={1}>{item.note}</Text>
          </View>
        ))}
      </View>

      <View style={styles.importValidationGrid}>
        <ImportValidationStat label="Nguồn" value={selectedSource.status} />
        <ImportValidationStat label="Đã nhập local" value={`${importedWordCount} từ`} />
        <ImportValidationStat
          label="Bộ từ đích"
          value={destinationMode === 'new' ? 'Tạo bộ mới' : selectedFolder?.name ?? 'Chọn bộ từ'}
        />
        <ImportValidationStat label="Flashcard" value={`${enabledFlashcardCount} loại thẻ`} />
      </View>

      <View style={styles.importValidationNote}>
        <Ionicons name="checkmark-circle-outline" size={17} color="#16A34A" />
        <Text style={styles.importValidationText}>
          Flow thật trong Library đã kiểm tra file trống, thiếu khóa chính và từ trùng trước khi import.
        </Text>
      </View>

      <Text style={styles.toolSectionLabel}>Bộ từ đích</Text>
      <View style={styles.importDestinationRow}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => setDestinationMode('new')}
          style={[styles.importDestinationButton, destinationMode === 'new' && styles.importDestinationButtonActive]}>
          <Ionicons
            name={destinationMode === 'new' ? 'radio-button-on' : 'radio-button-off'}
            size={17}
            color={destinationMode === 'new' ? '#7C3AED' : '#94A3B8'}
          />
          <Text style={[styles.importDestinationText, destinationMode === 'new' && styles.importDestinationTextActive]}>
            Bộ từ mới theo tên file
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => {
            setDestinationMode('existing');
            setSelectedFolderId((current) => current || targetFolders[0]?.id || '');
          }}
          style={[styles.importDestinationButton, destinationMode === 'existing' && styles.importDestinationButtonActive]}>
          <Ionicons
            name={destinationMode === 'existing' ? 'radio-button-on' : 'radio-button-off'}
            size={17}
            color={destinationMode === 'existing' ? '#7C3AED' : '#94A3B8'}
          />
          <Text style={[styles.importDestinationText, destinationMode === 'existing' && styles.importDestinationTextActive]}>
            Bộ từ có sẵn
          </Text>
        </TouchableOpacity>
      </View>

      {destinationMode === 'existing' ? (
        targetFolders.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.importFolderPickerRow}>
            {targetFolders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;

              return (
                <FilterChip
                  key={folder.id}
                  isSelected={isSelected}
                  label={folder.name}
                  onPress={() => setSelectedFolderId(folder.id)}
                />
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.toolStateCard}>
            <Ionicons name="folder-open-outline" size={22} color="#94A3B8" />
            <Text style={styles.toolStateTitle}>Chưa có bộ từ đích</Text>
            <Text style={styles.toolStateText}>Tạo bộ từ mới khi import hoặc tạo folder trước trong Library.</Text>
          </View>
        )
      ) : null}

      <Text style={styles.toolSectionLabel}>Checklist tạo flashcard</Text>
      <View style={styles.importFlashcardGrid}>
        {flashcardOptions.map((option) => {
          const isSelected = flashcardChecks[option.type];

          return (
            <TouchableOpacity
              activeOpacity={0.82}
              key={option.type}
              onPress={() => handleToggleFlashcardCheck(option.type)}
              style={[styles.importFlashcardPlanItem, isSelected && styles.importFlashcardPlanItemActive]}>
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={20}
                color={isSelected ? '#7C3AED' : '#94A3B8'}
              />
              <View style={styles.importFlashcardPlanCopy}>
                <Text style={styles.importFlashcardPlanTitle}>{option.label}</Text>
                <Text style={styles.importFlashcardPlanText}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Link href={libraryHref} asChild>
        <TouchableOpacity activeOpacity={0.85} style={styles.generateButton}>
          <Ionicons name="open-outline" size={18} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>Mở Library để import file</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

export function ImportValidationStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.importValidationStat}>
      <Text style={styles.importValidationValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.importValidationLabel}>{label}</Text>
    </View>
  );
}
