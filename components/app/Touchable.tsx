import { forwardRef } from 'react';
import { Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';

type TouchableProps = Omit<PressableProps, 'style'> & {
  // Opacity while pressed, as with TouchableOpacity (default 0.2 there; 0.6 here for softer feedback).
  activeOpacity?: number;
  style?: StyleProp<ViewStyle>;
};

// Drop-in replacement for TouchableOpacity used across screens (plan 3.5). Same layout (the style
// sits on the touchable itself), opacity feedback instead of motion (safe with reduced motion), and
// button semantics by default whenever it is pressable.
const Touchable = forwardRef<View, TouchableProps>(function Touchable(
  { activeOpacity = 0.6, accessibilityRole, onPress, onLongPress, style, ...props },
  ref
) {
  const isPressable = Boolean(onPress || onLongPress);
  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? (isPressable ? 'button' : undefined)}
      onLongPress={onLongPress}
      onPress={onPress}
      ref={ref}
      style={({ pressed }) => [style, pressed && isPressable && { opacity: activeOpacity }]}
      {...props}
    />
  );
});

export default Touchable;
