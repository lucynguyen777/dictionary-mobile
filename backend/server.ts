import { timingSafeEqual } from 'node:crypto';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

import {
  getProviderUnconfiguredResponse,
  readBackendProxyConfig,
  type BackendProxyConfig,
  type BackendProxyEnv,
  type BackendProxyLimits,
} from './proxyConfig';
import { QuotaTracker, type QuotaFeature, type QuotaStore } from './quotaTracker';
import {
  createGoogleConsentUrl,
  createGoogleSpreadsheet,
  buildGoogleOAuthReturnUrl,
  exchangeGoogleAuthorizationCode,
  refreshGoogleAccessToken,
  revokeGoogleToken,
  readGoogleSheetsConfig,
  validateGoogleSheetRows,
  verifyGoogleOAuthState,
} from './googleSheetsOAuth';
import type { GoogleSheetsStore } from './googleSheetsStore';
import { selectAppliedGlossaryTerms } from '../data/glossaryMatching';
import { fetchWithTimeout } from '../data/http';
import { readSseStream } from '../data/sseParser';
import { validateSpecializedTranslateRequest } from './proxyRequestValidation';
import { buildSpecializedTranslationMessages } from './specializedTranslation';
import { submitFeedback, type FeedbackStore } from './feedback';
import { readAccountDeletionConfig, requestAccountDeletion, type AccountDeletionStore } from './accountDeletion';

const DEFAULT_PORT = 3001;

export type ServerDependencies = {
  env: BackendProxyEnv;
  port?: number;
  googleSheetsStore?: GoogleSheetsStore;
  feedbackStore?: FeedbackStore;
  accountDeletionStore?: AccountDeletionStore;
  // Durable quota storage; defaults to the in-memory tracker (fine for local dev, not for serverless).
  createQuotaStore?: (limits: BackendProxyLimits) => QuotaStore;
  verifyAuth: (token: string) => Promise<{ userId: string } | null>;
};

