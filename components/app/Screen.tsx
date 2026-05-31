import { PropsWithChildren } from 'react';
import { SafeAreaView, ViewStyle } from 'react-native';

import { useToken } from '@/hooks/use-token';

export default function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const { colors } = useToken();

  return <SafeAreaView style={[{ backgroundColor: colors.canvasAlt, flex: 1 }, style]}>{children}</SafeAreaView>;
}
