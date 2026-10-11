/**
 * Backend Proxy Client — typed fetch wrapper for the Vercel `/backend-proxy` function.
 *
 * Web builds call the proxy on the same origin. Native builds have no origin, so they need
 * `EXPO_PUBLIC_BACKEND_PROXY_URL` (for example `https://dictionaire-mobile.vercel.app`).
 */

import { Platform } from 'react-native';
import { fetch as streamingFetch } from 'expo/fetch';

import type { FeedbackCategory } from './feedback';
import { fetchWithTimeout } from './http';
import { readSseStream } from './sseParser';
import { getSharedSupabaseAuthClient } from './supabaseAuthClient';

// AI replies can take a while; anything longer than this is treated as a stalled request.
const PROXY_FETCH_TIMEOUT_MS = 60_000;

export type AiChatGoal = 'conversation' | 'correction' | 'explanation' | 'roleplay';

export interface AiChatMessage {
  content: string;
  role: 'assistant' | 'user';
}

export interface AiChatRequest {
  goal: AiChatGoal;
  learningLanguage: string;
  messages: AiChatMessage[];
  nativeLanguage?: string;
  stream?: boolean;
}

export interface AiChatResponse {
  content: string;
  provider: 'openai';
  totalTokens: number;
}

export interface TranslateTextRequest {
  sourceText: string;
  targetLang: string;
  sourceLang?: string;
  glossaryId?: string;
  formality?: string;
}

export interface TranslateTextResponse {
  translatedText: string;
  detectedSourceLanguage: string;
  provider: 'deepl';
  providerRequestId: string | null;
  characterCount: number;
  glossaryApplied: boolean;
  warnings: string[];
}

// Mirrors `QuotaTracker.getState` in backend/quotaTracker.ts (UTC day and month windows).
export interface QuotaUsage {
  daily: number;
  dailyLimit: number;
  monthly: number;
  monthlyLimit: number;
}

export interface QuotaState {
  translation: QuotaUsage | null;
  aiChat: QuotaUsage | null;
}

export interface GoogleSheetsStatus {
  configured: boolean;
  connected: boolean;
  persistenceConfigured: boolean;
}

// --- URL resolution ---

export const BACKEND_PROXY_URL_ENV = 'EXPO_PUBLIC_BACKEND_PROXY_URL';

// Returns the origin to prefix `/backend-proxy` with: '' for same-origin web, or null when native has none.
export function resolveBackendProxyBaseUrl(platform: string, configuredUrl: string | undefined): string | null {
  if (platform === 'web') return '';
  const url = configuredUrl?.trim().replace(/\/+$/, '');
  if (!url) return null;
  return /^https:\/\//.test(url) || /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?$/.test(url) ? url : null;
}

// Expo inlines EXPO_PUBLIC_* only for direct property access, so read it literally.
const BASE = resolveBackendProxyBaseUrl(Platform.OS, process.env.EXPO_PUBLIC_BACKEND_PROXY_URL);
const PROXY_PREFIX = '/backend-proxy';

// --- Helpers ---