export function createServer(deps: ServerDependencies) {
  const app = express();
  const port = deps.port ?? DEFAULT_PORT;

  app.use(cors({ origin: readAllowedOrigins(deps.env) }));
  // Sized for the largest valid AI chat payload (20 messages x 4,000 code points of up to 4 UTF-8 bytes).
  app.use(express.json({ limit: '384kb' }));

  // Read config once
  let config: BackendProxyConfig = readBackendProxyConfig(deps.env);
  const googleSheetsConfig = readGoogleSheetsConfig(deps.env);

  // Build quota tracking only when configured
  const quotaTracker: QuotaStore | null =
    config.status === 'configured'
      ? deps.createQuotaStore?.(config.limits) ?? new QuotaTracker(config.limits)
      : null;

  // --- Middleware ---

  // Auth middleware: verify Supabase JWT from Authorization header
  // Google redirects the browser here without an app session, so this route only validates the
  // signed state and hands the code back to the app. Tokens are stored by /proxy/google-sheets/complete,
  // which requires the signed-in user to match the user who started the flow.
  app.get('/oauth/google/callback', (req: Request, res: Response) => {
    if (googleSheetsConfig.status === 'unconfigured') {
      res.status(503).json({ error: { code: 'google_oauth_unconfigured', missingKeys: googleSheetsConfig.missingKeys } });
      return;
    }
    let returnTo: string;
    try {
      returnTo = verifyGoogleOAuthState(String(req.query.state ?? ''), googleSheetsConfig.stateSecret).returnTo;
    } catch {
      res.status(400).json({ error: { code: 'oauth_state_invalid' } });
      return;
    }
    if (typeof req.query.code !== 'string' || !req.query.code) {
      const denied = req.query.error === 'access_denied';
      res.redirect(302, buildGoogleOAuthReturnUrl(returnTo, { googleSheets: denied ? 'denied' : 'failed' }));
      return;
    }
    res.redirect(302, buildGoogleOAuthReturnUrl(returnTo, {
      googleSheetsCode: req.query.code,
      googleSheetsState: String(req.query.state),
    }));
  });

  const accountDeletionConfig = readAccountDeletionConfig(deps.env);

  // Purges scheduled account deletions whose grace period ended. Called by the Vercel cron (GET, with
  // CRON_SECRET as a bearer token) or another scheduler (POST); never by the app.
  app.all('/admin/purge-account-deletions', async (req: Request, res: Response) => {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.status(405).end();
      return;
    }
    const secret = deps.env.CRON_SECRET?.trim();
    const provided = (req.headers.authorization ?? '').replace(/^Bearer /, '');
    const expected = Buffer.from(secret ?? '');
    const received = Buffer.from(provided);
    if (!secret || expected.length !== received.length || !timingSafeEqual(expected, received)) {
      res.status(401).json({ error: { code: 'unauthorized' } });
      return;
    }
    if (accountDeletionConfig.mode !== 'scheduled' || !deps.accountDeletionStore) {
      res.status(503).json({ error: { code: 'account_deletion_unconfigured' } });
      return;
    }
    try {
      res.json({ purged: await deps.accountDeletionStore.purgeDue() });
    } catch {
      res.status(500).json({ error: { code: 'account_deletion_failed' } });
    }
  });

  app.use('/proxy', async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: { code: 'unauthorized', message: 'Missing or invalid Authorization header.' } });
      return;
    }

    const token = authHeader.slice(7);
    const session = await deps.verifyAuth(token);
    if (!session) {
      res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid or expired session token.' } });
      return;
    }

    // Attach userId for downstream handlers
    (req as Request & { userId: string }).userId = session.userId;
    next();
  });

  // Config guard middleware: reject if backend providers are unconfigured
  app.use(['/proxy/translate', '/proxy/ai', '/proxy/quota'], (_req: Request, res: Response, next: NextFunction) => {
    if (config.status === 'unconfigured') {
      res.status(503).json(getProviderUnconfiguredResponse(config));
      return;
    }
    next();
  });

  // --- Routes ---

  app.get('/proxy/google-sheets/connect', (req: Request, res: Response) => {
    if (googleSheetsConfig.status === 'unconfigured') {
      res.status(503).json({ error: { code: 'google_oauth_unconfigured', missingKeys: googleSheetsConfig.missingKeys } });
      return;
    }
    const userId = (req as Request & { userId: string }).userId;
    res.json({
      authorizationUrl: createGoogleConsentUrl(googleSheetsConfig, userId, {
        nonce: globalThis.crypto.randomUUID(),
        returnTo: typeof req.query.returnTo === 'string' ? req.query.returnTo : undefined,
      }),
    });
  });

  app.post('/proxy/google-sheets/complete', async (req: Request, res: Response) => {
    try {
      if (googleSheetsConfig.status === 'unconfigured' || !deps.googleSheetsStore?.configured) {
        throw new Error('google_token_storage_unconfigured');
      }
      const userId = (req as Request & { userId: string }).userId;
      const state = verifyGoogleOAuthState(String(req.body?.state ?? ''), googleSheetsConfig.stateSecret);
      if (state.userId !== userId) throw new Error('oauth_state_user_mismatch');
      const code = typeof req.body?.code === 'string' ? req.body.code : '';
      if (!code || code.length > 2048) throw new Error('google_oauth_code_missing');
      const tokens = await exchangeGoogleAuthorizationCode(googleSheetsConfig, code);
      if (!tokens.refresh_token) throw new Error('google_refresh_token_missing');
      await deps.googleSheetsStore.saveRefreshToken(userId, tokens.refresh_token);
      res.json({ connected: true });
    } catch (error) {
      res.status(400).json({ error: { code: toGoogleSheetsErrorCode(error, 'google_oauth_complete_failed') } });
    }
  });

  app.get('/proxy/google-sheets/status', async (req: Request, res: Response) => {
    const userId = (req as Request & { userId: string }).userId;
    const connected = deps.googleSheetsStore?.configured
      ? Boolean(await deps.googleSheetsStore.loadRefreshToken(userId))
      : false;
    res.json({
      configured: googleSheetsConfig.status === 'configured',
      connected,
      persistenceConfigured: Boolean(deps.googleSheetsStore?.configured),
    });
  });

  app.post('/proxy/google-sheets/export-folder', async (req: Request, res: Response) => {
    try {
      if (googleSheetsConfig.status === 'unconfigured' || !deps.googleSheetsStore?.configured) {
        throw new Error('google_token_storage_unconfigured');
      }
      const userId = (req as Request & { userId: string }).userId;
      const rows = validateGoogleSheetRows(req.body?.rows);
      const refreshToken = await deps.googleSheetsStore.loadRefreshToken(userId);
      if (!refreshToken) {
        res.status(409).json({ error: { code: 'google_connection_required', message: 'Connect Google Sheets before exporting.' } });
        return;
      }
      const token = await refreshGoogleAccessToken(googleSheetsConfig, refreshToken);
      const sheet = await createGoogleSpreadsheet(token.access_token, String(req.body?.title ?? ''), rows);
      res.json({ spreadsheetUrl: sheet.spreadsheetUrl });
    } catch (error) {
      res.status(400).json({ error: { code: toGoogleSheetsErrorCode(error, 'google_export_failed') } });
    }
  });

  app.post('/proxy/google-sheets/revoke', async (req: Request, res: Response) => {
    const userId = (req as Request & { userId: string }).userId;
    try {
      if (deps.googleSheetsStore?.configured) {
        const refreshToken = await deps.googleSheetsStore.loadRefreshToken(userId);
        // Local deletion still proceeds if Google is unreachable; the user can revoke from their Google account.
        if (refreshToken) await revokeGoogleToken(refreshToken).catch(() => undefined);
        await deps.googleSheetsStore.revoke(userId);
      }
      res.json({ connected: false });
    } catch (error) {
      res.status(500).json({ error: { code: toGoogleSheetsErrorCode(error, 'google_revoke_failed') } });
    }
  });

  // Account deletion status for the signed-in user; the mode tells the app what to offer.
  app.get('/proxy/account/deletion', async (req: Request, res: Response) => {
    const userId = (req as Request & { userId: string }).userId;
    if (!accountDeletionConfig.mode || !deps.accountDeletionStore) {
      res.json({ graceDays: accountDeletionConfig.graceDays, mode: null, scheduled: null });
      return;
    }
    try {
      const scheduled = accountDeletionConfig.mode === 'scheduled' ? await deps.accountDeletionStore.getScheduled(userId) : null;
      res.json({ graceDays: accountDeletionConfig.graceDays, mode: accountDeletionConfig.mode, scheduled });
    } catch {
      res.status(500).json({ error: { code: 'account_deletion_failed' } });
    }
  });

  app.post('/proxy/account/deletion', async (req: Request, res: Response) => {
    const userId = (req as Request & { userId: string }).userId;
    try {
      res.json(await requestAccountDeletion(accountDeletionConfig, deps.accountDeletionStore, userId, req.body));
    } catch (error) {
      const code = error instanceof Error ? error.message : 'account_deletion_failed';
      const status = code === 'account_deletion_unconfigured' ? 503 : code === 'account_deletion_unconfirmed' ? 400 : 500;
      res.status(status).json({ error: { code: status === 500 ? 'account_deletion_failed' : code } });
    }
  });

  app.delete('/proxy/account/deletion', async (req: Request, res: Response) => {
    const userId = (req as Request & { userId: string }).userId;
    if (accountDeletionConfig.mode !== 'scheduled' || !deps.accountDeletionStore) {
      res.status(409).json({ error: { code: 'account_deletion_not_scheduled' } });
      return;
    }
    try {
      await deps.accountDeletionStore.cancelScheduled(userId);
      res.json({ scheduled: null });
    } catch {
      res.status(500).json({ error: { code: 'account_deletion_failed' } });
    }
  });

  app.post('/proxy/feedback', async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { userId: string }).userId;
      const result = await submitFeedback(deps.feedbackStore, userId, req.body);
      res.status(201).json({ id: result.id, status: 'received' });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'feedback_submit_failed';
      const status = code === 'feedback_rate_limited'
        ? 429
        : code === 'feedback_storage_unconfigured'
          ? 503
          : 400;
      res.status(status).json({ error: { code } });
    }
  });

  // Health check (no auth required)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', configured: config.status === 'configured' });
  });

  // POST /proxy/translate/text - DeepL translation
  app.post('/proxy/translate/text', async (req: Request, res: Response) => {
    const userId = (req as Request & { userId: string }).userId;
    if (config.status !== 'configured') {
      res.status(503).json(getProviderUnconfiguredResponse(config));
      return;
    }

    const { validateTranslateTextRequest } = await import('./proxyRequestValidation.js');
    const validation = validateTranslateTextRequest(req.body, config.limits);
    if (validation.ok === false) {
      res.status(validation.status).json({ error: validation.error });
      return;
    }

    const { sourceText, targetLang, sourceLang, glossaryId, formality } = validation.data;

    // Check quota
    if (quotaTracker) {
      const quotaCheck = await checkQuotaOrFailClosed(quotaTracker, userId, 'translation', validation.data.characterCount);
      if (quotaCheck.ok === false) {
        res.status(quotaCheck.status).json({ error: quotaCheck.error });
        return;
      }
    }

    try {
      const deeplResponse = await callDeepLTranslate(
        config.deeplApiBaseUrl,
        config.deeplApiKey,
        sourceText,
        targetLang,
        { sourceLang, glossaryId, formality }
      );

      res.json({
        translatedText: deeplResponse.translatedText,
        detectedSourceLanguage: deeplResponse.detectedSourceLanguage,
        provider: 'deepl' as const,
        providerRequestId: deeplResponse.requestId ?? null,
        characterCount: validation.data.characterCount,
        glossaryApplied: !!glossaryId,
        warnings: deeplResponse.warnings ?? [],
      });
    } catch {
      // Upstream error bodies can echo request text or account details, so clients get a generic message.
      res.status(502).json({ error: { code: 'provider_error', message: 'Translation provider is unavailable. Try again later.' } });
    }
  });

  // POST /proxy/ai/chat - OpenAI AI chat; `stream: true` answers with Server-Sent Events
  app.post('/proxy/ai/chat', async (req: Request, res: Response) => {
    const userId = (req as Request & { userId: string }).userId;
    if (config.status !== 'configured') {
      res.status(503).json(getProviderUnconfiguredResponse(config));
      return;
    }

    const { validateAiChatRequest } = await import('./proxyRequestValidation.js');
    const validation = validateAiChatRequest(req.body);
    if (validation.ok === false) {
      res.status(validation.status).json({ error: validation.error });
      return;
    }

    // Check quota (counts as 1 request)
    if (quotaTracker) {
      const quotaCheck = await checkQuotaOrFailClosed(quotaTracker, userId, 'ai-chat', 1);
      if (quotaCheck.ok === false) {
        res.status(quotaCheck.status).json({ error: quotaCheck.error });
        return;
      }
    }

    if (validation.data.stream) {
      await streamOpenAIChat(res, config.openaiApiKey, config.openaiTextModel, validation.data);
      return;
    }

    try {
      const aiResponse = await callOpenAIChat(config.openaiApiKey, config.openaiTextModel, validation.data);
      res.json(aiResponse);
    } catch {
      res.status(502).json({ error: AI_PROVIDER_ERROR });
    }
  });

  // POST /proxy/translate/specialized - domain translation that follows the user's glossary (OpenAI)
  app.post('/proxy/translate/specialized', async (req: Request, res: Response) => {
    const userId = (req as Request & { userId: string }).userId;
    if (config.status !== 'configured') {
      res.status(503).json(getProviderUnconfiguredResponse(config));
      return;
    }

    const validation = validateSpecializedTranslateRequest(req.body ?? {}, config.limits);
    if (validation.ok === false) {
      res.status(validation.status).json({ error: validation.error });
      return;
    }

    if (quotaTracker) {
      const quotaCheck = await checkQuotaOrFailClosed(quotaTracker, userId, 'translation', validation.data.characterCount);
      if (quotaCheck.ok === false) {
        res.status(quotaCheck.status).json({ error: quotaCheck.error });
        return;
      }
    }

    const appliedTerms = selectAppliedGlossaryTerms(validation.data.sourceText, validation.data.glossary);
    try {
      const completion = await callOpenAIMessages(
        config.openaiApiKey,
        config.openaiTextModel,
        buildSpecializedTranslationMessages({ ...validation.data, appliedTerms })
      );
      if (!completion.content.trim()) throw new Error('openai_empty_translation');
      res.json({
        appliedTerms,
        characterCount: validation.data.characterCount,
        examplesUsed: validation.data.examples.length,
        provider: 'openai',
        translatedText: completion.content.trim(),
      });
    } catch {
      res.status(502).json({ error: { code: 'provider_error', message: 'Translation provider is unavailable. Try again later.' } });
    }
  });

  // GET /proxy/quota - current user quota state
  app.get('/proxy/quota', async (req: Request, res: Response) => {
    const userId = (req as Request & { userId: string }).userId;
    if (!quotaTracker) {
      res.status(503).json({ error: { code: 'provider_unconfigured', message: 'Quota not available.' } });
      return;
    }

    try {
      const [translation, aiChat] = await Promise.all([
        quotaTracker.getState(userId, 'translation'),
        quotaTracker.getState(userId, 'ai-chat'),
      ]);
      res.json({ translation, aiChat });
    } catch {
      res.status(503).json({ error: QUOTA_UNAVAILABLE_ERROR });
    }
  });

  return { app, port };
}

