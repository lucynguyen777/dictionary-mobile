import * as Speech from 'expo-speech';
import { useMemo, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';

import type { VoiceProfile } from '@/components/reader/readerOptions';

type Options = {
  // Called when a sentence starts, e.g. to scroll it into view.
  onSentenceStart: (index: number) => void;
  sentences: string[];
  speed: number;
  voice: VoiceProfile;
};

// Reader read-aloud with the device's text-to-speech: sentence by sentence, with play/pause, stop,
// previous/next sentence and an audio scrubber.
export function useReaderSpeech({ onSentenceStart, sentences, speed, voice }: Options) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [audioScrubberWidth, setAudioScrubberWidth] = useState(0);

  const startSpeaking = (index: number, speed: number, voiceType: VoiceProfile) => {
    if (index < 0 || index >= sentences.length) {
      setIsSpeaking(false);
      return;
    }

    Speech.stop();
    setActiveSentenceIndex(index);
    onSentenceStart(index);

    const textToRead = sentences[index];

    // Compute voice variables
    let pitch = 1.0;
    let rate = speed;

    if (voiceType === 'female') {
      pitch = 1.15;
    } else if (voiceType === 'male') {
      pitch = 0.85;
    } else if (voiceType === 'child') {
      pitch = 1.45;
    } else if (voiceType === 'old') {
      pitch = 0.7;
      rate = speed * 0.8; // Old voices read slightly slower
    }

    const isVi = /[À-ÿ]/.test(textToRead);
    const language = isVi ? 'vi-VN' : 'en-US';

    setIsSpeaking(true);
    Speech.speak(textToRead, {
      language,
      pitch,
      rate,
      onDone: () => {
        if (index + 1 < sentences.length) {
          startSpeaking(index + 1, speed, voiceType);
        } else {
          setIsSpeaking(false);
          setActiveSentenceIndex(null);
        }
      },
      onStopped: () => {
        setIsSpeaking(false);
      },
      onError: () => {
        setIsSpeaking(false);
      },
    });
  };

  const handlePlayPause = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      const startIndex = activeSentenceIndex ?? 0;
      startSpeaking(startIndex, speed, voice);
    }
  };

  const handleStop = () => {
    Speech.stop();
    setIsSpeaking(false);
    setActiveSentenceIndex(null);
  };

  const handleNextSentence = () => {
    const nextIdx = (activeSentenceIndex ?? -1) + 1;
    if (nextIdx < sentences.length) {
      startSpeaking(nextIdx, speed, voice);
    }
  };

  const handlePrevSentence = () => {
    const prevIdx = (activeSentenceIndex ?? 0) - 1;
    if (prevIdx >= 0) {
      startSpeaking(prevIdx, speed, voice);
    }
  };

  const audioProgress = useMemo(() => {
    if (!sentences.length) return 0;
    return Math.min(100, Math.max(0, (((activeSentenceIndex ?? 0) + 1) / sentences.length) * 100));
  }, [activeSentenceIndex, sentences.length]);

  const handleAudioScrubberTouch = (event: GestureResponderEvent) => {
    if (!sentences.length || audioScrubberWidth <= 0) return;
    const pct = Math.min(100, Math.max(0, (event.nativeEvent.locationX / audioScrubberWidth) * 100));
    const index = Math.min(sentences.length - 1, Math.max(0, Math.floor((pct / 100) * sentences.length)));
    startSpeaking(index, speed, voice);
  };

  const stop = () => {
    Speech.stop();
    setIsSpeaking(false);
    setActiveSentenceIndex(null);
  };

  return {
    activeSentenceIndex,
    audioProgress,
    handleAudioScrubberTouch,
    handleNextSentence,
    handlePlayPause,
    handlePrevSentence,
    handleStop,
    isSpeaking,
    setAudioScrubberWidth,
    stop,
  };
}
