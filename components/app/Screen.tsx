import { PropsWithChildren } from 'react';
import { ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useToken } from '@/hooks/use-token';

// Tab screens sit above the tab bar, which already pads the bottom inset, so the default skips it.
// Full-screen routes pass bottom; screens under a navigation header skip top.
const TAB_SCREEN_EDGES: Edge[] = ['top', 'left', 'right'];

export default function Screen({
  children,
  edges = TAB_SCREEN_EDGES,
  style,
}: PropsWithChildren<{ edges?: Edge[]; style?: ViewStyle }>) {
  const { colors } = useToken();

  return (
    <SafeAreaView edges={edges} style={[{ backgroundColor: colors.canvasAlt, flex: 1 }, style]}>
      {children}
    </SafeAreaView>
  );
}
