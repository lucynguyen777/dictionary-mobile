import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import Touchable from '@/components/app/Touchable';
import { FolderExportFormat, LibraryState, exportFolderToAnkiTsv, exportFolderToCsv, exportFolderToExcel, getFavoriteFolderId, getFolderExportRows } from '@/data/libraryStore';
import { BackendProxyError, completeGoogleSheetsConnection, connectGoogleSheets, exportFolderToGoogleSheets, getGoogleSheetsStatus } from '@/data/backendProxyClient';

import { FilterChip } from '@/components/training/shared';
import { ImportValidationStat } from '@/components/training/ImportToolPanel';
import { styles } from '@/components/training/styles';

type ExportActionId = FolderExportFormat | 'google-sheets';

type ExportHistoryItem = {
  id: string;
  action: ExportActionId;
  folderName: string;
  message: string;
  status: 'success' | 'failed' | 'blocked';
  createdAt: string;
};

const exportActions: {
  id: ExportActionId;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  status: string;
}[] = [
  {
    id: 'csv',
    title: 'CSV',
    description: 'Bảng từ vựng cơ bản, dễ mở bằng Sheets hoặc Excel.',
    icon: 'document-text-outline',
    status: 'Sẵn sàng',
  },
  {
    id: 'excel',
    title: 'Excel .xls',
    description: 'File HTML-compatible để mở nhanh trong Excel.',
    icon: 'grid-outline',
    status: 'Sẵn sàng',
  },
  {
    id: 'anki',
    title: 'Anki text',
    description: 'TSV text deck với front, back và tags.',
    icon: 'albums-outline',
    status: 'Sẵn sàng',
  },
  {
    id: 'google-sheets',
    title: 'Google Sheets',
    description: 'Kết nối Google để chuẩn bị xuất trực tiếp.',
    icon: 'logo-google',
    status: 'Beta - cần kết nối',
  },
];

type GoogleSheetsReturn =
  | { code: string; kind: 'authorized'; state: string }
  | { kind: 'denied' | 'failed' };

// Google OAuth returns to /advanced with either an authorization code to complete or an outcome flag.
export function useGoogleSheetsReturnParams(): GoogleSheetsReturn | null {
  const { googleSheets, googleSheetsCode, googleSheetsState } = useLocalSearchParams<{
    googleSheets?: string;
    googleSheetsCode?: string;
    googleSheetsState?: string;
  }>();
  return useMemo(() => {
    if (googleSheetsCode && googleSheetsState) {
      return { code: googleSheetsCode, kind: 'authorized', state: googleSheetsState };
    }
    if (googleSheets === 'denied' || googleSheets === 'failed') return { kind: googleSheets };
    return null;
  }, [googleSheets, googleSheetsCode, googleSheetsState]);
}

