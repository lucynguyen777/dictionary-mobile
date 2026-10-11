// expo-speech-recognition behind the SpeechEngine interface. The native module is loaded lazily:
// in Expo Go (no native module) or on unsupported runtimes it reports itself unavailable.
import type { SpeechEngine } from './voiceSearch';

type SpeechModule = {
  abort: () => void;
  addListener: (event: string, listener: (payload: any) => void) => { remove: () => void };
  isRecognitionAvailable: () => boolean;
  requestPermissionsAsync: () => Promise<{ canAskAgain?: boolean; granted: boolean }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
};

function loadSpeechModule(): SpeechModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-speech-recognition').ExpoSpeechRecognitionModule as SpeechModule;
  } catch {
    return null;
  }
}

export function createExpoSpeechEngine(): SpeechEngine | null {
  const speech = loadSpeechModule();
  if (!speech) return null;

  return {
    abort: () => speech.abort(),
    isAvailable: () => {
      try {
        return speech.isRecognitionAvailable();
      } catch {
        return false;
      }
    },
    requestPermission: () => speech.requestPermissionsAsync(),
    start: ({ interimResults, lang, requiresOnDeviceRecognition }) =>
      speech.start({ continuous: false, interimResults, lang, maxAlternatives: 1, requiresOnDeviceRecognition }),
    stop: () => speech.stop(),
    subscribe: ({ onEnd, onError, onResult }) => {
      const subscriptions = [
        speech.addListener('result', (event: { isFinal: boolean; results: { transcript: string }[] }) =>
          onResult({ isFinal: event.isFinal, transcript: event.results[0]?.transcript ?? '' })),
        speech.addListener('error', (event: { error: Parameters<typeof onError>[0]['error']; message?: string }) =>
          onError({ error: event.error, message: event.message })),
        speech.addListener('end', () => onEnd()),
      ];
      return () => subscriptions.forEach((subscription) => subscription.remove());
    },
  };
}
