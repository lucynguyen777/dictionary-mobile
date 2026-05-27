# Decision: Translation API

## Status
Accepted

## Context
Production translation and specialized domain translation require a selected API, backend strategy, glossary handling, privacy policy, and cost model.

## Options
1. Google Cloud Translation
2. DeepL
3. OpenAI or LLM-based translation proxy
4. Custom translation backend

## Decision
Choose **DeepL through a backend proxy** for production translation and glossary-assisted translation.

Use OpenAI only where an LLM is intentionally needed, such as AI conversation or correction flows, and keep those calls behind the same backend proxy boundary. Do not call paid translation or AI APIs directly from the mobile app.

Foundation document: `docs/deepl-openai-backend-proxy-mvp.md`.

## Consequences
- DeepL glossary support becomes the default path for specialized translation.
- Backend proxy work must keep DeepL API keys server-side, define quota/rate limits before provider calls, redact user content from logs, and map provider errors into user-safe app states.
- DeepL v3 glossary flow should be the default for new glossary work; glossary use requires explicit source and target languages.
- Language-pair dictionary data still cannot be generated from machine translation and remains governed by source/licensing gates.

## Tasks Unblocked
- Production multilingual translation
- Specialized domain translation
- Glossary-assisted translation
- Document translation
- Translation usage controls
