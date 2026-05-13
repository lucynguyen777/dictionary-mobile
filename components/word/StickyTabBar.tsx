import { useEffect, useRef } from 'react';
import { Dimensions, LayoutChangeEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    <View style={styles.container}>
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
              <Text numberOfLines={1} style={[styles.tabText, isActive && styles.activeText]}>
                {tab}
              </Text>
              <View style={[styles.indicator, isActive && styles.activeIndicator]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    height: 42,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tab: {
    marginRight: 20,
    paddingTop: 9,
  },
  tabText: {
    color: '#969696',
    fontSize: 14,
    fontWeight: '700',
  },
  activeText: {
    color: '#111111',
  },
  indicator: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    height: 2,
    marginTop: 4,
    width: 25,
  },
  activeIndicator: {
    backgroundColor: '#111111',
  },
});
