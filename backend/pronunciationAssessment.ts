import { spawn } from 'node:child_process';

// Pronunciation scoring through Azure AI Speech Pronunciation Assessment (plan 4.6).
// Owner decision D6 (2026-10-13): raw audio is never stored. It is transcoded in memory, streamed
// to Azure, and dropped when the request ends; only the scores go back to the app. Each user may
// score 20 recordings a day (PROXY_DAILY_PRONUNCIATION_LIMIT_PER_USER).

export const MAX_AUDIO_BYTES = 1024 * 1024;
export const MAX_AUDIO_SECONDS = 30;
const MAX_REFERENCE_CHARS = 200;
const AZURE_TIMEOUT_MS = 30_000;

// App language code -> Azure locale with pronunciation assessment support.
export const PRONUNCIATION_LOCALES: Record<string, string> = {
  ar: 'ar-SA',
  ca: 'ca-ES',
  da: 'da-DK',
  de: 'de-DE',
  en: 'en-US',
  es: 'es-ES',
  fi: 'fi-FI',
  fr: 'fr-FR',
  hi: 'hi-IN',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ms: 'ms-MY',
  nb: 'nb-NO',
  nl: 'nl-NL',
  pl: 'pl-PL',
  pt: 'pt-BR',
  ru: 'ru-RU',
  sv: 'sv-SE',
  th: 'th-TH',
  vi: 'vi-VN',
  zh: 'zh-CN',
};

const ACCEPTED_AUDIO_TYPES = ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/3gpp'];

export type PronunciationConfig =
  | { status: 'configured'; key: string; region: string }
  | { missingKeys: string[]; status: 'unconfigured' };

export function readPronunciationConfig(env: Record<string, string | undefined>): PronunciationConfig {
  const key = env.AZURE_SPEECH_KEY?.trim();
  const region = env.AZURE_SPEECH_REGION?.trim();
  if (key && region && /^[a-z0-9]+$/.test(region)) return { key, region, status: 'configured' };
  return {
    missingKeys: [!key && 'AZURE_SPEECH_KEY', !(region && /^[a-z0-9]+$/.test(region)) && 'AZURE_SPEECH_REGION'].filter(Boolean) as string[],
    status: 'unconfigured',
  };
}

export type PronunciationRequest = { audio: Buffer; contentType: string; locale: string; referenceText: string };

export function validatePronunciationRequest(input: {
  body: unknown;
  contentType: string | undefined;
  language: unknown;
  referenceText: unknown;
}): { ok: true; data: PronunciationRequest } | { ok: false; code: string } {
  const contentType = (input.contentType ?? '').split(';')[0].trim().toLowerCase();
  if (!ACCEPTED_AUDIO_TYPES.includes(contentType)) return { code: 'audio_type_unsupported', ok: false };
  if (!Buffer.isBuffer(input.body) || input.body.length === 0) return { code: 'audio_missing', ok: false };
  if (input.body.length > MAX_AUDIO_BYTES) return { code: 'audio_too_large', ok: false };
  const locale = typeof input.language === 'string' ? PRONUNCIATION_LOCALES[input.language.trim().toLowerCase()] : undefined;
  if (!locale) return { code: 'language_unsupported', ok: false };
  const referenceText = typeof input.referenceText === 'string' ? input.referenceText.normalize('NFC').trim() : '';
  if (!referenceText || [...referenceText].length > MAX_REFERENCE_CHARS) return { code: 'reference_text_invalid', ok: false };
  return { data: { audio: input.body, contentType, locale, referenceText }, ok: true };
}

export type Transcoder = (audio: Buffer) => Promise<Buffer>;

