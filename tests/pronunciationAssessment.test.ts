import { execFileSync } from 'node:child_process';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFfmpegTranscoder, mapAzureResponse, validatePronunciationRequest } from '../backend/pronunciationAssessment';
import { createServer } from '../backend/server';

let server: Server | null = null;

afterEach(async () => {
  if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
  server = null;
});

const AZURE_OK = {
  NBest: [{
    Display: 'Hello.',
    PronunciationAssessment: { AccuracyScore: 91.4, CompletenessScore: 100, FluencyScore: 88, PronScore: 90.6 },
    Words: [{
      PronunciationAssessment: { AccuracyScore: 91.4, ErrorType: 'None' },
      Phonemes: [{ Phoneme: 'h', PronunciationAssessment: { AccuracyScore: 100 } }, { Phoneme: 'ə', PronunciationAssessment: { AccuracyScore: 62 } }],
      Word: 'hello',
    }],
  }],
  RecognitionStatus: 'Success',
};

function fakeAzure(body: unknown = AZURE_OK, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, status }));
}

async function start(env: Record<string, string>, azureFetch = fakeAzure()) {
  const transcode = vi.fn(async (audio: Buffer) => Buffer.concat([Buffer.from('WAV'), audio]));
  const { app } = createServer({
    env,
    pronunciation: { fetch: azureFetch as unknown as typeof fetch, transcode },
    verifyAuth: async (token) => (token === 'valid' ? { userId: 'user-a' } : null),
  });
  const baseUrl = await new Promise<string>((resolve) => {
    server = app.listen(0, () => resolve(`http://localhost:${(server?.address() as AddressInfo).port}`));
  });
  return { baseUrl, transcode };
}

const AZURE_ENV = { AZURE_SPEECH_KEY: 'azure-secret', AZURE_SPEECH_REGION: 'southeastasia' };

const assess = (baseUrl: string, { language = 'en', text = 'hello', type = 'audio/mp4', body = Buffer.from('audio-bytes') } = {}) =>
  fetch(`${baseUrl}/proxy/pronunciation/assess?language=${language}&text=${encodeURIComponent(text)}`, {
    body: new Uint8Array(body),
    headers: { Authorization: 'Bearer valid', 'Content-Type': type },
    method: 'POST',
  });

describe('pronunciation assessment (D6)', () => {
  it('reports unconfigured without Azure credentials and never calls Azure', async () => {
    const azure = fakeAzure();
    const { baseUrl } = await start({}, azure);
    const response = await assess(baseUrl);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: 'pronunciation_unconfigured' } });
    expect(azure).not.toHaveBeenCalled();
  });

  it('requires sign-in', async () => {
    const { baseUrl } = await start(AZURE_ENV);
    const response = await fetch(`${baseUrl}/proxy/pronunciation/assess?language=en&text=hi`, { body: 'x', headers: { 'Content-Type': 'audio/mp4' }, method: 'POST' });
    expect(response.status).toBe(401);
  });

  it('transcodes, sends the audio to Azure with the reference text, and returns provider scores only', async () => {
    const azure = fakeAzure();
    const { baseUrl, transcode } = await start(AZURE_ENV, azure);
    const response = await assess(baseUrl);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      accuracyScore: 91,
      completenessScore: 100,
      fluencyScore: 88,
      locale: 'en-US',
      overallScore: 91,
      phonemes: [{ phoneme: 'h', score: 100 }, { phoneme: 'ə', score: 62 }],
      recognizedText: 'Hello.',
      words: [{ accuracy: 91, text: 'hello' }],
    });
    expect(transcode).toHaveBeenCalledTimes(1);
    const [url, init] = azure.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe('https://southeastasia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed');
    expect(init.headers['Ocp-Apim-Subscription-Key']).toBe('azure-secret');
    expect(JSON.parse(Buffer.from(init.headers['Pronunciation-Assessment'], 'base64').toString())).toMatchObject({ ReferenceText: 'hello' });
  });

  it('rejects unsupported languages, audio types and oversized audio before calling Azure', async () => {
    const azure = fakeAzure();
    const { baseUrl } = await start(AZURE_ENV, azure);
    expect(await (await assess(baseUrl, { language: 'eu' })).json()).toEqual({ error: { code: 'language_unsupported' } });
    expect((await assess(baseUrl, { type: 'video/mp4' })).status).not.toBe(200);
    expect((await assess(baseUrl, { body: Buffer.alloc(1024 * 1024 + 1) })).status).toBe(413);
    expect(azure).not.toHaveBeenCalled();
  });

  it('allows 20 scores per user per day by default', async () => {
    const azure = fakeAzure();
    const { baseUrl } = await start(AZURE_ENV, azure);
    for (let attempt = 0; attempt < 20; attempt += 1) expect((await assess(baseUrl)).status).toBe(200);
    const blocked = await assess(baseUrl);
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).error.code).toBe('quota_exceeded');
    expect(azure).toHaveBeenCalledTimes(20);
  });

  it('maps Azure failures without leaking provider details', async () => {
    const { baseUrl } = await start(AZURE_ENV, fakeAzure({ message: 'internal azure detail' }, 500));
    const failed = await assess(baseUrl);
    expect(failed.status).toBe(502);
    expect(await failed.json()).toEqual({ error: { code: 'pronunciation_failed' } });
  });

  it('reports silence as no speech', async () => {
    const { baseUrl } = await start(AZURE_ENV, fakeAzure({ RecognitionStatus: 'NoMatch' }));
    const response = await assess(baseUrl);
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: { code: 'pronunciation_no_speech' } });
  });

  it('validates the reference text', () => {
    const base = { body: Buffer.from('a'), contentType: 'audio/wav', language: 'fr' };
    expect(validatePronunciationRequest({ ...base, referenceText: '  ' })).toEqual({ code: 'reference_text_invalid', ok: false });
    expect(validatePronunciationRequest({ ...base, referenceText: 'x'.repeat(201) })).toEqual({ code: 'reference_text_invalid', ok: false });
    expect(validatePronunciationRequest({ ...base, referenceText: 'bonjour' })).toMatchObject({ data: { locale: 'fr-FR' }, ok: true });
  });

  it('keeps phonemes empty when Azure returns none', () => {
    const result = mapAzureResponse('vi-VN', { NBest: [{ PronunciationAssessment: { AccuracyScore: 80 }, Words: [{ Word: 'xin' }] }], RecognitionStatus: 'Success' });
    expect(result?.phonemes).toEqual([]);
    expect(result?.overallScore).toBe(80);
  });
});

const systemFfmpeg = (() => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {
    return null;
  }
})();

describe.skipIf(!systemFfmpeg)('ffmpeg transcoder', () => {
  it('converts a recording to 16 kHz mono PCM WAV in memory', async () => {
    const input = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', '-ar', '48000', '-ac', '2', '-f', 'webm', '-c:a', 'libopus', 'pipe:1']);
    const wav = await createFfmpegTranscoder(systemFfmpeg)(input);
    expect(wav.subarray(0, 4).toString()).toBe('RIFF');
    expect(wav.readUInt16LE(22)).toBe(1); // channels
    expect(wav.readUInt32LE(24)).toBe(16000); // sample rate
  });

  it('fails cleanly on data that is not audio', async () => {
    await expect(createFfmpegTranscoder(systemFfmpeg)(Buffer.from('not audio'))).rejects.toThrow('transcode_failed');
  });

  it('fails cleanly without a binary', async () => {
    await expect(createFfmpegTranscoder(null)(Buffer.from('x'))).rejects.toThrow('transcoder_unavailable');
  });
});
