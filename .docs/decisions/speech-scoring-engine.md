# Decision: Speech Scoring Engine

## Status
Proposed

## Context
Pronunciation scoring needs a reliable speech or phoneme alignment engine. The app should not fake IPA comparison, phoneme-level feedback, or scoring without a real engine.

## Options
1. Cloud speech scoring API
2. On-device speech recognition/alignment library
3. Custom backend speech pipeline
4. Manual recording playback only

## Decision
No scoring engine is accepted yet.

Related recognition decisions are accepted separately: OCR should proceed with an MLKit Text Recognition wrapper, and STT should proceed with OS/native speech recognizers after dev-client validation. These decisions do **not** unblock IPA comparison, phoneme-level alignment, or pronunciation scoring.

## Consequences
- Pronunciation scoring remains blocked until a real scoring/alignment engine is selected.
- Recording playback and STT transcript lookup may continue without presenting fake phoneme scores.
- Any future scoring option must define cost, privacy, latency, offline support, accuracy, language coverage, and audio retention policy.

## Tasks Unblocked
- IPA comparison
- Phoneme-level scoring
- Pronunciation feedback table
- Speech practice score history
- Visual pronunciation guidance
