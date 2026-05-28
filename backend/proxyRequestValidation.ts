import type { BackendProxyLimits } from './proxyConfig';
import type { UserProviderSecretScope } from './userProviderSecrets';

export const AI_CHAT_MAX_MESSAGES = 20;
export const AI_CHAT_MAX_MESSAGE_CHARS = 4_000;
export const AI_VOICE_FEEDBACK_MAX_TRANSCRIPT_CHARS = 2_000;
export const GLOSSARY_TERM_MAX_CHARS = 120;
export const PROVIDER_SECRET_MAX_CHARS = 4_000;

export type ProxyValidationErrorCode =
  | 'ai_message_empty'
  | 'ai_message_too_large'
  | 'glossary_entry_duplicate'
  | 'glossary_entry_invalid'
  | 'glossary_language_mismatch'
  | 'provider_secret_invalid'
  | 'text_too_large'
  | 'unsupported_language_pair'
  | 'voice_feedback_audio_not_supported';

export type ProxyValidationError = {
  code: ProxyValidationErrorCode;
  field: string;
  message: string;
};

export type ProxyValidationResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      error: ProxyValidationError;
      ok: false;
      status: 400 | 413;
    };

export type TranslateTextRequest = {
  domainId?: unknown;
  formality?: unknown;
  glossaryId?: unknown;
  sourceLang?: unknown;
  sourceText?: unknown;
  targetLang?: unknown;
};

export type ValidatedTranslateTextRequest = {
  characterCount: number;
  domainId?: string;
  formality?: string;
  glossaryId?: string;
  sourceLang?: string;
  sourceText: string;
  targetLang: string;
};

export type GlossaryEntryRequest = {
  note?: unknown;
  sourceTerm?: unknown;
  targetTerm?: unknown;
};

export type GlossaryRequest = {
  domainId?: unknown;
  entries?: unknown;
  name?: unknown;
  sourceLang?: unknown;
  targetLang?: unknown;
};

export type ValidatedGlossaryEntry = {
  note?: string;
  sourceTerm: string;
  targetTerm: string;
};

export type ValidatedGlossaryRequest = {
  domainId?: string;
  entries: ValidatedGlossaryEntry[];
  name: string;
  sourceLang: string;
  targetLang: string;
};

export type AiChatMessageRequest = {
  content?: unknown;
  role?: unknown;
};

export type AiChatRequest = {
  conversationId?: unknown;
  goal?: unknown;
  learningLanguage?: unknown;
  messages?: unknown;
  nativeLanguage?: unknown;
  stream?: unknown;
};

export type ValidatedAiChatRequest = {
  conversationId?: string;
  goal: 'conversation' | 'correction' | 'explanation' | 'roleplay';
  learningLanguage: string;
  messages: Array<{
    content: string;
    role: 'assistant' | 'system' | 'user';
  }>;
  nativeLanguage?: string;
  stream: boolean;
};

export type VoiceFeedbackRequest = {
  audio?: unknown;
  feedbackMode?: unknown;
  learningLanguage?: unknown;
  targetPhrase?: unknown;
  transcript?: unknown;
};

export type ValidatedVoiceFeedbackRequest = {
  feedbackMode: 'fluency' | 'grammar' | 'pronunciation_copy_only' | 'vocabulary';
  learningLanguage: string;
  targetPhrase?: string;
  transcript: string;
};

export type UserProviderConnectionRequest = {
  apiKey?: unknown;
  displayLabel?: unknown;
  provider?: unknown;
  purpose?: unknown;
};

export type ValidatedUserProviderConnectionRequest = {
  apiKey: string;
  displayLabel?: string;
  scope: Omit<UserProviderSecretScope, 'userId'>;
};