export function ExportToolPanel({ libraryState }: { libraryState: LibraryState }) {
  const libraryHref = '/library' as Href;
  const router = useRouter();
  const googleSheetsReturn = useGoogleSheetsReturnParams();
  const handledGoogleSheetsCode = useRef<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [activeActionId, setActiveActionId] = useState<ExportActionId>('csv');
  const [isRunningExport, setIsRunningExport] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Chọn bộ từ và định dạng để xuất file local.');
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [googleSheetsConnected, setGoogleSheetsConnected] = useState(false);

  const exportFolders = useMemo(
    () => libraryState.folders.filter((folder) => folder.id !== getFavoriteFolderId()),
    [libraryState.folders]
  );
  const selectedFolder = exportFolders.find((folder) => folder.id === selectedFolderId);
  const selectedFolderWordCount = selectedFolder
    ? libraryState.savedWords.filter((word) => word.folderIds.includes(selectedFolder.id)).length
    : 0;
  const canExport = Boolean(selectedFolder && selectedFolderWordCount);
  const canRunExportAction = activeActionId === 'google-sheets' && !googleSheetsConnected
    ? true
    : canExport;

  useEffect(() => {
    if (!selectedFolderId && exportFolders.length) {
      setSelectedFolderId(exportFolders[0].id);
      return;
    }

    if (selectedFolderId && !exportFolders.some((folder) => folder.id === selectedFolderId)) {
      setSelectedFolderId(exportFolders[0]?.id ?? '');
    }
  }, [exportFolders, selectedFolderId]);

  useEffect(() => {
    getGoogleSheetsStatus().then((status) => setGoogleSheetsConnected(status.connected)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!googleSheetsReturn) return;
    if (googleSheetsReturn.kind === 'authorized') {
      if (handledGoogleSheetsCode.current === googleSheetsReturn.code) return;
      handledGoogleSheetsCode.current = googleSheetsReturn.code;
    }
    // Clear the one-time code from the URL before using it so a reload cannot replay it.
    router.setParams({ googleSheets: undefined, googleSheetsCode: undefined, googleSheetsState: undefined });

    if (googleSheetsReturn.kind !== 'authorized') {
      setStatusMessage(googleSheetsReturn.kind === 'denied'
        ? 'Bạn đã huỷ kết nối Google Sheets.'
        : 'Không thể kết nối Google Sheets. Vui lòng thử lại.');
      return;
    }

    setIsRunningExport(true);
    setStatusMessage('Đang hoàn tất kết nối Google Sheets...');
    completeGoogleSheetsConnection(googleSheetsReturn.code, googleSheetsReturn.state)
      .then(() => {
        setGoogleSheetsConnected(true);
        setStatusMessage('Đã kết nối Google Sheets. Chọn bộ từ để xuất.');
      })
      .catch((error) => {
        const message = error instanceof BackendProxyError && error.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Đăng nhập lại ở tab Hồ sơ rồi kết nối Google Sheets lần nữa.'
          : 'Không thể hoàn tất kết nối Google Sheets. Hãy dùng đúng tài khoản đã bắt đầu kết nối và thử lại.';
        setStatusMessage(message);
      })
      .finally(() => setIsRunningExport(false));
  }, [googleSheetsReturn, router]);

  const addHistoryItem = (item: Omit<ExportHistoryItem, 'id' | 'createdAt'>) => {
    setHistory((current) => [
      {
        ...item,
        id: `${item.action}-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 5));
  };

  const handleRunExport = async () => {
    if (activeActionId === 'google-sheets') {
      try {
        setIsRunningExport(true);
        if (googleSheetsConnected && selectedFolder) {
          const result = await exportFolderToGoogleSheets(getFolderExportRows(libraryState, selectedFolder.id), `Dictionary Mobile - ${selectedFolder.name}`);
          setStatusMessage('Đã xuất bộ từ sang Google Sheets.');
          await Linking.openURL(result.spreadsheetUrl);
          return;
        }
        const { authorizationUrl } = await connectGoogleSheets();
        await Linking.openURL(authorizationUrl);
        setStatusMessage('Đã mở Google để kết nối. Sau khi xác nhận, quay lại app để xuất bộ từ.');
      } catch (error) {
        const message = error instanceof BackendProxyError && error.status === 401
          ? 'Bạn cần đăng nhập tài khoản cloud trước khi kết nối Google Sheets. Mở tab Hồ sơ và đăng nhập, sau đó thử lại.'
          : error instanceof BackendProxyError
            ? error.message
            : 'Không thể bắt đầu kết nối Google Sheets.';
        setStatusMessage(message);
        Alert.alert('Chưa thể kết nối Google Sheets', message);
      } finally {
        setIsRunningExport(false);
      }
      return;
    }

    if (!selectedFolder) {
      const message = 'Chọn một bộ từ trước khi xuất.';
      setStatusMessage(message);
      addHistoryItem({ action: activeActionId, folderName: 'Chưa chọn bộ từ', message, status: 'failed' });
      return;
    }

    if (!selectedFolderWordCount) {
      const message = 'Bộ từ này chưa có từ đã lưu để xuất.';
      setStatusMessage(message);
      addHistoryItem({ action: activeActionId, folderName: selectedFolder.name, message, status: 'failed' });
      return;
    }

    try {
      setIsRunningExport(true);
      setStatusMessage(`Đang xuất ${selectedFolder.name} sang ${formatExportActionLabel(activeActionId)}...`);
      const result =
        activeActionId === 'excel'
          ? await exportFolderToExcel(libraryState, selectedFolder.id)
          : activeActionId === 'anki'
            ? await exportFolderToAnkiTsv(libraryState, selectedFolder.id)
            : await exportFolderToCsv(libraryState, selectedFolder.id);

      setStatusMessage(result.message);
      addHistoryItem({
        action: activeActionId,
        folderName: selectedFolder.name,
        message: result.message,
        status: result.ok ? 'success' : 'failed',
      });

      Alert.alert(result.ok ? 'Đã xuất' : 'Chưa thể xuất', result.message);
    } catch {
      const message = 'Không thể xuất bộ từ này.';
      setStatusMessage(message);
      addHistoryItem({ action: activeActionId, folderName: selectedFolder.name, message, status: 'failed' });
      Alert.alert('Lỗi xuất dữ liệu', message);
    } finally {
      setIsRunningExport(false);
    }
  };

  return (
    <View style={styles.toolPanel}>
      <View style={styles.toolPanelHeader}>
        <View style={[styles.iconWrap, { backgroundColor: '#EAF7FA' }]}>
          <Ionicons name="download-outline" size={28} color="#0F172A" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.featureTitle}>Xuất bộ từ</Text>
          <Text style={styles.description}>Xuất bộ từ local sang CSV, Excel-compatible hoặc Anki text để học ngoài app.</Text>
        </View>
      </View>

      <View style={styles.blockedNotice}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#B45309" />
        <Text style={styles.blockedNoticeText}>Google Sheets đang ở beta. OAuth chạy qua backend; app không lưu Google token trên thiết bị.</Text>
      </View>

      <Text style={styles.toolSectionLabel}>Bộ từ cần xuất</Text>
      {exportFolders.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.importFolderPickerRow}>
          {exportFolders.map((folder) => (
            <FilterChip
              key={folder.id}
              isSelected={selectedFolderId === folder.id}
              label={folder.name}
              onPress={() => setSelectedFolderId(folder.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.toolStateCard}>
          <Ionicons name="folder-open-outline" size={22} color="#94A3B8" />
          <Text style={styles.toolStateTitle}>Chưa có bộ từ để xuất</Text>
          <Text style={styles.toolStateText}>Tạo folder và lưu vài từ trong Library trước khi xuất file.</Text>
          <Link href={libraryHref} asChild>
            <Touchable activeOpacity={0.82} style={styles.toolRetryButton}>
              <Text style={styles.toolRetryButtonText}>Mở Library</Text>
            </Touchable>
          </Link>
        </View>
      )}

      <View style={styles.exportSummaryGrid}>
        <ImportValidationStat label="Bộ từ" value={selectedFolder?.name ?? 'Chưa chọn'} />
        <ImportValidationStat label="Số từ" value={`${selectedFolderWordCount} từ`} />
      </View>

      <Text style={styles.toolSectionLabel}>Định dạng</Text>
      <View style={styles.exportActionGrid}>
        {exportActions.map((action) => {
          const isSelected = activeActionId === action.id;
          const isBlocked = false;

          return (
            <Touchable
              activeOpacity={0.82}
              key={action.id}
              onPress={() => setActiveActionId(action.id)}
              style={[
                styles.exportActionCard,
                isSelected && styles.exportActionCardActive,
                isBlocked && styles.exportActionCardBlocked,
                isBlocked && styles.futureFeatureMuted,
              ]}>
              <View style={styles.importSourceHeader}>
                <Ionicons name={action.icon} size={18} color={isBlocked ? '#B45309' : isSelected ? '#7C3AED' : '#64748B'} />
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={isSelected ? '#7C3AED' : '#CBD5E1'}
                />
              </View>
              <Text style={[styles.importSourceTitle, isSelected && styles.importSourceTitleActive]}>{action.title}</Text>
              <Text style={styles.importSourceText}>{action.description}</Text>
              <Text style={[styles.importSourceStatus, isBlocked && styles.exportBlockedStatus]}>{action.status}</Text>
            </Touchable>
          );
        })}
      </View>

      <Touchable
        activeOpacity={0.85}
        disabled={isRunningExport || !canRunExportAction}
        onPress={handleRunExport}
        style={[
          styles.exportButton,
          (isRunningExport || !canRunExportAction) && styles.exportButtonDisabled,
        ]}>
        <Ionicons name={activeActionId === 'google-sheets' ? 'logo-google' : 'download-outline'} size={18} color="#FFFFFF" />
        <Text style={styles.exportButtonText}>
          {isRunningExport ? 'Đang xử lý...' : activeActionId === 'google-sheets' ? (googleSheetsConnected ? 'Xuất sang Google Sheets' : 'Kết nối Google') : 'Xuất file'}
        </Text>
      </Touchable>

      <View style={styles.exportStatusCard}>
        <Text style={styles.toolSectionLabel}>Trạng thái</Text>
        <Text style={styles.exportStatusText}>{statusMessage}</Text>
      </View>

      <Text style={styles.toolSectionLabel}>Lịch sử phiên này</Text>
      {history.length ? (
        <View style={styles.exportHistoryList}>
          {history.map((item) => (
            <View key={item.id} style={styles.exportHistoryRow}>
              <Ionicons
                name={item.status === 'success' ? 'checkmark-circle-outline' : item.status === 'blocked' ? 'lock-closed-outline' : 'alert-circle-outline'}
                size={18}
                color={item.status === 'success' ? '#16A34A' : item.status === 'blocked' ? '#B45309' : '#DC2626'}
              />
              <View style={styles.exportHistoryCopy}>
                <Text style={styles.exportHistoryTitle} numberOfLines={1}>
                  {formatExportActionLabel(item.action)} · {item.folderName}
                </Text>
                <Text style={styles.exportHistoryMessage} numberOfLines={2}>{item.message}</Text>
              </View>
              <Text style={styles.exportHistoryTime}>{formatExportTimestamp(item.createdAt)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.toolStateCard}>
          <Ionicons name="time-outline" size={22} color="#94A3B8" />
          <Text style={styles.toolStateTitle}>Chưa có lượt xuất</Text>
          <Text style={styles.toolStateText}>Kết quả xuất file trong phiên này sẽ hiện ở đây.</Text>
        </View>
      )}
    </View>
  );
}

function formatExportActionLabel(actionId: ExportActionId) {
  if (actionId === 'excel') return 'Excel';
  if (actionId === 'anki') return 'Anki text';
  if (actionId === 'google-sheets') return 'Google Sheets';

  return 'CSV';
}

function formatExportTimestamp(value: string) {
  const date = new Date(value);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${hours}:${minutes}`;
}
