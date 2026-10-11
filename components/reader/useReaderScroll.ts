import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { GestureResponderEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

// Reader scroll position: progress scrubber, page up/down and auto-scroll (speed follows the
// read-aloud speed setting).
export function useReaderScroll(scrollViewRef: RefObject<ScrollView | null>, autoScrollSpeed: number) {
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [scrubberWidth, setScrubberWidth] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAutoScrolling) {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
      return;
    }

    autoScrollTimerRef.current = setInterval(() => {
      if (!scrollViewRef.current || contentHeight <= scrollViewHeight) return;

      setScrollOffset((currentOffset) => {
        const maxOffset = Math.max(0, contentHeight - scrollViewHeight);
        const nextOffset = Math.min(maxOffset, currentOffset + Math.max(2, autoScrollSpeed * 3));
        scrollViewRef.current?.scrollTo({ y: nextOffset, animated: false });
        if (nextOffset >= maxOffset) setIsAutoScrolling(false);
        return nextOffset;
      });
    }, 80);

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    };
  }, [autoScrollSpeed, contentHeight, isAutoScrolling, scrollViewHeight, scrollViewRef]);


  // ----------------------------------------------------
  // READING PROGRESS SCRUBBER LOGIC
  // ----------------------------------------------------
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollOffset(event.nativeEvent.contentOffset.y);
  };

  const progress = useMemo(() => {
    if (contentHeight <= scrollViewHeight) return 0;
    return Math.min(100, Math.max(0, (scrollOffset / (contentHeight - scrollViewHeight)) * 100));
  }, [scrollOffset, contentHeight, scrollViewHeight]);

  const handleProgressChange = (pct: number) => {
    if (scrollViewRef.current && contentHeight > scrollViewHeight) {
      const targetY = (pct / 100) * (contentHeight - scrollViewHeight);
      scrollViewRef.current.scrollTo({ y: targetY, animated: false });
    }
  };

  const handleScrubberTouch = (event: GestureResponderEvent) => {
    const touchX = event.nativeEvent.locationX;
    const pct = Math.min(100, Math.max(0, (touchX / scrubberWidth) * 100));
    handleProgressChange(pct);
  };

  const handleNextPage = () => {
    if (!scrollViewRef.current) return;
    setIsAutoScrolling(false);
    const nextOffset = Math.min(Math.max(0, contentHeight - scrollViewHeight), scrollOffset + scrollViewHeight * 0.82);
    scrollViewRef.current.scrollTo({ y: nextOffset, animated: true });
  };

  const handlePrevPage = () => {
    if (!scrollViewRef.current) return;
    setIsAutoScrolling(false);
    const prevOffset = Math.max(0, scrollOffset - scrollViewHeight * 0.82);
    scrollViewRef.current.scrollTo({ y: prevOffset, animated: true });
  };

  const handleAutoScrollToggle = () => {
    if (contentHeight <= scrollViewHeight) return;
    setIsAutoScrolling((value) => !value);
  };

  return {
    contentHeight,
    handleAutoScrollToggle,
    handleNextPage,
    handlePrevPage,
    handleProgressChange,
    handleScroll,
    handleScrubberTouch,
    isAutoScrolling,
    progress,
    scrollViewHeight,
    setContentHeight,
    setIsAutoScrolling,
    setScrollViewHeight,
    setScrubberWidth,
  };
}
