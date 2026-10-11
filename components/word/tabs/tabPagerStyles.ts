import { createContext, useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useToken } from '@/hooks/use-token';

export const TabPagerTokenContext = createContext<ReturnType<typeof useToken> | null>(null);

export function useTabPagerToken() {
  const fallbackToken = useToken();
  return useContext(TabPagerTokenContext) ?? fallbackToken;
}

export function useTabPagerStyles() {
  const token = useTabPagerToken();
  return useMemo(
    () => createTabPagerStyles(token),
    [token]
  );
}

export function createTabPagerStyles({
  colors,
  radius,
  shadows,
  spacing,
}: ReturnType<typeof useToken>) {
return StyleSheet.create({
  pagerWrap: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  scrollTopButton: {
    alignItems: 'center',
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.full,
    bottom: 18,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    width: 44,
    zIndex: 30,
    ...shadows.md,
  },
  page: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: 760,
    width: '100%',
    paddingBottom: 118,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  block: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  stateCard: {
    alignItems: 'flex-start',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    padding: 14,
  },
  stateCopy: {
    flex: 1,
  },
  stateTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  stateText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  loadingStateCard: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.focusRing,
  },
  loadingStateTitle: {
    color: colors.accentPrimary,
  },
  loadingStateText: {
    color: colors.textSecondary,
  },
  successStateCard: {
    backgroundColor: colors.statusSuccess,
    borderColor: colors.accentSuccess,
  },
  successStateTitle: {
    color: colors.accentSuccess,
  },
  successStateText: {
    color: colors.textSecondary,
  },
  warningStateCard: {
    backgroundColor: colors.statusWarning,
    borderColor: colors.accentWarning,
  },
  warningStateTitle: {
    color: colors.accentWarning,
  },
  warningStateText: {
    color: colors.textSecondary,
  },
  emptyStateCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderDefault,
  },
  emptyStateTitle: {
    color: colors.textPrimary,
  },
  emptyStateText: {
    color: colors.textSecondary,
  },
  previewStateCard: {
    backgroundColor: colors.statusWarning,
    borderColor: colors.accentWarning,
  },
  infoCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    marginBottom: 14,
    padding: 16,
  },
  infoTitle: {
    color: colors.accentPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  warningCard: {
    backgroundColor: colors.statusWarning,
    borderColor: colors.accentWarning,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  warningTitle: {
    color: colors.accentWarning,
    fontSize: 13,
    fontWeight: '700',
  },
  warningText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  definitionItem: {
    paddingTop: 0,
  },
  definitionItemDivider: {
    borderTopColor: colors.borderDefault,
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
  },
  definitionNumber: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  definitionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  definitionMetaPill: {
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  definitionMetaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  blueMetaPill: {
    backgroundColor: colors.accentSoft,
  },
  blueMetaText: {
    color: colors.accentPrimary,
  },
  greenMetaPill: {
    backgroundColor: colors.statusSuccess,
  },
  greenMetaText: {
    color: colors.accentSuccess,
  },
  neutralMetaPill: {
    backgroundColor: colors.surfaceMuted,
  },
  neutralMetaText: {
    color: colors.textSecondary,
  },
  body: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  secondaryDefinition: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
  },
  translation: {
    color: colors.accentPrimary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 10,
  },
  exampleLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  exampleBlock: {
    marginBottom: 10,
  },
  exampleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  exampleAudioButton: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    padding: 4,
    marginTop: 1,
  },
  example: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  exampleTranslation: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginLeft: 32,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipButton: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: colors.accentPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  ghostChipButton: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderDefault,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostChipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  mediumSpace: {
    marginTop: 28,
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: colors.statusWarning,
    borderColor: colors.accentWarning,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  previewTitle: {
    color: colors.accentWarning,
    fontSize: 13,
    fontWeight: '700',
  },
  previewText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  smallBlock: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: 12,
    padding: 18,
  },
  phraseHeader: {
    gap: 6,
    marginBottom: 10,
  },
  phraseType: {
    color: colors.accentPrimary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  collocation: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  tenseBlock: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18,
  },
  noteCard: {
    backgroundColor: colors.statusSuccess,
    borderRadius: radius.md,
    marginTop: 18,
    padding: 18,
  },
  noteTitle: {
    color: colors.accentSuccess,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  recordingCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.focusRing,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 18,
    padding: 14,
  },
  recordingCopy: {
    marginBottom: 12,
  },
  recordingTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  recordingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  recordingButton: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  stopRecordingButton: {
    backgroundColor: colors.accentError,
  },
  recordingButtonText: {
    color: colors.accentPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  stopRecordingButtonText: {
    color: colors.textOnAccent,
  },
  playRecordingButton: {
    alignItems: 'center',
    backgroundColor: colors.statusSuccess,
    borderRadius: radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  playRecordingText: {
    color: colors.accentSuccess,
    fontSize: 13,
    fontWeight: '700',
  },
  disabledRecordingButton: {
    backgroundColor: colors.disabledBg,
  },
  disabledRecordingText: {
    color: colors.disabledText,
  },
  tableHeader: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: 10,
  },
  tableRow: {
    borderBottomColor: colors.borderDefault,
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 12,
  },
  tableCell: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  note: {
    color: colors.textSecondary,
    flexBasis: '100%',
    fontSize: 12,
    marginTop: 6,
  },
  loadingSkeletonStack: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
}
