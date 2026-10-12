import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import Touchable from '@/components/app/Touchable';
import type { ReaderThemeColors } from '@/components/reader/readerOptions';
import { styles } from '@/components/reader/styles';
import type { useReaderSpeech } from '@/components/reader/useReaderSpeech';

type Props = {
  sentenceCount: number;
  speech: ReturnType<typeof useReaderSpeech>;
  theme: ReaderThemeColors;
};

// Read-aloud controls above the Reader dock: previous/next sentence, scrubber and play/pause.
export function ReaderAudioPanel({ sentenceCount, speech, theme }: Props) {
  const {
    activeSentenceIndex,
    audioProgress,
    handleAudioScrubberTouch,
    handleNextSentence,
    handlePlayPause,
    handlePrevSentence,
    isSpeaking,
    setAudioScrubberWidth,
  } = speech;

  return (
    <View style={[styles.audioProgressPanel, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <Touchable accessibilityLabel="Câu trước" accessibilityRole="button" activeOpacity={0.82} onPress={handlePrevSentence} style={styles.audioSeekButton}>
        <Ionicons name="play-skip-back" size={18} color={theme.accent} />
      </Touchable>
      <View
        accessible
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        accessibilityLabel="Vị trí đọc to"
        accessibilityRole="adjustable"
        aria-valuemax={sentenceCount}
        aria-valuemin={1}
        aria-valuenow={(activeSentenceIndex ?? 0) + 1}
        aria-valuetext={`Câu ${(activeSentenceIndex ?? 0) + 1}/${sentenceCount}`}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') handleNextSentence();
          else handlePrevSentence();
        }}
        style={styles.audioScrubberTouchArea}
        onLayout={(e) => setAudioScrubberWidth(e.nativeEvent.layout.width)}
        onTouchMove={handleAudioScrubberTouch}
        onTouchStart={handleAudioScrubberTouch}>
        <View style={[styles.audioScrubberTrack, { backgroundColor: theme.border }]}>
          <View style={[styles.audioScrubberProgress, { backgroundColor: theme.accent, width: `${audioProgress}%` }]} />
        </View>
      </View>
      <Text style={[styles.audioProgressText, { color: theme.secondaryText }]}>
        {sentenceCount ? `${Math.min(sentenceCount, (activeSentenceIndex ?? 0) + 1)}/${sentenceCount}` : '0/0'}
      </Text>
      <Touchable accessibilityLabel={isSpeaking ? 'Tạm dừng đọc to' : 'Đọc to'} accessibilityRole="button" activeOpacity={0.82} onPress={handlePlayPause} style={styles.audioSeekButton}>
        <Ionicons name={isSpeaking ? 'pause' : 'play'} size={18} color={theme.accent} />
      </Touchable>
      <Touchable accessibilityLabel="Câu sau" accessibilityRole="button" activeOpacity={0.82} onPress={handleNextSentence} style={styles.audioSeekButton}>
        <Ionicons name="play-skip-forward" size={18} color={theme.accent} />
      </Touchable>
    </View>
  );
}