async function buildProxyRequest(path: string, options: RequestInit) {
  if (BASE === null) {
    throw new BackendProxyError(
      503,
      'Máy chủ dịch và AI chưa được cấu hình cho ứng dụng này.',
      'backend_proxy_unconfigured',
    );
  }
  const url = `${BASE}${PROXY_PREFIX}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const authResult = getSharedSupabaseAuthClient();
    if (authResult.status === 'configured') {
      const { data } = await authResult.client.auth.getSession();
      if (data.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    }
  } catch {
    // Signed-out requests still go out; the proxy answers 401 for routes that need a session.
  }

  return { headers, url };
}

async function toBackendProxyError(res: { json: () => Promise<unknown>; status: number; text: () => Promise<string> }) {
  let errorBody: unknown;
  try {
    errorBody = await res.json();
  } catch {
    errorBody = await res.text().catch(() => 'Unknown error');
  }
  return new BackendProxyError(
    res.status,
    (errorBody as { error?: { code?: string; message?: string } })?.error?.message ?? String(errorBody),
    (errorBody as { error?: { code?: string } })?.error?.code,
  );
}

async function proxyFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { headers, url } = await buildProxyRequest(path, options);
  const res = await fetchWithTimeout(url, {
    ...options,
    headers,
    timeoutMs: PROXY_FETCH_TIMEOUT_MS,
  });

  if (!res.ok) throw await toBackendProxyError(res);

  return res.json() as Promise<T>;
}

export class BackendProxyError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'BackendProxyError';
    this.status = status;
    this.code = code;
  }
}

// --- Translation API ---

export async function translateText(
  req: TranslateTextRequest,
): Promise<TranslateTextResponse> {
  return proxyFetch<TranslateTextResponse>('/proxy/translate/text', {
    body: JSON.stringify(req),
    method: 'POST',
  });
}

// --- AI Chat API ---

export async function aiChat(req: AiChatRequest): Promise<AiChatResponse> {
  return proxyFetch<AiChatResponse>('/proxy/ai/chat', {
    body: JSON.stringify({
      ...req,
      stream: req.stream ?? false,
    }),
    method: 'POST',
  });
}

export type AiChatStreamHandlers = {
  onDelta: (text: string) => void;
  signal?: AbortSignal;
};

// Streams an AI Tutor reply: `onDelta` receives text as it arrives and the promise resolves with the
// full reply. Uses expo/fetch because React Native's built-in fetch cannot read response bodies
// incrementally; on web it is the browser fetch. A proxy that answers with plain JSON still works.
export async function aiChatStream(req: AiChatRequest, { onDelta, signal }: AiChatStreamHandlers): Promise<AiChatResponse> {
  const { headers, url } = await buildProxyRequest('/proxy/ai/chat', {});
  const res = await streamingFetch(url, {
    body: JSON.stringify({ ...req, stream: true }),
    headers: { ...headers, Accept: 'text/event-stream' },
    method: 'POST',
    signal,
  });

  if (!res.ok) throw await toBackendProxyError(res);

  if (!res.headers.get('content-type')?.includes('text/event-stream') || !res.body) {
    const reply = await res.json() as AiChatResponse;
    if (reply.content) onDelta(reply.content);
    return reply;
  }

  let content = '';
  let finished: AiChatResponse | null = null;
  let streamError: BackendProxyError | null = null;
  await readSseStream(res.body, (data) => {
    if (finished || streamError) return;
    const event = JSON.parse(data) as {
      delta?: string;
      done?: boolean;
      error?: { code?: string; message?: string };
      provider?: 'openai';
      totalTokens?: number;
    };
    if (event.error) {
      streamError = new BackendProxyError(502, event.error.message ?? 'AI provider is unavailable.', event.error.code);
    } else if (event.done) {
      finished = { content, provider: event.provider ?? 'openai', totalTokens: event.totalTokens ?? 0 };
    } else if (event.delta) {
      content += event.delta;
      onDelta(event.delta);
    }
  });

  if (streamError) throw streamError;
  if (!finished) throw new BackendProxyError(502, 'Kết nối AI bị ngắt giữa chừng.', 'ai_stream_interrupted');
  return finished;
}

// --- Quota API ---

export async function getQuota(): Promise<QuotaState> {
  return proxyFetch<QuotaState>('/proxy/quota');
}

export async function connectGoogleSheets(): Promise<{ authorizationUrl: string }> {
  return proxyFetch<{ authorizationUrl: string }>('/proxy/google-sheets/connect?returnTo=/advanced');
}

export async function completeGoogleSheetsConnection(code: string, state: string) {
  return proxyFetch<{ connected: true }>('/proxy/google-sheets/complete', {
    body: JSON.stringify({ code, state }),
    method: 'POST',
  });
}

export async function getGoogleSheetsStatus(): Promise<GoogleSheetsStatus> {
  return proxyFetch<GoogleSheetsStatus>('/proxy/google-sheets/status');
}

export async function exportFolderToGoogleSheets(rows: string[][], title?: string) {
  return proxyFetch<{ spreadsheetUrl: string }>('/proxy/google-sheets/export-folder', {
    body: JSON.stringify({ rows, title }),
    method: 'POST',
  });
}

export async function revokeGoogleSheets() {
  return proxyFetch<{ connected: false }>('/proxy/google-sheets/revoke', { method: 'POST' });
}

// --- Feedback API ---

export async function submitFeedback(input: { category: FeedbackCategory; context: string; message: string }) {
  return proxyFetch<{ id: string; status: 'received' }>('/proxy/feedback', {
    body: JSON.stringify({ category: input.category, context: input.context, message: input.message.trim() }),
    method: 'POST',
  });
}

// --- Specialized translation API ---

export interface SpecializedTranslateRequest {
  domainId: 'general' | 'medical' | 'legal' | 'tech' | 'academic';
  // Up to 5 similar pairs from the user's sentence memory (data/sentenceMemory.ts).
  examples?: { source: string; target: string }[];
  glossary: { sourceTerm: string; targetTerm: string }[];
  sourceLang: string;
  sourceText: string;
  targetLang: string;
  // Fixed tone from an agent preset; the server rejects anything else.
  tone?: 'neutral' | 'formal' | 'plain';
}

export interface SpecializedTranslateResponse {
  appliedTerms: { sourceTerm: string; targetTerm: string }[];
  characterCount: number;
  examplesUsed?: number;
  provider: 'openai';
  translatedText: string;
}

export async function translateSpecialized(req: SpecializedTranslateRequest): Promise<SpecializedTranslateResponse> {
  return proxyFetch<SpecializedTranslateResponse>('/proxy/translate/specialized', {
    body: JSON.stringify(req),
    method: 'POST',
  });
}
