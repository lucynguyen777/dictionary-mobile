import Ionicons from '@expo/vector-icons/Ionicons';
import { RefObject, useMemo, useRef, useState } from 'react';
import { ScrollView, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { DictionaryEntry } from '@/data/dictionary';
import { ApiBilingualMeaningResult, ApiMeaningResult, ApiRelatedWords } from '@/data/dictionaryApi';
import { useToken } from '@/hooks/use-token';

import { MeaningTab } from '@/components/word/tabs/MeaningTab';
import { TabPagerTokenContext, createTabPagerStyles } from '@/components/word/tabs/tabPagerStyles';
import { CollocationTab, ConjugationTab, EtymologyTab, SynonymsTab } from '@/components/word/tabs/RelationTabs';
import { PronunciationTab } from '@/components/word/tabs/PronunciationTab';

export type Props = {
  apiBilingualMeaning: ApiBilingualMeaningResult | null;
  apiMeaning: ApiMeaningResult | null;
  apiRelatedWords: ApiRelatedWords | null;
  bilingualLookupError: string;
  entry: DictionaryEntry;
  lookupError: string;
  lookupStatus: 'idle' | 'loading' | 'ready' | 'error';
  sourceLang: string;
  tabs: string[];
  targetLang: string;
  scrollRef: RefObject<ScrollView | null>;
  onIndexChange: (index: number) => void;
};

export default function TabPager({
  apiBilingualMeaning,
  apiMeaning,
  apiRelatedWords,
  bilingualLookupError,
  entry,
  lookupError,
  lookupStatus,
  sourceLang,
  tabs,
  targetLang,
  scrollRef,
  onIndexChange,
}: Props) {
  const token = useToken();
  const styles = useMemo(() => createTabPagerStyles(token), [token]);
  const { width } = useWindowDimensions();
  const activeIndexRef = useRef(0);
  const pageScrollRefs = useRef<(ScrollView | null)[]>([]);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const handleIndexChange = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, tabs.length - 1));
    if (activeIndexRef.current === nextIndex) return;

    activeIndexRef.current = nextIndex;
    setVisibleIndex(nextIndex);
    onIndexChange(nextIndex);
  };

  const handleScrollActivePageToTop = () => {
    pageScrollRefs.current[visibleIndex]?.scrollTo({ y: 0, animated: true });
  };

  const renderTab = (tab: string) => {
    switch (tab) {
      case 'Meaning':
        return (
          <MeaningTab
            apiMeaning={apiMeaning}
            apiBilingualMeaning={apiBilingualMeaning}
            bilingualLookupError={bilingualLookupError}
            entry={entry}
            lookupError={lookupError}
            lookupStatus={lookupStatus}
            sourceLang={sourceLang}
            targetLang={targetLang}
          />
        );
      case 'Synonyms':
        return (
          <SynonymsTab
            apiMeaning={apiMeaning}
            apiRelatedWords={apiRelatedWords}
            entry={entry}
            lookupError={lookupError}
            lookupStatus={lookupStatus}
            sourceLang={sourceLang}
            targetLang={targetLang}
          />
        );
      case 'Collocation & Idiom':
        return <CollocationTab entry={entry} sourceLang={sourceLang} targetLang={targetLang} />;
      case 'Conjugation':
        return <ConjugationTab entry={entry} />;
      case 'Etymology':
        return <EtymologyTab entry={entry} />;
      case 'Pronunciation':
        return <PronunciationTab entry={entry} />;
      default:
        return null;
    }
  };

  return (
    <TabPagerTokenContext.Provider value={token}>
    <View style={styles.pagerWrap}>
    <ScrollView
      ref={scrollRef}
      directionalLockEnabled
      horizontal
      keyboardShouldPersistTaps="handled"
      pagingEnabled
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      style={styles.pager}
      onScroll={(e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        handleIndexChange(index);
      }}
      onMomentumScrollEnd={(e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        handleIndexChange(index);
      }}>
      {tabs.map((tab, index) => (
        <View key={tab} style={[styles.page, { width }]}>
          <ScrollView
            ref={(node) => {
              pageScrollRefs.current[index] = node;
            }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
            style={styles.pageScroll}>
            {renderTab(tab)}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
    <TouchableOpacity
      accessibilityLabel="Lên đầu trang"
      activeOpacity={0.84}
      onPress={handleScrollActivePageToTop}
      style={styles.scrollTopButton}>
      <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
    </TouchableOpacity>
    </View>
    </TabPagerTokenContext.Provider>
  );
}
