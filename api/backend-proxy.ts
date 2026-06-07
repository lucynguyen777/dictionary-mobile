import type { IncomingMessage, ServerResponse } from 'http';

import { createClient } from '@supabase/supabase-js';

import { createServer } from '../backend/server';
import { createGoogleSheetsStore } from '../backend/googleSheetsStore';

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
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const googleSheetsStore = supabaseUrl && serviceRoleKey
    ? createGoogleSheetsStore(createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }), env)
    : undefined;
  const { app } = createServer({
    env,
    googleSheetsStore,
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
