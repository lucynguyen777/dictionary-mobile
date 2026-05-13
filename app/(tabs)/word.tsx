import { useRef, useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';

import StickyTabBar from '@/components/word/StickyTabBar';
import TabPager from '@/components/word/TabPager';
import WordHeader from '@/components/word/WordHeader';

const { width } = Dimensions.get('window');

const TABS = ['Meaning', 'Synonyms', 'Collocation & Idiom', 'Conjugation', 'Etymology', 'Pronunciation'];

export default function WordScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    scrollRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <WordHeader word="Word" ipa="/wɜːd/" audio="https://ssl.gstatic.com/dictionary/static/sounds/oxford/word--_gb_1.mp3" />
      <StickyTabBar tabs={TABS} activeIndex={activeIndex} onTabPress={handleTabPress} />
      <TabPager tabs={TABS} scrollRef={scrollRef} onIndexChange={setActiveIndex} />
    </View>
  );
}
