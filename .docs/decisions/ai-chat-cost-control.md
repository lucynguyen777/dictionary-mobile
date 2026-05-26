# Decision: AI Chat Cost Control

## Status
Accepted

## Context
AI chat and correction features need cost controls, abuse protection, privacy rules, and backend mediation before production use.

## Options
1. Backend proxy with quotas
2. User-provided API key
3. Subscription-gated AI usage
4. Local-only non-AI chat practice shell

## Decision
Choose **backend proxy with quotas** using OpenAI for AI chat, correction, and voice-transcript feedback.

All OpenAI usage must go through a backend proxy with server-side API keys, per-user limits, abuse controls, privacy policy coverage, and user-visible cost/usage boundaries.

## Consequences
- Supabase Auth Foundation and backend proxy policy are dependencies before production AI implementation.
- The app must not ship direct client-side OpenAI API keys.
- Streaming, moderation, transcript handling, retention, telemetry, and failure states must be specified before enabling real AI chat or voice feedback.

## Tasks Unblocked
- Real-time AI chatbot
- AI correction feedback
- Voice transcript feedback
- Specialized conversation practice
- Usage limits and billing UI
