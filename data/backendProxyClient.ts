/**
 * Backend Proxy Client — typed fetch wrapper for the Vercel `/backend-proxy` function.
 *
 * Web builds call the proxy on the same origin. Native builds have no origin, so they need
 * `EXPO_PUBLIC_BACKEND_PROXY_URL` (for example `https://dictionaire-mobile.vercel.app`).
 */

import { Platform } from 'react-native';
import type { FeedbackCategory } from './feedback';
import { getSharedSupabaseAuthClient } from './supabaseAuthClient';

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

export interface QuotaState {
  translation: { used: number; limit: number } | null;
  aiChat: { used: number; limit: number } | null;
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

async function proxyFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
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

  const res = await fetch(url, {
    ...options,
    headers,
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

export async function exportFolderToGoogleSheets(rows: string[][]) {
  return proxyFetch<{ spreadsheetUrl: string }>('/proxy/google-sheets/export-folder', {
    body: JSON.stringify({ rows }),
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
