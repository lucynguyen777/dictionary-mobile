import { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { useReducedMotionPreference } from '@/components/app/MotionPressable';
import { useToken } from '@/hooks/use-token';

type SkeletonBlockProps = {
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
};

export default function SkeletonBlock({ height = 14, radius, style, width = '100%' }: SkeletonBlockProps) {
  const { colors, motion, radius: radiusTokens } = useToken();
  const reduceMotion = useReducedMotionPreference();
  const opacity = useRef(new Animated.Value(0.48)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.62);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          duration: motion.slow,
          toValue: 0.86,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          duration: motion.slow,
          toValue: 0.48,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [motion.slow, opacity, reduceMotion]);

  return (
    <Animated.View
      accessibilityLabel="Đang tải nội dung"
      style={[
        styles.block,
        {
          backgroundColor: colors.disabledBg,
          borderRadius: radius ?? radiusTokens.sm,
          height,
          opacity,
          width,
        },
        style,
      ]}
    />
  );
}

export function LoadingPulse({ style }: { style?: StyleProp<ViewStyle> }) {
  return <SkeletonBlock height={40} radius={12} style={style} />;
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
  },
});
