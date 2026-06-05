import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { useToken } from '@/hooks/use-token';

type MotionPressableProps = PropsWithChildren<
  Omit<PressableProps, 'style'> & {
    hoverStyle?: StyleProp<ViewStyle>;
    pressScale?: number;
    pressableStyle?: StyleProp<ViewStyle>;
    pressedStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
  }
>;

export function useReducedMotionPreference() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((isEnabled) => {
        if (isMounted) setReduceMotion(isEnabled);
      })
      .catch(() => {
        if (isMounted) setReduceMotion(false);
      });

    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);

    return () => {
      isMounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduceMotion;
}

export default function MotionPressable({
  children,
  disabled,
  hoverStyle,
  onHoverIn,
  onHoverOut,
  onPressIn,
  onPressOut,
  pressScale,
  pressableStyle,
  pressedStyle,
  style,
  ...pressableProps
}: MotionPressableProps) {
  const { interactions, motion } = useToken();
  const reduceMotion = useReducedMotionPreference();
  const scale = useRef(new Animated.Value(1)).current;
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const activePressScale = pressScale ?? interactions.pressScale;

  const animateScale = (nextScale: number, duration: number) => {
    Animated.timing(scale, {
      duration: reduceMotion ? motion.reduced : duration,
      toValue: reduceMotion ? interactions.reducedScale : nextScale,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      {...pressableProps}
      disabled={disabled}
      onHoverIn={(event) => {
        if (Platform.OS === 'web' && !disabled) {
          setIsHovered(true);
          animateScale(interactions.hoverScale, motion.fast);
        }
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        if (Platform.OS === 'web') {
          setIsHovered(false);
          animateScale(1, motion.fast);
        }
        onHoverOut?.(event);
      }}
      onPressIn={(event) => {
        if (!disabled) {
          setIsPressed(true);
          animateScale(activePressScale, motion.press);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setIsPressed(false);
        animateScale(isHovered ? interactions.hoverScale : 1, motion.press);
        onPressOut?.(event);
      }}
      style={pressableStyle}>
      <Animated.View
        style={[
          style,
          isHovered && hoverStyle,
          isPressed && pressedStyle,
          disabled && { opacity: 0.56 },
          { transform: [{ scale }] },
        ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
