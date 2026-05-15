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
Chosen option.

## Consequences
Cost, security, implementation complexity, privacy, latency, offline support, accuracy, language coverage, and audio retention policy.

## Tasks Unblocked
- IPA comparison
- Phoneme-level scoring
- Pronunciation feedback table
- Speech practice score history
- Visual pronunciation guidance
