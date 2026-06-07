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
    || 'https://dictionaire-mobile.vercel.app/backend-proxy/oauth/google/callback';

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

export async function exchangeGoogleAuthorizationCode(
  config: Extract<GoogleSheetsConfig, { status: 'configured' }>,
  code: string
) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });
  if (!response.ok) throw new Error('google_oauth_exchange_failed');
  return response.json() as Promise<{ access_token: string; expires_in: number; refresh_token?: string; scope?: string }>;
}

export async function refreshGoogleAccessToken(
  config: Extract<GoogleSheetsConfig, { status: 'configured' }>,
  refreshToken: string
) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });
  if (!response.ok) throw new Error('google_oauth_refresh_failed');
  return response.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function createGoogleSpreadsheet(accessToken: string, title: string, rows: string[][]) {
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    body: JSON.stringify({ properties: { title: sanitizeSpreadsheetTitle(title) } }),
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!createResponse.ok) throw new Error('google_sheet_create_failed');
  const created = await createResponse.json() as { spreadsheetId: string; spreadsheetUrl: string };
  const writeResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(created.spreadsheetId)}/values/A1?valueInputOption=RAW`,
    {
      body: JSON.stringify({ majorDimension: 'ROWS', values: rows }),
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      method: 'PUT',
    }
  );
  if (!writeResponse.ok) throw new Error('google_sheet_write_failed');
  return created;
}

function sanitizeSpreadsheetTitle(value: string) {
  return value.trim().slice(0, 100) || `Dictionary Mobile - ${new Date().toISOString().slice(0, 10)}`;
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
