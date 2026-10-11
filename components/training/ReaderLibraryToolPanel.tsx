import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useToken } from '@/hooks/use-token';
import { ReaderDocument, ReaderState } from '@/data/readerStore';

import { styles } from '@/components/training/styles';

export function ReaderLibraryToolPanel({
  isImporting,
  onImport,
  onOpenDocument,
  readerState,
}: {
  isImporting: boolean;
  onImport: () => void;
  onOpenDocument: (documentId: string) => void;
  readerState: ReaderState;
}) {
  const { colors, shadows } = useToken();
  const documents = readerState.documents;

  return (
    <View style={[styles.toolPanel, { backgroundColor: colors.surface, borderColor: colors.borderDefault, ...shadows.sm }]}>
      <View style={styles.toolPanelHeader}>
        <View style={[styles.iconWrap, { backgroundColor: '#F1ECFF' }]}>
          <Ionicons name="reader-outline" size={28} color="#0F172A" />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Đọc sách kèm tra từ</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>Thư viện tài liệu đã nhập. Chọn một file để mở Trình đọc Novel và dùng highlight, tra từ, lưu từ, tạo flashcard như cũ.</Text>
        </View>
      </View>

      <View style={styles.readerLibraryToolbar}>
        <View style={[styles.toolStatusPill, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.toolStatusText, { color: colors.accentPrimary }]}>{documents.length} tài liệu</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isImporting}
          onPress={onImport}
          style={[styles.readerImportButton, { backgroundColor: colors.accentPrimary, ...shadows.glow }, isImporting && styles.exportButtonDisabled]}>
          <Ionicons name="document-text-outline" size={17} color="#FFFFFF" />
          <Text style={styles.openToolButtonText}>{isImporting ? 'Đang nhập...' : 'Nhập file'}</Text>
        </TouchableOpacity>
      </View>

      {documents.length ? (
        <View style={styles.readerDocumentGrid}>
          {documents.map((document) => (
            <ReaderDocumentCard
              document={document}
              isSelected={document.id === readerState.selectedDocumentId}
              key={document.id}
              onPress={() => onOpenDocument(document.id)}
            />
          ))}
        </View>
      ) : (
        <View style={[styles.toolStateCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderDefault }]}>
          <Ionicons name="library-outline" size={24} color={colors.textTertiary} />
          <Text style={[styles.toolStateTitle, { color: colors.textPrimary }]}>Chưa có tài liệu đọc</Text>
          <Text style={[styles.toolStateText, { color: colors.textSecondary }]}>
            Nhập TXT, HTML, EPUB, DOCX hoặc PDF đã bật gate để tạo thư viện đọc. Màn Trình đọc Novel chỉ tập trung vào đọc và tra từ.
          </Text>
        </View>
      )}
    </View>
  );
}

function ReaderDocumentCard({
  document,
  isSelected,
  onPress,
}: {
  document: ReaderDocument;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { colors, shadows } = useToken();
  const wordCount = getReaderDocumentWordCount(document.content);

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      onPress={onPress}
      style={[
        styles.readerDocumentCard,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.borderDefault, ...shadows.sm },
        isSelected && styles.readerDocumentCardActive,
        isSelected && { backgroundColor: colors.accentSoft, borderColor: colors.focusRing },
      ]}>
      <View style={styles.readerDocumentHeader}>
        <View style={[styles.readerDocumentIcon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="book-outline" size={18} color={colors.accentPrimary} />
        </View>
        <Text style={[styles.readerDocumentFormat, { color: colors.accentPrimary }]}>{(document.sourceFormat ?? 'txt').toUpperCase()}</Text>
      </View>
      <Text style={[styles.readerDocumentTitle, { color: colors.textPrimary }]} numberOfLines={2}>{document.title}</Text>
      <Text style={[styles.readerDocumentMeta, { color: colors.textSecondary }]}>{wordCount} từ · {formatReaderDocumentDate(document.updatedAt)}</Text>
      <View style={styles.readerDocumentOpenRow}>
        <Text style={[styles.readerDocumentOpenText, { color: colors.accentPrimary }]}>Mở trình đọc</Text>
        <Ionicons name="arrow-forward" size={15} color={colors.accentPrimary} />
      </View>
    </TouchableOpacity>
  );
}

function getReaderDocumentWordCount(content: string) {
  const words = content.trim().match(/\S+/g);
  return words?.length ?? 0;
}

function formatReaderDocumentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'vừa cập nhật';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}
