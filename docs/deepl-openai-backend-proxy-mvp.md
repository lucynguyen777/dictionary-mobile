# DeepL + OpenAI Backend Proxy MVP

## Goal

Define the backend proxy contract before enabling production translation, glossary-assisted translation, AI conversation, or voice feedback. This module does not implement API calls; it keeps paid provider keys server-side and makes future code modules decision-complete.

## Dependencies

- Supabase Auth Foundation: `docs/supabase-auth-foundation.md`.
- Supabase backend/cloud boundary: `docs/supabase-cloud-sync-mvp.md`.
- Translation decision: `.docs/decisions/translation-api.md`.
- AI cost-control decision: `.docs/decisions/ai-chat-cost-control.md`.

## Provider Direction

- Use DeepL for production text translation and glossary-assisted specialized translation.
- Use OpenAI for AI chat, writing correction, conversation practice, and voice-transcript feedback.
- Keep all provider keys in the backend environment. Mobile/web clients must never receive DeepL or OpenAI API keys.
- Do not use machine translation output as dictionary data, lexical source data, etymology, or monolingual definitions.

## Backend Proxy Environment Policy

Required backend-only env vars:

- `DEEPL_API_KEY`
- `DEEPL_API_BASE_URL` with allowed values `https://api.deepl.com` or `https://api-free.deepl.com`
- `OPENAI_API_KEY`
- `OPENAI_TEXT_MODEL`
- `OPENAI_REALTIME_MODEL` only if realtime voice is enabled

Optional backend env vars:

- `PROXY_MONTHLY_CHARACTER_LIMIT_PER_USER`
- `PROXY_DAILY_AI_REQUEST_LIMIT_PER_USER`
- `PROXY_DAILY_TRANSLATION_CHARACTER_LIMIT_PER_USER`
- `PROXY_MAX_TEXT_INPUT_CHARS`
- `PROXY_MAX_GLOSSARY_ENTRIES`
- `PROXY_LOG_RETENTION_DAYS`

Rules:

- Secret keys must never be committed, bundled into Expo apps, or returned to the client.
- Missing env vars must return `503 provider_unconfigured` with safe user copy.
- Backend logs must redact source text, translated text, prompts, transcripts, glossary entries, and provider keys by default.
- Usage logging should store metadata only: user id, feature, provider, character count, token estimate or provider usage when available, status, error code, and timestamps.

## Proxy Routes

All routes require an authenticated Supabase session unless explicitly documented as a local-only preview.

| Route | Purpose | Provider |
| --- | --- | --- |
| `POST /proxy/translate/text` | Translate plain text with optional glossary/domain metadata. | DeepL |
| `POST /proxy/translate/glossaries` | Create or update a user glossary record and provider glossary when supported. | Supabase + DeepL |
| `GET /proxy/translate/glossaries` | List user glossary metadata without dumping entries by default. | Supabase |
| `POST /proxy/ai/chat` | Non-realtime AI conversation and correction with streaming text response. | OpenAI Responses |
| `POST /proxy/ai/voice-feedback` | Feedback on user transcript or local STT text, not raw pronunciation scoring. | OpenAI Responses |
| `POST /proxy/ai/realtime-session` | Optional future route that creates a short-lived realtime session/token. | OpenAI Realtime |
| `POST /proxy/translation-datasets/import` | Parse and validate user-uploaded specialized translation datasets. | Supabase + parser pipeline |
| `PATCH /proxy/translation-datasets/:id` | Edit dataset metadata, entries, and validation states. | Supabase |
| `POST /proxy/translation-datasets/:id/highlight` | Detect dataset terms/phrases in source text and return highlight spans. | Supabase + local matcher |
| `POST /proxy/translation-agents` | Create a dataset-grounded context agent, capped at 3 active agents per user by default. | Supabase + OpenAI |
| `POST /proxy/translation-agents/:id/run` | Run translation/AI assistance with retrieved dataset context. | OpenAI Responses + DeepL |

## Quota And Rate Limit Model

Track quota per Supabase user id and feature:

- DeepL text translation: count source text Unicode code points before request and reconcile with provider usage where available.
- DeepL document translation: out of MVP; document files require separate file-size, retention, and deletion policy.
- AI chat/correction: count requests, approximate prompt/output token budget, model, and streaming duration.
- Realtime voice: out of first MVP unless an explicit realtime session module is selected; must use short-lived session credentials and tighter per-minute limits.

Default MVP limits should be conservative and configurable through backend env vars. When limits are exceeded, return `429 quota_exceeded` with remaining reset time and do not call the provider.

## DeepL Translation And Glossary Contract

### Text Translation

Request fields:

- `sourceText`: non-empty string, trimmed, max length set by backend config;
- `sourceLang`: explicit DeepL source language code when a glossary is used;
- `targetLang`: DeepL target language code;
- `domainId`: optional UI domain label;
- `glossaryId`: optional app glossary id owned by the user;
- `formality`: optional only when target language supports it.

