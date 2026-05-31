import { View, type ViewProps } from 'react-native';

import { useToken } from '@/hooks/use-token';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const { colors } = useToken();

  // Use provided colors, fall back to canvas from design system
  const backgroundColor = lightColor || darkColor || colors.canvas;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
