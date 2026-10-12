import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';
import Touchable from '@/components/app/Touchable';


import { type ReaderThemeColors } from '@/components/reader/readerOptions';
import { styles } from '@/components/reader/styles';
import { READER_FIXED_COLORS } from '@/constants/readerThemes';

export function ReaderDockButton({
  icon,
  isActive = false,
  isPrimary = false,
  label,
  onPress,
  theme,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  isActive?: boolean;
  isPrimary?: boolean;
  label: string;
  onPress: () => void;
  theme: ReaderThemeColors;
}) {
  return (
    <Touchable
      accessibilityLabel={label}
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        styles.readerDockButton,
        { backgroundColor: isPrimary ? theme.accent : theme.bg, borderColor: theme.border },
        isActive && { backgroundColor: theme.accentLight, borderColor: theme.accent },
        isPrimary && styles.readerDockPrimaryButton,
      ]}>
      <Ionicons name={icon} size={isPrimary ? 23 : 21} color={isPrimary ? READER_FIXED_COLORS.onAccent : theme.accent} />
    </Touchable>
  );
}
