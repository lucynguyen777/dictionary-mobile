/**
 * Backend Proxy Client — Typed fetch wrapper for the local backend proxy.
 *
 * All calls go through the Expo dev server proxy (`/backend-proxy/...`) which
 * the backend Express server handles via the `app.use('/backend-proxy', proxyRouter)`
 * convention created in DevClientPlugin.
 *
 * In production (standalone builds) the native module resolves the backend URL
 * from config; on web the explicit port is used.
 */

import { Platform } from 'react-native';

export type AiChatGoal = 'conversation' | 'correction' | 'explanation' | 'roleplay';

export interface AiChatMessage {
  content: string;
  role: 'assistant' | 'system' | 'user';
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

export interface QuotaState {
  translation: { used: number; limit: number } | null;
  aiChat: { used: number; limit: number } | null;
}

// --- URL resolution ---

function getBackendBaseUrl(): string {
  if (Platform.OS === 'web') {
    // On web the proxy is served from the same host:port as the Expo dev server
    return '';
  }
  // Native builds: the DevClientPlugin proxies /backend-proxy to the Express server
  return '';
}

const BASE = getBackendBaseUrl();
const PROXY_PREFIX = '/backend-proxy';

// --- Helpers ---

async function proxyFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE}${PROXY_PREFIX}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text().catch(() => 'Unknown error');
    }
    throw new BackendProxyError(
      res.status,
      (errorBody as { error?: { code?: string; message?: string } })?.error?.message ?? String(errorBody),
      (errorBody as { error?: { code?: string } })?.error?.code,
    );
  }

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

// --- Quota API ---

export async function getQuota(): Promise<QuotaState> {
  return proxyFetch<QuotaState>('/proxy/quota');
}