export function startServer(deps: ServerDependencies) {
  const { app, port } = createServer(deps);

  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`Backend proxy server listening on port ${port}`);
      resolve();
    });
  });
}

const QUOTA_UNAVAILABLE_ERROR = { code: 'quota_unavailable', message: 'Usage limits cannot be checked right now. Try again later.' };

// Provider calls cost money, so a quota store that cannot answer blocks the request instead of allowing it.
async function checkQuotaOrFailClosed(store: QuotaStore, userId: string, feature: QuotaFeature, amount: number) {
  try {
    return await store.checkQuota(userId, feature, amount);
  } catch {
    return { error: QUOTA_UNAVAILABLE_ERROR, ok: false as const, status: 503 };
  }
}

const DEFAULT_ALLOWED_ORIGINS = ['https://dictionaire-mobile.vercel.app', 'http://localhost:8081'];

// Native apps send no Origin header and are unaffected; this only limits which websites can call the proxy.
function readAllowedOrigins(env: BackendProxyEnv) {
  const configured = env.BACKEND_PROXY_ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);
  return configured?.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

const GOOGLE_SHEETS_ERROR_CODES = new Set([
  'google_connection_delete_failed',
  'google_export_rows_invalid',
  'google_oauth_code_missing',
  'google_oauth_exchange_failed',
  'google_oauth_refresh_failed',
  'google_refresh_token_missing',
  'google_sheet_create_failed',
  'google_sheet_write_failed',
  'google_token_delete_failed',
  'google_token_load_failed',
  'google_token_save_failed',
  'google_token_storage_unconfigured',
  'oauth_state_expired',
  'oauth_state_invalid',
  'oauth_state_user_mismatch',
]);