// Converts whatever the device recorded (m4a on iOS/Android, webm on the web) to the 16 kHz mono
// PCM WAV that Azure's short-audio endpoint expects. Runs in memory: nothing is written to disk.
export function createFfmpegTranscoder(ffmpegPath: string | null | undefined): Transcoder {
  return (audio) =>
    new Promise((resolve, reject) => {
      if (!ffmpegPath) {
        reject(new Error('transcoder_unavailable'));
        return;
      }
      const child = spawn(ffmpegPath, [
        '-hide_banner', '-loglevel', 'error', '-i', 'pipe:0',
        '-t', String(MAX_AUDIO_SECONDS), '-ac', '1', '-ar', '16000', '-acodec', 'pcm_s16le', '-f', 'wav', 'pipe:1',
      ]);
      const chunks: Buffer[] = [];
      const timer = setTimeout(() => child.kill('SIGKILL'), 15_000);
      child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
      child.stdin.on('error', () => undefined);
      child.on('error', () => {
        clearTimeout(timer);
        reject(new Error('transcode_failed'));
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0 && chunks.length) resolve(Buffer.concat(chunks));
        else reject(new Error('transcode_failed'));
      });
      child.stdin.end(audio);
    });
}

export type PronunciationScore = { accuracy: number; error?: string; text: string };

export type PronunciationResult = {
  accuracyScore: number;
  completenessScore: number;
  fluencyScore: number;
  locale: string;
  overallScore: number;
  phonemes: { phoneme: string; score: number }[];
  recognizedText: string;
  words: PronunciationScore[];
};

type AzureAssessment = { AccuracyScore?: number; CompletenessScore?: number; ErrorType?: string; FluencyScore?: number; PronScore?: number };
type AzureResponse = {
  NBest?: {
    Display?: string;
    PronunciationAssessment?: AzureAssessment;
    Words?: { Word?: string; PronunciationAssessment?: AzureAssessment; Phonemes?: { Phoneme?: string; PronunciationAssessment?: AzureAssessment }[] }[];
  }[];
  RecognitionStatus?: string;
};

const score = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0);

// Only provider output is returned: no local heuristics, and phonemes are empty when Azure gives none.
export function mapAzureResponse(locale: string, response: AzureResponse): PronunciationResult | null {
  if (response.RecognitionStatus !== 'Success') return null;
  const best = response.NBest?.[0];
  const assessment = best?.PronunciationAssessment;
  if (!best || !assessment) return null;
  const words = (best.Words ?? []).map((word) => ({
    accuracy: score(word.PronunciationAssessment?.AccuracyScore),
    error: word.PronunciationAssessment?.ErrorType && word.PronunciationAssessment.ErrorType !== 'None' ? word.PronunciationAssessment.ErrorType : undefined,
    text: word.Word ?? '',
  }));
  const phonemes = (best.Words ?? []).flatMap((word) =>
    (word.Phonemes ?? []).filter((p) => p.Phoneme).map((p) => ({ phoneme: p.Phoneme as string, score: score(p.PronunciationAssessment?.AccuracyScore) }))
  );
  return {
    accuracyScore: score(assessment.AccuracyScore),
    completenessScore: score(assessment.CompletenessScore),
    fluencyScore: score(assessment.FluencyScore),
    locale,
    overallScore: score(assessment.PronScore ?? assessment.AccuracyScore),
    phonemes,
    recognizedText: best.Display ?? '',
    words,
  };
}

export async function assessPronunciation(
  config: Extract<PronunciationConfig, { status: 'configured' }>,
  request: PronunciationRequest,
  deps: { fetch: typeof fetch; transcode: Transcoder }
): Promise<PronunciationResult> {
  const wav = await deps.transcode(request.audio);
  const assessmentHeader = Buffer.from(JSON.stringify({
    Dimension: 'Comprehensive',
    EnableMiscue: true,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    PhonemeAlphabet: 'IPA',
    ReferenceText: request.referenceText,
  })).toString('base64');
  const url = `https://${config.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(request.locale)}&format=detailed`;
  const response = await deps.fetch(url, {
    body: new Uint8Array(wav),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      'Ocp-Apim-Subscription-Key': config.key,
      'Pronunciation-Assessment': assessmentHeader,
    },
    method: 'POST',
    signal: AbortSignal.timeout(AZURE_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('pronunciation_provider_failed');
  const result = mapAzureResponse(request.locale, (await response.json()) as AzureResponse);
  if (!result) throw new Error('pronunciation_no_speech');
  return result;
}
