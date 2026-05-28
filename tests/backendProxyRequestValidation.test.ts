import { describe, expect, it } from 'vitest';

import {
  validateAiChatRequest,
  validateGlossaryRequest,
  validateTranslateTextRequest,
  validateUserProviderConnectionRequest,
  validateVoiceFeedbackRequest,
} from '../backend/proxyRequestValidation';

describe('backend proxy request validation', () => {
  it('trims translation text and counts Unicode code points before provider calls', () => {
    expect(
      validateTranslateTextRequest(
        {
          sourceText: ' café 😀 ',
          targetLang: ' vi ',
        },
        { maxTextInputChars: 8 }
      )
    ).toEqual({
      data: {
        characterCount: 6,
        domainId: undefined,
        formality: undefined,
        glossaryId: undefined,
        sourceLang: undefined,
        sourceText: 'café 😀',
        targetLang: 'VI',
      },
      ok: true,
    });
  });

  it('rejects oversized translation text without echoing source text', () => {
    expect(
      validateTranslateTextRequest(
        {
          sourceText: 'secret source text',
          targetLang: 'EN',
        },
        { maxTextInputChars: 4 }
      )
    ).toEqual({
      error: {
        code: 'text_too_large',
        field: 'sourceText',
        message: 'Source text exceeds the configured size limit.',
      },
      ok: false,
      status: 413,
    });
  });

  it('requires explicit source language when a glossary is applied', () => {
    expect(
      validateTranslateTextRequest(
        {
          glossaryId: 'glossary-1',
          sourceText: 'hello',
          targetLang: 'FR',
        },
        { maxTextInputChars: 100 }
      )
    ).toEqual({
      error: {
        code: 'glossary_language_mismatch',
        field: 'sourceLang',
        message: 'Glossary requests require an explicit source language.',
      },
      ok: false,
      status: 400,
    });
  });

  it('sanitizes glossary entries and rejects duplicate source terms', () => {
    expect(
      validateGlossaryRequest(
        {
          entries: [
            { sourceTerm: ' Cell ', targetTerm: ' tế bào ' },
            { sourceTerm: 'cell', targetTerm: 'ô' },
          ],
          name: ' Biology ',
          sourceLang: 'en',
          targetLang: 'vi',
        },
        { maxGlossaryEntries: 10 }
      )
    ).toEqual({
      error: {
        code: 'glossary_entry_duplicate',
        field: 'entries.1.sourceTerm',
        message: 'Glossary source terms must be unique.',
      },
      ok: false,
      status: 400,
    });
  });

  it('accepts clean glossary entries with explicit language pair', () => {
    expect(
      validateGlossaryRequest(
        {
          domainId: 'medical',
          entries: [{ note: 'noun', sourceTerm: 'cell', targetTerm: 'tế bào' }],
          name: 'Medicine',
          sourceLang: 'en',
          targetLang: 'vi',
        },
        { maxGlossaryEntries: 10 }
      )
    ).toEqual({
      data: {
        domainId: 'medical',
        entries: [{ note: 'noun', sourceTerm: 'cell', targetTerm: 'tế bào' }],
        name: 'Medicine',
        sourceLang: 'EN',
        targetLang: 'VI',
      },
      ok: true,
    });
  });

  it('bounds AI chat messages and preserves only safe validation errors', () => {
    expect(
      validateAiChatRequest({
        learningLanguage: 'fr',
        messages: [{ content: ' '.repeat(2), role: 'user' }],
      })
    ).toEqual({
      error: {
        code: 'ai_message_empty',
        field: 'messages.0',
        message: 'Each AI chat message requires a supported role and content.',
      },
      ok: false,
      status: 400,
    });
  });

  it('accepts AI chat messages with default goal and stream flag', () => {
    expect(
      validateAiChatRequest({
        learningLanguage: 'fr',
        messages: [{ content: 'Bonjour', role: 'user' }],
        nativeLanguage: 'vi',
        stream: true,
      })
    ).toEqual({
      data: {
        conversationId: undefined,
        goal: 'conversation',
        learningLanguage: 'fr',
        messages: [{ content: 'Bonjour', role: 'user' }],
        nativeLanguage: 'vi',
        stream: true,
      },
      ok: true,
    });
  });

  it('rejects raw audio in voice feedback requests', () => {
    expect(
      validateVoiceFeedbackRequest({
        audio: 'base64-audio',
        transcript: 'hello',
      })
    ).toEqual({
      error: {
        code: 'voice_feedback_audio_not_supported',
        field: 'audio',
        message: 'Voice feedback accepts local transcripts only in this MVP.',
      },
      ok: false,
      status: 400,
    });
  });

  it('validates user provider connections without returning the API key in errors', () => {
    expect(
      validateUserProviderConnectionRequest({
        apiKey: 'secret\nkey',
        provider: 'openai',
        purpose: 'ai-agent',
      })
    ).toEqual({
      error: {
        code: 'provider_secret_invalid',
        field: 'apiKey',
        message: 'Provider API key is invalid.',
      },
      ok: false,
      status: 400,
    });
  });

  it('accepts user provider connection metadata for encrypted storage', () => {
    expect(
      validateUserProviderConnectionRequest({
        apiKey: ' sk-user-secret ',
        displayLabel: ' Work OpenAI ',
        provider: 'openai',
        purpose: 'ai-agent',
      })
    ).toEqual({
      data: {
        apiKey: 'sk-user-secret',
        displayLabel: 'Work OpenAI',
        scope: {
          provider: 'openai',
          purpose: 'ai-agent',
        },
      },
      ok: true,
    });
  });
});
