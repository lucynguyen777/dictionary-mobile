import { useEffect, useMemo, useRef, useState } from 'react';
import type { GestureResponderEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

// Reader scroll position: progress scrubber, page up/down and auto-scroll (speed follows the
// read-aloud speed setting). `scrollToY` moves the list; it should be stable (useCallback).
export function useReaderScroll(scrollToY: (y: number, animated: boolean) => void, autoScrollSpeed: number) {
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
      if (contentHeight <= scrollViewHeight) return;

      setScrollOffset((currentOffset) => {
        const maxOffset = Math.max(0, contentHeight - scrollViewHeight);
        const nextOffset = Math.min(maxOffset, currentOffset + Math.max(2, autoScrollSpeed * 3));
        scrollToY(nextOffset, false);
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
  }, [autoScrollSpeed, contentHeight, isAutoScrolling, scrollToY, scrollViewHeight]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollOffset(event.nativeEvent.contentOffset.y);
  };

  const progress = useMemo(() => {
    if (contentHeight <= scrollViewHeight) return 0;
    return Math.min(100, Math.max(0, (scrollOffset / (contentHeight - scrollViewHeight)) * 100));
  }, [scrollOffset, contentHeight, scrollViewHeight]);

  const handleProgressChange = (pct: number) => {
    if (contentHeight > scrollViewHeight) scrollToY((pct / 100) * (contentHeight - scrollViewHeight), false);
  };

  const handleScrubberTouch = (event: GestureResponderEvent) => {
    const touchX = event.nativeEvent.locationX;
    const pct = Math.min(100, Math.max(0, (touchX / scrubberWidth) * 100));
    handleProgressChange(pct);
  };

  const handleNextPage = () => {
    setIsAutoScrolling(false);
    scrollToY(Math.min(Math.max(0, contentHeight - scrollViewHeight), scrollOffset + scrollViewHeight * 0.82), true);
  };

  const handlePrevPage = () => {
    setIsAutoScrolling(false);
    scrollToY(Math.max(0, scrollOffset - scrollViewHeight * 0.82), true);
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