export function validateTranslateTextRequest(
  request: TranslateTextRequest,
  limits: Pick<BackendProxyLimits, 'maxTextInputChars'>
): ProxyValidationResult<ValidatedTranslateTextRequest> {
  const sourceText = readTrimmedString(request.sourceText);
  const targetLang = normalizeLanguageCode(request.targetLang);
  const sourceLang = normalizeLanguageCode(request.sourceLang);
  const glossaryId = readTrimmedString(request.glossaryId);

  if (!sourceText) {
    return invalid('text_too_large', 'sourceText', 'Source text is required.', 400);
  }

  const characterCount = countCodePoints(sourceText);
  if (characterCount > limits.maxTextInputChars) {
    return invalid('text_too_large', 'sourceText', 'Source text exceeds the configured size limit.', 413);
  }

  if (!targetLang) {
    return invalid('unsupported_language_pair', 'targetLang', 'Target language is required.', 400);
  }

  if (glossaryId && !sourceLang) {
    return invalid('glossary_language_mismatch', 'sourceLang', 'Glossary requests require an explicit source language.');
  }

  return {
    data: {
      characterCount,
      domainId: readTrimmedString(request.domainId),
      formality: readTrimmedString(request.formality),
      glossaryId,
      sourceLang,
      sourceText,
      targetLang,
    },
    ok: true,
  };
}

export function validateGlossaryRequest(
  request: GlossaryRequest,
  limits: Pick<BackendProxyLimits, 'maxGlossaryEntries'>
): ProxyValidationResult<ValidatedGlossaryRequest> {
  const name = readTrimmedString(request.name);
  const sourceLang = normalizeLanguageCode(request.sourceLang);
  const targetLang = normalizeLanguageCode(request.targetLang);
  const entries = Array.isArray(request.entries) ? request.entries : [];

  if (!name) {
    return invalid('glossary_entry_invalid', 'name', 'Glossary name is required.');
  }

  if (!sourceLang || !targetLang || sourceLang === targetLang) {
    return invalid('glossary_language_mismatch', 'sourceLang', 'Glossary source and target languages must be explicit.');
  }

  if (entries.length === 0 || entries.length > limits.maxGlossaryEntries) {
    return invalid('glossary_entry_invalid', 'entries', 'Glossary entries are required and must stay within the configured limit.');
  }

  const seenSourceTerms = new Set<string>();
  const sanitizedEntries: ValidatedGlossaryEntry[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index] as GlossaryEntryRequest;
    const sourceTerm = sanitizeGlossaryTerm(entry.sourceTerm);
    const targetTerm = sanitizeGlossaryTerm(entry.targetTerm);

    if (!sourceTerm || !targetTerm) {
      return invalid('glossary_entry_invalid', `entries.${index}`, 'Glossary entries require source and target terms.');
    }

    const sourceKey = sourceTerm.toLocaleLowerCase();
    if (seenSourceTerms.has(sourceKey)) {
      return invalid('glossary_entry_duplicate', `entries.${index}.sourceTerm`, 'Glossary source terms must be unique.');
    }
    seenSourceTerms.add(sourceKey);

    sanitizedEntries.push({
      note: readTrimmedString(entry.note),
      sourceTerm,
      targetTerm,
    });
  }

  return {
    data: {
      domainId: readTrimmedString(request.domainId),
      entries: sanitizedEntries,
      name,
      sourceLang,
      targetLang,
    },
    ok: true,
  };
}

export function validateAiChatRequest(request: AiChatRequest): ProxyValidationResult<ValidatedAiChatRequest> {
  const messages = Array.isArray(request.messages) ? request.messages : [];
  if (messages.length === 0 || messages.length > AI_CHAT_MAX_MESSAGES) {
    return invalid('ai_message_empty', 'messages', 'AI chat requires a bounded message list.');
  }

  const validatedMessages: ValidatedAiChatRequest['messages'] = [];
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index] as AiChatMessageRequest;
    const role = normalizeAiRole(message.role);
    const content = readTrimmedString(message.content);

    if (!role || !content) {
      return invalid('ai_message_empty', `messages.${index}`, 'Each AI chat message requires a supported role and content.');
    }

    if (countCodePoints(content) > AI_CHAT_MAX_MESSAGE_CHARS) {
      return invalid('ai_message_too_large', `messages.${index}.content`, 'AI chat message exceeds the configured size limit.', 413);
    }

    validatedMessages.push({ content, role });
  }

  return {
    data: {
      conversationId: readTrimmedString(request.conversationId),
      goal: normalizeAiGoal(request.goal),
      learningLanguage: readTrimmedString(request.learningLanguage) || 'en',
      messages: validatedMessages,
      nativeLanguage: readTrimmedString(request.nativeLanguage),
      stream: request.stream === true,
    },
    ok: true,
  };
}

