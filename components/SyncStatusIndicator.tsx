import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addSyncStateListener, SyncState } from '@/data/supabaseSyncLifecycle';
import { useToken } from '@/hooks/use-token';

export function SyncStatusIndicator() {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const { colors, radius } = useToken();

  useEffect(() => {
    return addSyncStateListener((state) => {
      setSyncState(state);
    });
  }, []);

  if (syncState === 'idle') return null;

  const getStatusDetails = () => {
    switch (syncState) {
      case 'syncing':
        return {
          icon: null,
          text: 'Đồng bộ...',
          color: colors.textSecondary,
          spinner: true,
        };
      case 'synced':
        return {
          icon: 'cloud-done-outline' as const,
          text: 'Đã đồng bộ',
          color: '#16A34A', // green
          spinner: false,
        };
      case 'offline':
        return {
          icon: 'cloud-offline-outline' as const,
          text: 'Ngoại tuyến',
          color: '#D97706', // amber
          spinner: false,
        };
      case 'error':
        return {
          icon: 'alert-circle-outline' as const,
          text: 'Lỗi đồng bộ',
          color: '#DC2626', // red
          spinner: false,
        };
      default:
        return null;
    }
  };

  const details = getStatusDetails();
  if (!details) return null;

  return (
    <View style={[styles.container, { borderColor: colors.borderDefault, borderRadius: radius.full }]}>
      {details.spinner ? (
        <ActivityIndicator size="small" color={details.color} style={styles.spinner} />
      ) : details.icon ? (
        <Ionicons name={details.icon} size={14} color={details.color} style={styles.icon} />
      ) : null}
      <Text style={[styles.text, { color: details.color }]}>{details.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  icon: {
    marginRight: 4,
  },
  spinner: {
    marginRight: 4,
    transform: [{ scale: 0.7 }],
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
