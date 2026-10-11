import { useEffect, useRef } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { useToken } from '@/hooks/use-token';

type Props = {
  tabs: string[];
  activeIndex: number;
  onTabPress: (index: number) => void;
};

type TabLayout = {
  x: number;
  width: number;
};

export default function StickyTabBar({ tabs, activeIndex, onTabPress }: Props) {
  const { colors } = useToken();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<TabLayout[]>([]);

  useEffect(() => {
    const layout = tabLayouts.current[activeIndex];
    if (!layout || !scrollRef.current) return;

    scrollRef.current.scrollTo({
      x: Math.max(0, layout.x + layout.width / 2 - screenWidth / 2),
      animated: true,
    });
  }, [activeIndex, screenWidth]);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvasAlt }]}>
      <ScrollView
        accessibilityRole="tablist"
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;

          return (
            <TouchableOpacity
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => onTabPress(index)}
              onLayout={(e: LayoutChangeEvent) => {
                tabLayouts.current[index] = {
                  x: e.nativeEvent.layout.x,
                  width: e.nativeEvent.layout.width,
                };
              }}
              style={styles.tab}>
              <Text numberOfLines={1} style={[styles.tabText, { color: colors.textTertiary }, isActive && { color: colors.accentPrimary }]}>
                {tab}
              </Text>
              <View style={[styles.indicator, isActive && { backgroundColor: colors.accentPrimary }]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 62,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tab: {
    justifyContent: 'center',
    marginRight: 20,
    minHeight: 58,
    paddingTop: 14,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  indicator: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderRadius: 999,
    height: 3,
    marginTop: 8,
    width: 31,
  },
});
