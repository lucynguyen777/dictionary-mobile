# Decision: Speech Scoring Engine

## Status
Accepted

## Context
Pronunciation scoring needs a reliable speech or phoneme alignment engine. The app should not fake IPA comparison, phoneme-level feedback, or scoring without a real engine.

## Options
1. Azure AI Speech Pronunciation Assessment
2. Speechace Pronunciation Scoring API
3. Custom MFA/Kaldi-style backend pipeline
4. Manual recording playback only

## Decision
Use **Azure AI Speech Pronunciation Assessment** as the first pronunciation scoring engine.

Related recognition decisions are accepted separately: OCR should proceed with an MLKit Text Recognition wrapper, and STT should proceed with OS/native speech recognizers after dev-client validation. These decisions do **not** unblock IPA comparison, phoneme-level alignment, or pronunciation scoring.

Foundation document: `docs/speech-scoring-engine-plan.md`.
Current option matrix: `docs/current-decision-options.md`.

## Consequences
- Pronunciation scoring can move into a staged implementation-planning module for Azure-backed scoring.
- Recording playback and STT transcript lookup may continue without presenting fake phoneme scores.
- Implementation still requires backend upload/proxy design, Azure Speech credentials, quota checks, privacy copy, audio retention policy, account deletion behavior, first-language coverage smoke, and fake-provider tests.
- Speechace is deferred as the specialist API fallback if Azure output quality, language coverage, pricing, or latency is not acceptable.
- Google Cloud Speech-to-Text and OS/native STT remain insufficient by themselves because transcription confidence is not pronunciation scoring.
- Montreal Forced Aligner or Kaldi-style alignment remains a custom backend research path, not a mobile MVP scoring engine.
- Cloud audio processing is accepted only for explicit pronunciation scoring attempts; raw audio must not be uploaded silently or logged by default.

## Tasks Unblocked
- Azure pronunciation scoring implementation planning
- Backend-mediated scoring upload/proxy contract
- Fake Azure scoring client tests
- Pronunciation feedback table using provider-backed rows
- Speech practice score history with metadata-only default retention
