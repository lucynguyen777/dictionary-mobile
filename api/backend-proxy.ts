import type { IncomingMessage, ServerResponse } from 'http';

import { createClient } from '@supabase/supabase-js';

import { createServer } from '../backend/server';

type BackendProxyRequest = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
};

type BackendProxyHandlerOptions = {
  env?: Record<string, string | undefined>;
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
  verifyAuth = verifySupabaseJwt,
}: BackendProxyHandlerOptions = {}) {
  const { app } = createServer({
    env,
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
