import type { IncomingMessage, ServerResponse } from 'http';

import { createClient } from '@supabase/supabase-js';
import ffmpegPath from 'ffmpeg-static';

import { createServer } from '../backend/server';
import { createSupabaseFeedbackStore, type FeedbackStore } from '../backend/feedback';
import { createGoogleSheetsStore } from '../backend/googleSheetsStore';
import { QuotaTracker } from '../backend/quotaTracker';
import { createSupabaseQuotaStore } from '../backend/supabaseQuotaStore';
import { createSupabaseAccountDeletionStore } from '../backend/accountDeletion';

type BackendProxyRequest = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
};

type BackendProxyHandlerOptions = {
  env?: Record<string, string | undefined>;
  feedbackStore?: FeedbackStore;
  verifyAuth?: (token: string) => Promise<{ userId: string } | null>;
};

let cachedHandler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;

export function resolveBackendProxyRequestUrl(req: BackendProxyRequest) {
  const requestUrl = new URL(req.url ?? '/', 'http://localhost');
  const rawPath = req.query?.path ?? requestUrl.searchParams.get('path') ?? '';
  const path = Array.isArray(rawPath) ? rawPath.join('/') : rawPath;
  const cleanPath = path.replace(/^\/+/, '');

  requestUrl.searchParams.delete('path');

  return `/${cleanPath}${requestUrl.search}`;
}

export function createBackendProxyHandler({
  env = process.env,
  feedbackStore: injectedFeedbackStore,
  verifyAuth = verifySupabaseJwt,
}: BackendProxyHandlerOptions = {}) {
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const serviceClient = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    : undefined;
  const googleSheetsStore = serviceClient
    ? createGoogleSheetsStore(serviceClient, env)
    : undefined;
  const feedbackStore = injectedFeedbackStore ?? (serviceClient
    ? createSupabaseFeedbackStore(serviceClient)
    : undefined);
  const accountDeletionStore = serviceClient ? createSupabaseAccountDeletionStore(serviceClient) : undefined;
  const { app } = createServer({
    accountDeletionStore,
    // Serverless instances do not share memory, so quota lives in Postgres whenever the service role is set.
    createQuotaStore: serviceClient
      ? (limits) => createSupabaseQuotaStore(serviceClient, limits, new QuotaTracker(limits))
      : undefined,
    env,
    feedbackStore,
    googleSheetsStore,
    // Transcodes pronunciation recordings in memory before they go to Azure.
    pronunciation: { ffmpegPath },
    verifyAuth,
  });

  return (req: BackendProxyRequest, res: ServerResponse) => {
    req.url = resolveBackendProxyRequestUrl(req);
    app(req, res);
  };
}

async function verifySupabaseJwt(token: string) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  const supabase = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return { userId: data.user.id };
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (!cachedHandler) {
    cachedHandler = createBackendProxyHandler();
  }

  cachedHandler(req, res);
}