// Only known error codes reach clients; anything else (parser, network, provider text) is masked.
function toGoogleSheetsErrorCode(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  return GOOGLE_SHEETS_ERROR_CODES.has(message) ? message : fallback;
}

// --- DeepL API client ---

async function callDeepLTranslate(
  baseUrl: string,
  apiKey: string,
  text: string,
  targetLang: string,
  opts?: { sourceLang?: string; glossaryId?: string; formality?: string }
) {
  const params = new URLSearchParams({
    target_lang: targetLang.toUpperCase(),
    text,
  });

  if (opts?.sourceLang) params.append('source_lang', opts.sourceLang.toUpperCase());
  if (opts?.glossaryId) params.append('glossary_id', opts.glossaryId);
  if (opts?.formality) params.append('formality', opts.formality);

  const response = await fetchWithTimeout(`${baseUrl}/v2/translate`, {
    timeoutMs: 20_000,
    body: params,
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`DeepL API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as {
    translations: Array<{
      detected_source_language: string;
      text: string;
    }>;
  };

  const translation = data.translations?.[0];
  if (!translation) {
    throw new Error('DeepL API returned empty translations array');
  }

  return {
    detectedSourceLanguage: translation.detected_source_language,
    translatedText: translation.text,
    requestId: response.headers.get('x-request-id') ?? undefined,
    warnings: [] as string[],
  };
}

// --- OpenAI API client ---

async function callOpenAIChat(
  apiKey: string,
  model: string,
  params: {
    goal: string;
    learningLanguage: string;
    messages: Array<{ content: string; role: string }>;
    nativeLanguage?: string;
    stream: boolean;
  }
) {
  const systemMessage = buildAiSystemMessage(params.goal, params.learningLanguage, params.nativeLanguage);
  return callOpenAIMessages(
    apiKey,
    model,
    systemMessage ? [{ content: systemMessage, role: 'system' }, ...params.messages] : params.messages
  );
}

async function callOpenAIMessages(apiKey: string, model: string, messages: Array<{ content: string; role: string }>) {
  const body: Record<string, unknown> = {
    model,
    messages,
    stream: false,
  };

  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    timeoutMs: 60_000,
    body: JSON.stringify(body),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string };
    }>;
    usage?: { total_tokens?: number };
  };

  return {
    content: data.choices?.[0]?.message?.content ?? '',
    provider: 'openai' as const,
    totalTokens: data.usage?.total_tokens ?? 0,
  };
}

const AI_PROVIDER_ERROR = { code: 'provider_error', message: 'AI provider is unavailable. Try again later.' };

type AiChatParams = Parameters<typeof callOpenAIChat>[2];

// Streams OpenAI deltas to the client as SSE events:
//   data: {"delta":"..."}  ...  data: {"done":true,"provider":"openai","totalTokens":N}
// Failures before the first byte are plain JSON errors; later ones end the stream with data: {"error":{...}}.
async function streamOpenAIChat(res: Response, apiKey: string, model: string, params: AiChatParams) {
  const upstreamAbort = new AbortController();
  const onClientGone = () => upstreamAbort.abort();
  res.on('close', onClientGone);

  try {
    const systemMessage = buildAiSystemMessage(params.goal, params.learningLanguage, params.nativeLanguage);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      body: JSON.stringify({
        messages: systemMessage ? [{ content: systemMessage, role: 'system' }, ...params.messages] : params.messages,
        model,
        stream: true,
        stream_options: { include_usage: true },
      }),
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: upstreamAbort.signal,
    });

    if (!response.ok || !response.body) {
      await response.body?.cancel().catch(() => undefined);
      res.status(502).json({ error: AI_PROVIDER_ERROR });
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (payload: unknown) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
    let totalTokens = 0;
    let finished = false;

    try {
      await readSseStream(response.body, (data) => {
        if (finished) return;
        if (data === '[DONE]') {
          finished = true;
          return;
        }
        const chunk = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
          usage?: { total_tokens?: number } | null;
        };
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) send({ delta });
        if (chunk.usage?.total_tokens) totalTokens = chunk.usage.total_tokens;
      });
      if (!finished) throw new Error('openai_stream_incomplete');
      send({ done: true, provider: 'openai', totalTokens });
    } catch {
      if (!upstreamAbort.signal.aborted) send({ error: AI_PROVIDER_ERROR });
    }
    res.end();
  } catch {
    if (upstreamAbort.signal.aborted) return;
    if (res.headersSent) {
      res.end();
    } else {
      res.status(502).json({ error: AI_PROVIDER_ERROR });
    }
  } finally {
    res.off('close', onClientGone);
  }
}

function buildAiSystemMessage(goal: string, learningLanguage: string, nativeLanguage?: string): string {
  const native = nativeLanguage ?? 'English';
  const messages: Record<string, string> = {
    conversation: `You are a language conversation partner. The user is learning ${learningLanguage}. Their native language is ${native}. Respond in ${learningLanguage} at an appropriate level. Keep the conversation natural and engaging.`,
    correction: `You are a language tutor. The user is learning ${learningLanguage}. Their native language is ${native}. Correct the user's message, explain the grammar or vocabulary error, and provide the corrected version. Respond in ${native} for explanations.`,
    explanation: `You are a language explainer. The user is learning ${learningLanguage}. Their native language is ${native}. Explain the meaning, usage, and grammar of the user's query in ${native}.`,
    roleplay: `You are a language roleplay partner. The user is learning ${learningLanguage}. Their native language is ${native}. Set up a realistic scenario and interact in ${learningLanguage}. Help the user practice real-world conversations.`,
  };

  return messages[goal] ?? messages.conversation;
}
