import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';

import Touchable from '@/components/app/Touchable';
import { DataStat } from '@/components/profile/Metrics';
import { useProfileStyles } from '@/components/profile/styles';
import { languageOptions } from '@/data/languages';
import { deleteInstalledOfflineDictionaryPack, installOfflineDictionaryPackFromSource } from '@/data/offlineDictionaryPackActions';
import { useToken } from '@/hooks/use-token';
import {
  type OfflinePackInstallState,
  formatOfflinePackInstallStatus,
  formatOfflinePackProgress,
  getOfflinePackInstallRecord,
  getOfflinePackInstallSummary,
} from '@/data/offlineDictionaryPackStore';
import {
  formatPackLanguageLabel,
  formatPackSizeRange,
  formatPackStatus,
  formatPackTitle,
  getOfflinePackRuntimeGate,
  getOfflinePackSummary,
  type OfflineDictionaryPack,
} from '@/data/offlineDictionaryPacks';

type Props = {
  installState: OfflinePackInstallState;
  onInstallStateChange: (state: OfflinePackInstallState) => void;
  packs: OfflineDictionaryPack[];
};

// Offline dictionary packs in the Profile privacy & data drawer: install, reinstall and delete.
export default function OfflinePackSettings({ installState, onInstallStateChange, packs }: Props) {
  const { colors } = useToken();
  const styles = useProfileStyles();
  const [busyId, setBusyId] = useState<string | null>(null);
  const offlinePackRuntimeOptions = { supportsSqliteRuntime: Platform.OS !== 'web' };
  const offlinePackSummary = getOfflinePackSummary(packs, offlinePackRuntimeOptions);
  const offlinePackInstallSummary = getOfflinePackInstallSummary(installState);

  const handleInstallOfflinePack = async (pack: OfflineDictionaryPack) => {
    const runtimeGate = getOfflinePackRuntimeGate(pack);

    if (!runtimeGate.canDownload || !pack.downloadSource) {
      Alert.alert('Chưa thể tải pack', runtimeGate.detail);
      return;
    }

    setBusyId(pack.id);

    try {
      const result = await installOfflineDictionaryPackFromSource({
        pack,
        state: installState,
      });

      onInstallStateChange(result.state);
      Alert.alert(
        result.ok ? 'Đã cài pack offline' : 'Lỗi cài pack offline',
        result.ok ? `Đã cài ${result.entryCount} mục từ vào SQLite.` : result.errorMessage
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteOfflinePack = (pack: OfflineDictionaryPack) => {
    Alert.alert('Xóa pack offline', 'Xóa SQLite pack và trạng thái cài đặt local trên thiết bị này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa pack',
        style: 'destructive',
        onPress: async () => {
          setBusyId(pack.id);

          try {
            const nextState = await deleteInstalledOfflineDictionaryPack({
              pack,
              state: installState,
            });
            onInstallStateChange(nextState);
            Alert.alert('Đã xóa pack', 'Pack offline đã được xóa khỏi thiết bị.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  return (
    <>
      <Text style={styles.sidebarGroupLabel}>Gói từ điển offline</Text>
      <View style={styles.offlinePackSummaryRow}>
        <DataStat label="Gói" value={offlinePackSummary.packCount} />
        <DataStat label="Đã cài" value={offlinePackInstallSummary.readyCount} />
      </View>
      {packs.map((pack) => {
        const packLanguageLabel = formatPackLanguageLabel(
          pack,
          (code) => languageOptions.find((item) => item.code === code)?.label ?? code
        );
        const runtimeGate = getOfflinePackRuntimeGate(pack, offlinePackRuntimeOptions);
        const installRecord = getOfflinePackInstallRecord(installState, pack);
        const installStatus = formatOfflinePackInstallStatus(installRecord.status);
        const progressLabel =
          installRecord.status === 'downloading' ? `Tiến độ ${formatOfflinePackProgress(installRecord)}` : installStatus;
        const isBusy = busyId === pack.id;
        const canInstall = runtimeGate.canDownload && !isBusy;
        const hasInstallRecord = installRecord.status !== 'not_downloaded';

        return (
          <View key={pack.id} style={styles.offlinePackRow}>
            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>{formatPackTitle(pack, packLanguageLabel)}</Text>
              <Text style={styles.securityText}>
                {pack.sourceName} · {formatPackSizeRange(pack)} · {pack.license}
              </Text>
              <Text style={styles.securityText}>{runtimeGate.detail}</Text>
            </View>
            <View style={styles.offlinePackStatusColumn}>
              <Text style={styles.offlinePackStatus}>{formatPackStatus(pack.status)}</Text>
              <Text style={styles.offlinePackInstallText}>{progressLabel}</Text>
              <Text style={styles.offlinePackRuntimeText}>{runtimeGate.actionLabel}</Text>
              <View style={styles.offlinePackActionRow}>
                <Touchable
                  accessibilityLabel={`Tải ${packLanguageLabel} offline pack`}
                  accessibilityRole="button"
                  activeOpacity={0.82}
                  disabled={!canInstall}
                  onPress={() => handleInstallOfflinePack(pack)}
                  style={[styles.offlinePackActionButton, !canInstall && styles.offlinePackActionButtonDisabled]}>
                  <Ionicons name="download-outline" size={14} color={canInstall ? colors.accentPrimary : colors.disabledText} />
                  <Text style={[styles.offlinePackActionText, !canInstall && styles.offlinePackActionTextDisabled]}>
                    {isBusy ? 'Đang xử lý' : installRecord.status === 'ready' ? 'Cài lại' : 'Tải pack'}
                  </Text>
                </Touchable>
                {hasInstallRecord ? (
                  <Touchable
                    accessibilityLabel={`Xóa ${packLanguageLabel} offline pack`}
                    accessibilityRole="button"
                    activeOpacity={0.82}
                    disabled={isBusy}
                    onPress={() => handleDeleteOfflinePack(pack)}
                    style={[styles.offlinePackDeleteButton, isBusy && styles.offlinePackActionButtonDisabled]}>
                    <Ionicons name="trash-outline" size={14} color={isBusy ? colors.textTertiary : colors.statusErrorText} />
                    <Text style={[styles.offlinePackDeleteText, isBusy && styles.offlinePackActionTextDisabled]}>
                      Xóa
                    </Text>
                  </Touchable>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </>
  );
}
