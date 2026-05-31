import { StyleSheet, Text, type TextProps } from 'react-native';

import { Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'h1' | 'h2' | 'h3' | 'body' | 'bodyBold' | 'bodySm' | 'bodySm-bold' | 'caption' | 'link' | 'default' | 'title' | 'defaultSemiBold' | 'subtitle';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'body',
  ...rest
}: ThemedTextProps) {
  // Map old type names to new ones for backward compatibility
  let mappedType = type;
  if (type === 'default') mappedType = 'body';
  else if (type === 'defaultSemiBold') mappedType = 'bodyBold';
  else if (type === 'title') mappedType = 'h1';
  else if (type === 'subtitle') mappedType = 'h2';

  const color = useThemeColor({ light: lightColor, dark: darkColor }, mappedType === 'link' ? 'tint' : 'text');

  return (
    <Text
      style={[
        { color },
        mappedType === 'h1' ? styles.h1 : undefined,
        mappedType === 'h2' ? styles.h2 : undefined,
        mappedType === 'h3' ? styles.h3 : undefined,
        mappedType === 'body' ? styles.body : undefined,
        mappedType === 'bodyBold' ? styles.bodyBold : undefined,
        mappedType === 'bodySm' ? styles.bodySm : undefined,
        mappedType === 'bodySm-bold' ? styles.bodySmBold : undefined,
        mappedType === 'caption' ? styles.caption : undefined,
        mappedType === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: Typography.h1.fontSize,
    lineHeight: Typography.h1.lineHeight,
    fontWeight: Typography.h1.fontWeight,
  },
  h2: {
    fontSize: Typography.h2.fontSize,
    lineHeight: Typography.h2.lineHeight,
    fontWeight: Typography.h2.fontWeight,
  },
  h3: {
    fontSize: Typography.h3.fontSize,
    lineHeight: Typography.h3.lineHeight,
    fontWeight: Typography.h3.fontWeight,
  },
  body: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    fontWeight: Typography.body.fontWeight,
  },
  bodyBold: {
    fontSize: Typography.bodyBold.fontSize,
    lineHeight: Typography.bodyBold.lineHeight,
    fontWeight: Typography.bodyBold.fontWeight,
  },
  bodySm: {
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    fontWeight: Typography.bodySm.fontWeight,
  },
  bodySmBold: {
    fontSize: Typography.bodySmBold.fontSize,
    lineHeight: Typography.bodySmBold.lineHeight,
    fontWeight: Typography.bodySmBold.fontWeight,
  },
  caption: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    fontWeight: Typography.caption.fontWeight,
  },
  link: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    textDecorationLine: 'underline',
  },
});
