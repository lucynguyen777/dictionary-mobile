import { View, type ViewProps } from 'react-native';

import { useToken } from '@/hooks/use-token';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const { colors, theme } = useToken();

  const backgroundColor = theme === 'dark' ? darkColor ?? colors.canvas : lightColor ?? colors.canvas;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
