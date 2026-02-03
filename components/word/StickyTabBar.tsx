import { useEffect, useRef } from "react";
import {
    Dimensions,
    LayoutChangeEvent,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  tabs: string[];
  activeIndex: number;
  onTabPress: (index: number) => void;
};

type TabLayout = {
  x: number;
  width: number;
};

export default function StickyTabBar({
  tabs,
  activeIndex,
  onTabPress,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<TabLayout[]>([]);

  useEffect(() => {
    const layout = tabLayouts.current[activeIndex];
    if (!layout || !scrollRef.current) return;

    const scrollX =
      layout.x + layout.width / 2 - SCREEN_WIDTH / 2;

    scrollRef.current.scrollTo({
      x: Math.max(0, scrollX),
      animated: true,
    });
  }, [activeIndex]);

  return (
    <View
      style={{
        height: 48,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        backgroundColor: "#fff",
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: "center",
          paddingHorizontal: 16,
        }}
      >
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
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                marginRight: 8,
                borderBottomWidth: 2,
                borderBottomColor: isActive ? "#000" : "transparent",
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? "600" : "400",
                  color: isActive ? "#000" : "#666",
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}