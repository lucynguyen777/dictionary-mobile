import { createHmac, timingSafeEqual } from 'node:crypto';

export const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
] as const;

export type GoogleSheetsEnv = Partial<Record<string, string | undefined>>;

export type GoogleSheetsConfig =
  | { missingKeys: string[]; status: 'unconfigured' }
  | {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      stateSecret: string;
      status: 'configured';
    };

type OAuthState = {
  expiresAt: number;
  nonce: string;
  returnTo: string;
  userId: string;
};

export function readGoogleSheetsConfig(env: GoogleSheetsEnv): GoogleSheetsConfig {
  const keys = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_OAUTH_STATE_SECRET'] as const;
  const missingKeys = keys.filter((key) => !env[key]?.trim());
  const redirectUri = env.GOOGLE_OAUTH_REDIRECT_URI?.trim()
    || 'https://dictionaire-mobile.vercel.app/backend-proxy/proxy/google-sheets/callback';

  if (missingKeys.length) return { missingKeys, status: 'unconfigured' };

  return {
    clientId: env.GOOGLE_CLIENT_ID!.trim(),
    clientSecret: env.GOOGLE_CLIENT_SECRET!.trim(),
    redirectUri,
    stateSecret: env.GOOGLE_OAUTH_STATE_SECRET!.trim(),
    status: 'configured',
  };
}

export function createGoogleConsentUrl(
  config: Extract<GoogleSheetsConfig, { status: 'configured' }>,
  userId: string,
  options: { nonce: string; now?: number; returnTo?: string }
) {
  const now = options.now ?? Date.now();
  const state = signOAuthState({
    expiresAt: now + 10 * 60 * 1000,
    nonce: options.nonce,
    returnTo: normalizeReturnTo(options.returnTo),
    userId,
  }, config.stateSecret);
  const params = new URLSearchParams({
    access_type: 'offline',
    client_id: config.clientId,
    include_granted_scopes: 'true',
    prompt: 'consent',
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GOOGLE_SHEETS_SCOPES.join(' '),
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function verifyGoogleOAuthState(value: string, secret: string, now = Date.now()): OAuthState {
  const [payload, signature] = value.split('.');
  if (!payload || !signature) throw new Error('oauth_state_invalid');
  const expected = sign(payload, secret);
  const expectedBytes = Buffer.from(expected);
  const signatureBytes = Buffer.from(signature);
  if (expectedBytes.length !== signatureBytes.length || !timingSafeEqual(expectedBytes, signatureBytes)) {
    throw new Error('oauth_state_invalid');
  }

  const state = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as OAuthState;
  if (!state.userId || !state.nonce || state.expiresAt <= now) throw new Error('oauth_state_expired');
  return state;
}

export function validateGoogleSheetRows(rows: unknown) {
  if (!Array.isArray(rows) || rows.length < 2 || rows.length > 10_001) throw new Error('google_export_rows_invalid');
  return rows.map((row) => {
    if (!Array.isArray(row) || row.length !== 7) throw new Error('google_export_rows_invalid');
    return row.map((cell) => String(cell ?? '').slice(0, 10_000));
  });
}

function signOAuthState(state: OAuthState, secret: string) {
  const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function normalizeReturnTo(value?: string) {
  if (!value?.startsWith('/')) return '/advanced';
  return value.slice(0, 200);
}
