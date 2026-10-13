// Voice search session: permission → listen → transcript → lookup candidates. The speech engine is
// an interface (data/voiceSearchEngine.ts wraps expo-speech-recognition), so every fallback path
// is testable without a device.
import { splitRecognitionSuggestions } from './recognition';

export type SpeechErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'interrupted'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'busy'
  | 'client'
  | 'speech-timeout'
  | 'unknown';

export type SpeechEngine = {
  isAvailable: () => boolean;
  requestPermission: () => Promise<{ canAskAgain?: boolean; granted: boolean }>;
  start: (options: { interimResults: boolean; lang: string; requiresOnDeviceRecognition: boolean }) => void;
  stop: () => void;
  abort: () => void;
  subscribe: (handlers: {
    onEnd: () => void;
    onError: (event: { error: SpeechErrorCode; message?: string }) => void;
    onResult: (event: { isFinal: boolean; transcript: string }) => void;
  }) => () => void;
};

export type VoiceSearchStatus = 'idle' | 'unavailable' | 'requesting-permission' | 'permission-denied' | 'listening' | 'done' | 'error';

export type VoiceSearchState = {
  candidates: string[];
  errorMessage?: string;
  status: VoiceSearchStatus;
  transcript: string;
};

const SPEECH_LOCALES: Record<string, string> = {
  ar: 'ar-SA', de: 'de-DE', en: 'en-US', es: 'es-ES', fr: 'fr-FR', he: 'he-IL', hi: 'hi-IN', id: 'id-ID',
  it: 'it-IT', ja: 'ja-JP', ko: 'ko-KR', ms: 'ms-MY', pt: 'pt-BR', ru: 'ru-RU', th: 'th-TH', tr: 'tr-TR',
  vi: 'vi-VN', zh: 'zh-CN',
};

export function speechLocaleForLanguage(languageCode: string) {
  return SPEECH_LOCALES[languageCode] ?? languageCode;
}

export function describeSpeechError(code: SpeechErrorCode, isOnline: boolean) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Ứng dụng chưa được cấp quyền micro hoặc nhận dạng giọng nói. Bật quyền trong Cài đặt rồi thử lại.';
    case 'no-speech':
    case 'speech-timeout':
      return 'Không nghe thấy giọng nói. Hãy nói gần micro hơn và thử lại.';
    case 'network':
      return isOnline
        ? 'Dịch vụ nhận dạng giọng nói không phản hồi. Thử lại sau.'
        : 'Đang offline và thiết bị chưa có gói nhận dạng giọng nói cho ngôn ngữ này. Kết nối mạng rồi thử lại.';
    case 'language-not-supported':
      return isOnline
        ? 'Thiết bị chưa hỗ trợ nhận dạng giọng nói cho ngôn ngữ này.'
        : 'Đang offline: thiết bị chưa có gói nhận dạng giọng nói cho ngôn ngữ này.';
    case 'audio-capture':
      return 'Không mở được micro. Kiểm tra ứng dụng khác có đang dùng micro không.';
    case 'busy':
      return 'Bộ nhận dạng giọng nói đang bận. Thử lại sau giây lát.';
    default:
      return 'Không nhận dạng được giọng nói. Thử lại.';
  }
}

export function createVoiceSearchSession(
  engine: SpeechEngine | null,
  {
    isOnline = () => true,
    languageCode,
    onChange,
  }: { isOnline?: () => boolean; languageCode: string; onChange: (state: VoiceSearchState) => void }
) {
  let state: VoiceSearchState = { candidates: [], status: 'idle', transcript: '' };
  let unsubscribe: (() => void) | null = null;
  let finished = false;

  const set = (next: Partial<VoiceSearchState>) => {
    state = { ...state, ...next };
    onChange(state);
  };
  const cleanup = () => {
    unsubscribe?.();
    unsubscribe = null;
  };
  const finish = (next: Partial<VoiceSearchState>) => {
    if (finished) return;
    finished = true;
    cleanup();
    set(next);
  };

  return {
    getState: () => state,

    async start() {
      finished = false;
      if (!engine || !engine.isAvailable()) {
        finish({ errorMessage: 'Thiết bị hoặc bản cài đặt này chưa hỗ trợ tìm bằng giọng nói.', status: 'unavailable' });
        return;
      }
      set({ candidates: [], errorMessage: undefined, status: 'requesting-permission', transcript: '' });
      const permission = await engine.requestPermission().catch(() => ({ canAskAgain: false, granted: false }));
      if (!permission.granted) {
        finish({
          errorMessage: permission.canAskAgain === false
            ? 'Quyền micro đã bị tắt. Bật lại trong Cài đặt của thiết bị để tìm bằng giọng nói.'
            : 'Cần quyền micro để tìm bằng giọng nói.',
          status: 'permission-denied',
        });
        return;
      }

      const online = isOnline();
      unsubscribe = engine.subscribe({
        onEnd: () => {
          if (finished) return;
          const candidates = splitRecognitionSuggestions(state.transcript);
          finish(candidates.length
            ? { candidates, status: 'done' }
            : { errorMessage: describeSpeechError('no-speech', online), status: 'error' });
        },
        onError: ({ error }) => {
          if (error === 'aborted') {
            finish({ status: 'idle' });
            return;
          }
          finish({ errorMessage: describeSpeechError(error, online), status: 'error' });
        },
        onResult: ({ isFinal, transcript }) => {
          if (finished) return;
          set({ transcript });
          if (isFinal) {
            const candidates = splitRecognitionSuggestions(transcript);
            if (candidates.length) finish({ candidates, status: 'done', transcript });
          }
        },
      });
      set({ status: 'listening' });
      try {
        // Offline, ask for on-device recognition so a downloaded language model is used when present.
        engine.start({ interimResults: true, lang: speechLocaleForLanguage(languageCode), requiresOnDeviceRecognition: !online });
      } catch {
        finish({ errorMessage: describeSpeechError('client', online), status: 'error' });
      }
    },

    stop() {
      if (state.status === 'listening') engine?.stop();
    },

    cancel() {
      if (state.status === 'listening') engine?.abort();
      finish({ status: 'idle' });
    },
  };
}