Response fields:

- `translatedText`;
- `detectedSourceLanguage`;
- `provider`: `deepl`;
- `providerRequestId` when available;
- `characterCount`;
- `glossaryApplied`: boolean;
- `warnings`: unsupported glossary, unsupported language pair, quota nearing limit, or fallback reason.

Failure states:

- `provider_unconfigured`;
- `unsupported_language_pair`;
- `glossary_language_mismatch`;
- `glossary_not_ready`;
- `text_too_large`;
- `quota_exceeded`;
- `provider_rate_limited`;
- `provider_error`.

### Glossary Persistence

Store user glossary metadata and entries in Supabase before creating provider glossaries:

- `user_glossaries`: `id`, `user_id`, `name`, `domain_id`, `source_lang`, `target_lang`, `provider`, `provider_glossary_id`, `entry_count`, `created_at`, `updated_at`, `deleted_at`.
- `user_glossary_entries`: `id`, `user_id`, `glossary_id`, `source_term`, `target_term`, `note`, `created_at`, `updated_at`, `deleted_at`.

Rules:

- Use DeepL v3 glossary endpoints for new glossary work.
- A glossary can only be applied when both source and target languages are explicit.
- Entries must be sanitized: no empty terms, no tabs/newlines/control characters, trim whitespace, enforce byte limits, dedupe source terms per language pair.
- If provider glossary creation fails, keep the local Supabase glossary draft and show `glossary_not_ready`.
- Glossaries are learning/translation aids, not dictionary source data.

## Specialized Translation Dataset Agents

This feature is a staged module on top of the proxy foundation. In the MVP, "training an agent" means creating a dataset-grounded/RAG context agent. It does **not** fine-tune an OpenAI model or create a custom model per user.

### Dataset Upload Contract

Accepted dataset formats:

- CSV/TSV;
- XLS/XLSX;
- TXT;
- Markdown;
- JSON;
- DOCX;
- text-extractable PDF.

Out of scope:

- scanned PDF extraction;
- OCR-only documents;
- images;
- audio/video;
- arbitrary code execution from uploaded files.

Scanned PDFs and image-based extraction must wait for the OCR pipeline and a separate privacy/retention decision.

### Editable Dataset Model

Dataset entries should support:

- `sourceText`;
- `targetText`;
- `type`: `term`, `phrase`, `sentence`, `paragraph`, or `note`;
- `domainId`;
- `tags`;
- `confidence`;
- `sourceDocumentId`;
- duplicate, empty, conflict, and validation states;
- timestamps and soft delete.

Users must be able to edit dataset rows/segments directly before the data is used for translation or AI context. Revision history should preserve enough metadata for undo/audit, but full row history retention is a backend storage/cost decision before production implementation.

### Smart Recognition And Highlighting

The dataset matcher should:

- detect exact and normalized term/phrase matches in source text;
- prefer longest phrase matches when spans overlap;
- return highlight spans, terminology chips, missing translation warnings, and conflict states;
- suggest glossary candidates from repeated terms;
- avoid sending raw source text to OpenAI when local matching is sufficient.

### Per-User Context Agents

Default product rule:

- `maxAgentsPerUser = 3` active context agents.

Each agent is bound to:

- one or more user-owned datasets;
- a topic/domain;
- a system instruction;
- retrieval settings;
- usage counters;
- active/archived state.

Future extra agents require a paid package/add-on decision. Billing, top-up packages, and purchasable extra agents are out of scope for this MVP foundation.

The current paid-agent option matrix is prepared in `docs/current-decision-options.md`. Until the product owner accepts a billing provider and entitlement contract, the default limit stays at `maxAgentsPerUser = 3`.

### Editor Environment Modes

The editor should support mode-specific import/export boundaries:

- Word-like rich text;
- Google Docs-like collaborative-ready surface;
- LaTeX;
- Markdown;
- plain text.

MVP implementation can start with local editor modes and explicit unsupported states for collaboration, advanced Word layout fidelity, LaTeX compilation, or Google Docs live sync. Do not execute LaTeX or remote document macros inside the app.

### Dataset Agent Tables

Recommended Supabase tables:

- `translation_datasets`;
- `translation_dataset_entries`;
- `translation_dataset_documents`;
- `translation_context_agents`;
- `translation_agent_usage_events`.

Every table must enable RLS and scope rows with `auth.uid() = user_id`.

### Dataset Agent Gate

Production implementation can start only after a staged code module defines:

- parser fixtures for each accepted format;
- storage limits and upload size limits;
- row/entry validation;
- term highlighting tests with overlapping phrases;
- `maxAgentsPerUser = 3` enforcement;
- fake OpenAI/DeepL proxy tests proving no provider key leakage and no raw dataset logging by default.

## OpenAI AI Chat And Voice-Feedback Contract

