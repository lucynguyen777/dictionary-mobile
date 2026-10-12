import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useToken } from '@/hooks/use-token';

// Styles for the folder detail screen (app/folder/[id].tsx), built from the theme colors.
function createFolderStyles(colors: ReturnType<typeof useToken>['colors']) {
  return StyleSheet.create({
    screenBody: {
      flex: 1,
    },
    content: {
      paddingBottom: 96,
      paddingHorizontal: 18,
      paddingTop: 14,
    },
    scrollTopButton: {
      alignItems: 'center',
      backgroundColor: colors.accentPrimary,
      borderRadius: 22,
      bottom: 18,
      elevation: 24,
      height: 44,
      justifyContent: 'center',
      position: 'absolute',
      right: 18,
      boxShadow: '0px 6px 12px rgba(15, 23, 42, 0.18)',
      width: 44,
      zIndex: 30,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    iconButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 999,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    exportGroup: {
      flexDirection: 'row',
      gap: 8,
    },
    folderMenuPanel: {
      gap: 10,
      marginTop: 12,
    },
    folderMenuLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    hero: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 14,
      marginTop: 18,
    },
    folderIcon: {
      alignItems: 'center',
      borderRadius: 8,
      height: 74,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 74,
    },
    folderAvatarImage: {
      height: '100%',
      width: '100%',
    },
    heroCopy: {
      flex: 1,
      minWidth: 0,
    },
    kicker: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: '700',
      marginTop: 4,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 6,
    },
    folderTags: {
      color: colors.accentPrimary,
      fontSize: 12,
      fontWeight: '800',
      marginTop: 6,
    },
    manageCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginTop: 16,
      padding: 14,
    },
    manageHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    manageTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    lockedPill: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 999,
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      overflow: 'hidden',
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    nameInput: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.borderDefault,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    manageActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    deleteButton: {
      alignItems: 'center',
      backgroundColor: colors.statusError,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    deleteButtonText: {
      color: colors.accentError,
      fontSize: 12,
      fontWeight: '700',
    },
    searchBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      flexDirection: 'row',
      gap: 10,
      height: 48,
      marginBottom: 14,
      marginTop: 18,
      paddingHorizontal: 16,
    },
    searchInput: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
    },
    wordCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 12,
      padding: 14,
    },
    wordTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    wordLink: {
      flex: 1,
      paddingRight: 12,
    },
    wordTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    wordMeta: {
      color: colors.accentPrimary,
      fontSize: 13,
      fontWeight: '800',
      marginTop: 3,
    },
    removeButton: {
      alignItems: 'center',
      backgroundColor: colors.statusError,
      borderRadius: 999,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    definition: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 19,
      marginTop: 10,
    },
    noteInput: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.borderDefault,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 12,
      minHeight: 70,
      padding: 10,
      textAlignVertical: 'top',
    },
    noteButton: {
      alignSelf: 'flex-start',
      marginTop: 10,
    },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 22,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '700',
      marginTop: 10,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 19,
      marginTop: 6,
      textAlign: 'center',
    },
  });
}

export function useFolderStyles() {
  const { colors } = useToken();
  return { colors, styles: useMemo(() => createFolderStyles(colors), [colors]) };
}
