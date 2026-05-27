# Speech Scoring Engine Plan

## Goal

Define the pronunciation scoring gate before implementing IPA comparison, per-phoneme feedback, scoring history, or visual pronunciation guidance. This module does not accept a scoring engine; it documents current candidates, constraints, and the interface needed for a future implementation decision.

## Current Boundary

- Recording playback already exists.
- Voice/OCR recognition direction is accepted separately in `docs/voice-ocr-plan.md`.
- OS/native STT can produce transcripts, but transcript confidence is not pronunciation scoring.
- No feature should show fake IPA alignment, phoneme scores, or pronunciation grades.

## Candidate Comparison

| Candidate | Fit | Pros | Constraints | Decision |
| --- | --- | --- | --- | --- |
| Azure AI Speech Pronunciation Assessment | Cloud scoring API | Provides assessment scores and phoneme/syllable/word-level outputs through Speech SDKs. | Sends audio to cloud; needs backend/auth/cost/privacy; language coverage and SDK output shape must be verified. | Strongest first production candidate, but not accepted yet. |
| Speechace Pronunciation Scoring API | Cloud scoring API | Purpose-built pronunciation API with word/syllable/phoneme scoring endpoints. | Third-party vendor, pricing/contract/data retention must be accepted; backend upload required. | Viable comparison candidate, not accepted yet. |
| Google Cloud Speech-to-Text | Cloud STT | Strong transcription ecosystem. | Speech-to-Text docs focus on transcription, not pronunciation assessment/per-phoneme scoring. | Not sufficient for scoring by itself. |
| Montreal Forced Aligner / Kaldi-style backend | Custom backend alignment | Open-source forced alignment can produce word/phoneme timing when transcript, dictionary, and acoustic model exist. | Heavy backend pipeline, language model/dictionary management, no simple learner score out of the box. | Research candidate for custom backend, not MVP. |
| On-device/mobile-only alignment | Native/offline scoring | Best privacy if feasible. | No accepted maintained mobile scoring package; model size and language coverage are unresolved. | Blocked until a viable package/model is found. |
| Manual recording playback only | Existing fallback | No cloud, no fake scores, already honest UX. | Does not satisfy scoring/IPA comparison feature. | Keep as fallback while scoring is blocked. |

## Privacy, Cost, And Retention Constraints

- Raw learner audio is sensitive user content.
- Cloud scoring requires explicit user-facing copy that audio leaves the device.
- Raw audio upload must be opt-in per scoring attempt.
- Backend logs must not store raw audio, transcripts, phoneme rows, or provider keys by default.
- Retention default should be metadata-only: user id, language, target text hash, provider, duration, status, aggregate score, and timestamp.
- Persisting raw audio or detailed phoneme history requires a separate retention setting and account deletion behavior.
- Quota must run before provider calls; failed quota checks must not upload audio.

## Minimal Scoring Interface

Future code should hide provider details behind a small engine boundary:

```ts
type PronunciationScoringInput = {
  audioUri: string;
  targetText: string;
  languageCode: string;
  expectedIpa?: string;
  userId?: string;
};

type PronunciationScoreResult = {
  engine: 'azure' | 'speechace' | 'custom-backend';
  overallScore: number;
  accuracyScore?: number;
  fluencyScore?: number;
  completenessScore?: number;
  words: PronunciationWordScore[];
  phonemes: PronunciationPhonemeScore[];
  warnings: string[];
};
```

Rules:

- `overallScore` and phoneme rows must come from the scoring engine, not local heuristics.
- Missing phoneme output must show an unavailable state, not invented rows.
- IPA comparison is only enabled when the provider output and source-backed IPA can be aligned.
- Store aggregate scoring history only after retention policy is accepted.

## UI States

- `unavailable`: no scoring engine accepted/configured.
- `recording`: local capture in progress.
- `uploading`: raw audio is being sent to the selected backend/provider.
- `scoring`: provider/backend is processing.
- `ready`: aggregate and provider-backed details are available.
- `partial`: aggregate score exists but phoneme detail is unavailable.
- `error`: retryable provider/network/config failure.
- `privacy_blocked`: user has not accepted cloud audio processing.

## Acceptance Gate

Pronunciation scoring can move from `[!] BLOCKED` to `[ ] TODO` only after:

1. one scoring engine is accepted by decision doc status;
2. language coverage for the first target language is verified;
3. backend upload/proxy path and secret storage are defined;
4. raw-audio privacy, retention, account deletion, and quota policy are accepted;
5. fake-provider tests define scoring output mapping and unavailable states.

Until then, recording playback and OS/native STT may continue, but scoring UI must remain honest and non-production.

## Source Notes

- Azure AI Speech Pronunciation Assessment documents phoneme, syllable, word, and full-text scoring through the Speech SDK.
- Speechace exposes pronunciation scoring endpoints with word, syllable, and phoneme-level score outputs.
- Google Cloud Speech-to-Text is a transcription API and does not satisfy the pronunciation scoring requirement by itself.
- Montreal Forced Aligner is an open-source forced alignment system, useful for backend research but not a turnkey mobile scoring engine.