### AI Chat

Use the OpenAI Responses API through the backend for non-realtime chat and correction.

Request fields:

- `conversationId`: optional app conversation id;
- `messages`: bounded recent user/assistant turns;
- `learningLanguage`;
- `nativeLanguage`;
- `goal`: conversation, correction, explanation, or roleplay;
- `stream`: boolean.

Response behavior:

- Streaming uses server-sent events or equivalent backend streaming from server to client.
- Persist only conversation metadata by default; message retention requires explicit user-facing setting.
- Output should stay in learning context and avoid presenting AI output as source-backed dictionary data.
- Moderation/safety checks should run before provider call and on final output when practical; streaming output needs extra guardrails because partial output is harder to moderate.

### Voice Feedback

The first voice-feedback MVP consumes a transcript from local/OS STT or user text. It must not claim pronunciation scoring.

Request fields:

- `transcript`;
- `targetPhrase` or prompt;
- `learningLanguage`;
- `feedbackMode`: fluency, grammar, vocabulary, or pronunciation_copy_only.

Response fields:

- `summary`;
- `corrections`;
- `suggestedReply`;
- `practiceTips`;
- `disclaimer` when transcript quality is uncertain.

Rules:

- Do not upload raw audio in this MVP.
- Do not produce IPA/per-phoneme scores.
- Realtime speech-to-speech requires a separate implementation module with ephemeral credentials, per-minute quota, and retention copy.

## Privacy And Retention

- User text, glossary entries, prompts, transcripts, and AI outputs are user content.
- Backend logs should not store user content unless a debug mode is explicitly enabled for development and never in production by default.
- OpenAI API data is not used to train models by default unless explicitly opted in, but abuse monitoring/application-state retention depends on endpoint and org/project settings.
- DeepL usage counts source characters; text/document usage should be exposed to users only as approximate app quota unless provider usage API is integrated.
- Account deletion must delete user glossary metadata, proxy usage events, persisted AI conversation metadata/messages if enabled, and any provider glossary ids the backend owns.

## Minimal Data Tables

Recommended Supabase tables for proxy MVP:

- `proxy_usage_events`: user id, feature, provider, request id hash, input size, output size or estimate, status, error code, created at.
- `user_glossaries`: user-owned glossary metadata.
- `user_glossary_entries`: user-owned glossary entries.
- `ai_conversations`: optional conversation metadata only.
- `ai_messages`: optional; disabled by default unless retention UX is implemented.
- `translation_datasets`: user-owned dataset metadata for specialized translation context.
- `translation_dataset_entries`: editable user terms, phrases, segments, translations, notes, tags, confidence, validation state, and soft deletes.
- `translation_dataset_documents`: uploaded document metadata and extracted text chunks.
- `translation_context_agents`: per-user dataset-grounded agents, capped at 3 active agents by default.
- `translation_agent_usage_events`: metadata-only usage accounting for agent runs.

Every table must enable RLS and scope rows with `auth.uid() = user_id`.

## Implementation Gate

Translation/AI code can start when the next module agrees to:

- implement backend routes with server-side provider keys;
- add RLS-protected Supabase tables for usage and glossaries;
- add quota checks before provider calls;
- add redacted logging and structured provider error mapping;
- keep all frontend AI/translation shells graceful when proxy env vars are missing;
- add tests for quota rejection, unsupported language pairs, glossary validation, provider error mapping, streaming event handling, and no-key leakage.
- for dataset agents, add parser, validation, highlighting, max-agent-limit, and no-raw-dataset-log tests before production use.

## Test Expectations

- Unit tests for request validation and glossary sanitizer.
- Unit tests for quota accounting and limit rejection before provider calls.
- Fake-provider tests for DeepL translation success, glossary mismatch, rate limit, and provider failure.
- Fake-provider tests for OpenAI streaming events, moderation rejection, provider timeout, and no raw-audio voice feedback.
- UI smoke for Advanced AI Chat and Specialized Translation tabs with unconfigured, loading, success, quota exceeded, and provider error states.
- Dataset-agent tests for CSV/TSV/XLSX/Markdown/JSON/DOCX/text-PDF fixtures, editable row validation, overlapping phrase highlighting, and max-3 active agent enforcement.

## Source Notes

- DeepL usage limits count translated source text characters and set request/document size limits.
- DeepL v3 glossary endpoints support multilingual glossaries; glossary use in translation requires explicit source and target languages.
- OpenAI Responses API is the recommended text generation interface for new projects and supports streaming semantic events.
- OpenAI Realtime API supports low-latency multimodal voice/text sessions, but client connections should use short-lived credentials and separate cost controls.
- OpenAI data controls state that API data is not used for model training by default unless explicitly opted in, while retention varies by endpoint and project settings.
- OpenAI safety best practices recommend moderation and adversarial testing; streaming increases moderation complexity.