export function validateVoiceFeedbackRequest(
  request: VoiceFeedbackRequest
): ProxyValidationResult<ValidatedVoiceFeedbackRequest> {
  if (request.audio !== undefined) {
    return invalid(
      'voice_feedback_audio_not_supported',
      'audio',
      'Voice feedback accepts local transcripts only in this MVP.'
    );
  }

  const transcript = readTrimmedString(request.transcript);
  if (!transcript) {
    return invalid('ai_message_empty', 'transcript', 'Voice feedback requires a transcript.');
  }

  if (countCodePoints(transcript) > AI_VOICE_FEEDBACK_MAX_TRANSCRIPT_CHARS) {
    return invalid('ai_message_too_large', 'transcript', 'Voice feedback transcript exceeds the configured size limit.', 413);
  }

  return {
    data: {
      feedbackMode: normalizeFeedbackMode(request.feedbackMode),
      learningLanguage: readTrimmedString(request.learningLanguage) || 'en',
      targetPhrase: readTrimmedString(request.targetPhrase),
      transcript,
    },
    ok: true,
  };
}

export function validateUserProviderConnectionRequest(
  request: UserProviderConnectionRequest
): ProxyValidationResult<ValidatedUserProviderConnectionRequest> {
  const apiKey = readTrimmedString(request.apiKey);
  const provider = normalizeProvider(request.provider);
  const purpose = normalizePurpose(request.purpose);

  if (!apiKey || hasControlCharacters(apiKey) || countCodePoints(apiKey) > PROVIDER_SECRET_MAX_CHARS) {
    return invalid('provider_secret_invalid', 'apiKey', 'Provider API key is invalid.');
  }

  if (!provider || !purpose) {
    return invalid('provider_secret_invalid', 'provider', 'Provider and purpose are required.');
  }

  return {
    data: {
      apiKey,
      displayLabel: readTrimmedString(request.displayLabel),
      scope: {
        provider,
        purpose,
      },
    },
    ok: true,
  };
}

function invalid(
  code: ProxyValidationErrorCode,
  field: string,
  message: string,
  status: 400 | 413 = 400
): ProxyValidationResult<never> {
  return {
    error: {
      code,
      field,
      message,
    },
    ok: false,
    status,
  };
}

function readTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function normalizeLanguageCode(value: unknown) {
  const language = readTrimmedString(value);
  return language ? language.toUpperCase().replace(/_/g, '-') : undefined;
}

function sanitizeGlossaryTerm(value: unknown) {
  const term = readTrimmedString(value);
  if (!term || hasControlCharacters(term) || countCodePoints(term) > GLOSSARY_TERM_MAX_CHARS) {
    return undefined;
  }

  return term;
}

function hasControlCharacters(value: string) {
  return /[\u0000-\u001f\u007f]/u.test(value);
}

function countCodePoints(value: string) {
  return Array.from(value).length;
}

function normalizeAiRole(value: unknown) {
  return value === 'assistant' || value === 'system' || value === 'user' ? value : undefined;
}

function normalizeAiGoal(value: unknown): ValidatedAiChatRequest['goal'] {
  return value === 'correction' || value === 'explanation' || value === 'roleplay' ? value : 'conversation';
}

function normalizeFeedbackMode(value: unknown): ValidatedVoiceFeedbackRequest['feedbackMode'] {
  return value === 'grammar' || value === 'pronunciation_copy_only' || value === 'vocabulary' ? value : 'fluency';
}

function normalizeProvider(value: unknown): UserProviderSecretScope['provider'] | undefined {
  return value === 'deepl' || value === 'openai' || value === 'azure-speech' || value === 'custom' ? value : undefined;
}

function normalizePurpose(value: unknown): UserProviderSecretScope['purpose'] | undefined {
  return value === 'translation' || value === 'ai-agent' || value === 'speech-scoring' ? value : undefined;
}
