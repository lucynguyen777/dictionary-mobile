import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

import {
  getProviderUnconfiguredResponse,
  readBackendProxyConfig,
  type BackendProxyConfig,
  type BackendProxyEnv,
} from './proxyConfig';
import { QuotaTracker } from './quotaTracker';

const DEFAULT_PORT = 3001;

export type ServerDependencies = {
  env: BackendProxyEnv;
  port?: number;
  verifyAuth: (token: string) => Promise<{ userId: string } | null>;
};

export function createServer(deps: ServerDependencies) {
  const app = express();
  const port = deps.port ?? DEFAULT_PORT;

  app.use(cors());
  app.use(express.json({ limit: '50kb' }));

  // Read config once
  let config: BackendProxyConfig = readBackendProxyConfig(deps.env);

  // Build quota tracker only when configured
  const quotaTracker =
    config.status === 'configured'
      ? new QuotaTracker(config.limits)
      : null;

  // --- Middleware ---

  // Auth middleware: verify Supabase JWT from Authorization header
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
  app.use('/proxy', (_req: Request, res: Response, next: NextFunction) => {
    if (config.status === 'unconfigured') {
      res.status(503).json(getProviderUnconfiguredResponse(config));
      return;
    }
    next();
  });

  // --- Routes ---

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
      const quotaCheck = quotaTracker.checkQuota(userId, 'translation', validation.data.characterCount);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown provider error';
      res.status(502).json({ error: { code: 'provider_error', message } });
    }
  });

  // POST /proxy/ai/chat - OpenAI AI chat (non-streaming MVP, streaming TBD)
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
      const quotaCheck = quotaTracker.checkQuota(userId, 'ai-chat', 1);
      if (quotaCheck.ok === false) {
        res.status(quotaCheck.status).json({ error: quotaCheck.error });
        return;
      }
    }

    try {
      const aiResponse = await callOpenAIChat(config.openaiApiKey, config.openaiTextModel, validation.data);
      res.json(aiResponse);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown AI provider error';
      res.status(502).json({ error: { code: 'provider_error', message } });
    }
  });

  // GET /proxy/quota - current user quota state
  app.get('/proxy/quota', (req: Request, res: Response) => {
    const userId = (req as Request & { userId: string }).userId;
    if (!quotaTracker) {
      res.status(503).json({ error: { code: 'provider_unconfigured', message: 'Quota not available.' } });
      return;
    }

    res.json({
      translation: quotaTracker.getState(userId, 'translation'),
      aiChat: quotaTracker.getState(userId, 'ai-chat'),
    });
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

// --- DeepL API client ---

async function callDeepLTranslate(
  baseUrl: string,
  apiKey: string,
  text: string,
  targetLang: string,
  opts?: { sourceLang?: string; glossaryId?: string; formality?: string }
) {
  const params = new URLSearchParams({
    auth_key: apiKey,
    target_lang: targetLang.toUpperCase(),
    text,
  });

  if (opts?.sourceLang) params.append('source_lang', opts.sourceLang.toUpperCase());
  if (opts?.glossaryId) params.append('glossary_id', opts.glossaryId);
  if (opts?.formality) params.append('formality', opts.formality);

  const response = await fetch(`${baseUrl}/v2/translate`, {
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

  const body: Record<string, unknown> = {
    model,
    messages: systemMessage ? [{ content: systemMessage, role: 'system' }, ...params.messages] : params.messages,
    stream: false,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
