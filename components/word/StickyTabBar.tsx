import { useEffect, useRef } from 'react';
import { Dimensions, LayoutChangeEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useToken } from '@/hooks/use-token';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<TabLayout[]>([]);

  useEffect(() => {
    const layout = tabLayouts.current[activeIndex];
    if (!layout || !scrollRef.current) return;

    scrollRef.current.scrollTo({
      x: Math.max(0, layout.x + layout.width / 2 - SCREEN_WIDTH / 2),
      animated: true,
    });
  }, [activeIndex]);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvasAlt }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;

          return (
            <TouchableOpacity
              key={tab}
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
