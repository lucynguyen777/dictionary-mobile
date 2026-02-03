import { RefObject } from "react";
import { Dimensions, ScrollView, Text, View } from "react-native";

const { width } = Dimensions.get("window");

type Props = {
  tabs: string[];
  scrollRef: RefObject<ScrollView | null>;
  onIndexChange: (index: number) => void;
};

export default function TabPager({
  tabs,
  scrollRef,
  onIndexChange,
}: Props) {
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={(e) => {
        const index = Math.round(
          e.nativeEvent.contentOffset.x / width
        );
        onIndexChange(index);
      }}
    >
      {tabs.map((tab) => (
        <View
          key={tab}
          style={{
            width,
            paddingVertical: 16,
          }}
        >
          {/* padding nội dung bên trong để KHÔNG lệch tab */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "600" }}>
              {tab}
            </Text>
            <Text style={{ marginTop: 8, color: "#666" }}>
              Nội dung của {tab} sẽ nằm ở đây
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}