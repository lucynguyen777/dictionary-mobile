# Voice Search / OCR Camera Lookup Plan

## Goal
Define a feasible architecture and a short-list of libraries for:
1. **Voice Search**: user speaks → transcript → lookup the recognized text in the existing Word screen.
2. **OCR Camera Lookup**: user points camera or picks an image → OCR text → select a word/phrase → lookup.

This document focuses on **feasibility, platform constraints (Expo Go vs dev-client), privacy**, and a staged implementation plan.

---

## Constraints & Non-Goals

### Privacy / Data policy
- Default: **do not send user audio/images/document text to external APIs**.
- If a cloud option is later introduced, it must be an explicit opt-in decision + documented data policy + cost controls.

### Expo constraints
- Expo Go often cannot use native modules that require custom builds.
- For anything requiring native dependencies (MLKit OCR, on-device ASR), expect **Expo Dev Client (development build)**.

### Non-goals in this slice
- No “real-time” continuous transcription while speaking; start with press-to-record → transcript.
- No full document OCR for scanned PDFs (already blocked in PDF docs); this is camera/image OCR only.

---

## Current codebase touchpoints
- `app/(tabs)/word.tsx`: already supports query typing + triggers remote lookup. We can reuse the same route (`/word?word=...`) after transcript/OCR selection.
- `app/(tabs)/advanced.tsx`: currently has **voice UI preview state** only (no audio capture). This can be either removed later or used as the prototype shell.
- Existing TTS is present (`expo-speech`) but **TTS is not ASR** (speech-to-text). We need dedicated STT.

---

## Architecture Overview

### Common flow (Voice + OCR)
1. Capture input (audio or image)
2. Convert to text (ASR or OCR)
3. Normalize & pick final query:
   - trim
   - keep original script (do not romanize)
   - optionally split into tokens for quick suggestions
4. Navigate to lookup:
   - `router.push({ pathname: '/(tabs)/word', params: { word: selectedText, sourceLang, targetLang } })`

### Shared “Recognition” abstraction (recommended)
Create a small abstraction layer (later code task):
- `recognition/speechToText.ts`
- `recognition/ocr.ts`
- `recognition/types.ts`

So UI screens do not directly depend on a specific library; they call a unified interface:
- `transcribeOnce(options) -> { text, confidence?, segments? }`
- `recognizeTextFromImage(options) -> { blocks/lines/text, languageHint? }`

---

## Voice Search (Speech-to-Text) Options

### Option A (Preferred for privacy): On-device STT
**Pros**
- Best privacy story (no audio leaves device).
- Potential offline usage.
**Cons**
- Heavier native integration, platform differences iOS/Android.
- Likely requires dev-client.

**Candidates**
1. **iOS Speech framework + Android SpeechRecognizer (native wrappers)**
   - Usually needs a custom native module.
   - Works with network on some devices depending on OS; “offline” is not guaranteed.
2. **Vosk (offline STT)**
   - True offline possible but models are large; integration heavy; Expo dev-client required; app size impact.

**Verdict**: Feasible but higher implementation cost + dev-client requirement.

### Option B: Cloud STT (fastest MVP, worst privacy)
Examples: Google Speech-to-Text, Azure, Whisper API.
**Pros**
- Faster to ship a working version.
- Higher accuracy.
**Cons**
- Audio leaves device; needs backend/auth/billing; must be opt-in.

**Verdict**: Blocked until product explicitly accepts cloud processing + backend.

### Option C: OS-level dictation input (lightweight)
Use a “microphone” enabled TextInput / system dictation.
**Pros**
- Minimal code; no native module.
**Cons**
- UX depends on keyboard; not consistent; not a dedicated in-app experience.

**Verdict**: Good fallback path if we must stay Expo Go compatible.

---

## OCR Camera Lookup Options

### Option A (Preferred): On-device OCR with ML Kit / Vision
**Pros**
- On-device, privacy-friendly.
- Fast enough for camera usage.
**Cons**
- Requires native module → dev-client.
- Integration differences between iOS/Android.

**Candidates**
- **Google ML Kit Text Recognition** (Android + iOS)
- iOS Vision framework (native wrapper)

**Verdict**: Best long-term approach; requires dev-client.

### Option B: JS-only OCR (Expo Go compatible but weak)
- `tesseract.js` (WebAssembly)
**Pros**
- Potentially works on web; may be made to run in React Native with difficulty.
**Cons**
- Performance/memory heavy on mobile; bundle size large; poor camera pipeline.

**Verdict**: Not recommended for mobile. Potential “web-only” experiment.

### Option C: Cloud OCR
Google Vision API, etc.
**Pros**
- Very accurate, fast to implement if backend exists.
**Cons**
- Sends images externally; backend/cost/privacy.

**Verdict**: Blocked until product decision.

---

## Recommended staged plan (Next Implementation Slices)

### Stage 0 — Planning (this task)
Deliverables:
- This document.
- Decide whether we accept dev-client requirement for MVP.

### Stage 1 — UI shells (no real recognition yet) (Expo Go compatible)
1. Add a **Voice Search** button on `Word` screen search bar
   - Opens modal with states: idle / recording / processing / ready / error.
   - Output: a hardcoded transcript to prove routing works.
2. Add an **OCR** entry point
   - Choose image from library (Expo ImagePicker) as a placeholder.
   - Output: hardcoded recognized text.

Exit criteria:
- End-to-end navigation into `/word` using the recognized string.

Status: DONE. `app/(tabs)/word.tsx` now exposes Voice and OCR entry points on the lookup surface, opens a local prototype modal, requests microphone/photo-library permission through Expo modules, and routes deterministic recognized strings into the existing lookup flow. `data/recognition.ts` keeps text normalization, suggestion splitting, and deterministic prototype outputs covered by `tests/recognition.test.ts`.

### Stage 2 — Real capture plumbing (still without OCR/STT engines)
- Implement:
  - Audio capture using `expo-audio` (record audio file)
  - Image capture using `expo-image-picker` (select image) and `expo-camera` (camera preview)
- Still returns “not recognized yet” message.

Exit criteria:
- We can capture and store a local audio file and image and show preview.

Status: DONE. The Word recognition modal now keeps a local capture preview for microphone recordings, picked library images, and camera captures. Audio previews show the local file metadata and recording duration from `expo-audio`; image previews show a thumbnail plus dimensions/file-size metadata when the picker provides it. The OCR modal also exposes the `expo-camera` preview path without replacing the existing image-library smoke flow. Capture history remains out of scope for this stage.

### Stage 3 — Real on-device OCR (dev-client required)
- Integrate ML Kit OCR module (exact package TBD).
- Parse OCR result into:
  - full text
  - blocks/lines with bounding boxes
- UI: user taps a line/word to lookup.

Exit criteria:
- OCR returns Vietnamese/English text in basic tests.
- Works on at least one platform in dev-client.

Readiness status: DONE. The app now has a package-agnostic OCR boundary in `data/ocrEngine.ts` before a native package is selected:
- stable result types for full text, blocks, lines, confidence, and normalized bounding boxes;
- `OcrEngineUnavailableError` plus `createUnavailableNativeOcrEngine()` for Expo Go/Web or non-dev-client runtimes;
- deterministic fixture OCR via `createDeterministicOcrResult()` so parsing, line selection, and lookup candidates can be tested without native OCR;
- candidate extraction with full text, line text, and token suggestions covered by `tests/ocrEngine.test.ts`;
- Word OCR modal readiness UI showing local capture previews, selectable OCR lines, confidence chips, and dev-client-gated native OCR copy.

Native OCR integration remains pending. The next implementation slice should choose and spike a maintained ML Kit/Vision wrapper in an Expo dev-client, then adapt it behind the existing `OcrEngine` interface.

### Stage 4 — Real on-device STT (dev-client required)
- Integrate STT module (native wrapper or Vosk).
- Return transcript + confidence/segments if possible.

Exit criteria:
- Speak a short phrase → transcript populates → lookup works.

---

## Library shortlist & decision points

### For Stage 1–2 (safe within current repo)
- `expo-audio` (audio recording)
- `expo-image-picker` (image selection)
- `expo-camera` (camera preview and capture)

### For OCR Stage 3 (dev-client)
Current shortlist:
1. **Google ML Kit Text Recognition wrapper for React Native**: preferred first candidate for Android+iOS on-device OCR in an Expo dev-client/custom native build.
2. **iOS Vision native bridge**: fallback candidate if the selected ML Kit wrapper is not maintained enough for the current Expo SDK, but it would need separate Android coverage.
3. **Tesseract.js**: keep as a web-only experiment candidate; do not use as the default mobile path because of performance, memory, and bundle-size risk.

Decision gate:
- Pick one maintained ML Kit wrapper, verify Expo dev-client compatibility, and prove basic English/Vietnamese OCR from a local image before adding bounding-box UI.

### For Voice Stage 4 (dev-client)
Current shortlist:
1. **`expo-speech-recognition` / OS speech recognizers**: preferred first candidate because it maps to iOS `SFSpeechRecognizer`, Android `SpeechRecognizer`, and web `SpeechRecognition`. Offline behavior is OS/device dependent, so this is privacy-friendly only when validated with the smoke matrix.
2. **Vosk via a React Native wrapper**: second candidate for true offline STT, with higher integration cost, model management, and app-size impact.
3. **Cloud STT**: still blocked unless product explicitly accepts opt-in cloud processing, backend controls, billing, and a documented data policy.

Decision gate:
- Start with an Expo dev-client spike for OS recognizers. Move to Vosk only if offline behavior is required and the model-size tradeoff is accepted.

## Manual dev-client smoke matrix

Run this before marking Stage 3 or Stage 4 implementation done:

| Platform | Flow | Expected result |
| --- | --- | --- |
| iOS dev-client | Microphone permission -> start voice capture -> stop | Local audio URI exists, duration preview appears, prototype suggestions remain selectable, lookup route opens. |
| Android dev-client | Microphone permission -> start voice capture -> stop | Local audio URI exists, duration preview appears, prototype suggestions remain selectable, lookup route opens. |
| iOS dev-client | Photo-library permission -> pick OCR image | Image thumbnail appears, dimensions/file-size metadata appears when available, prototype suggestions remain selectable, lookup route opens. |
| Android dev-client | Photo-library permission -> pick OCR image | Image thumbnail appears, dimensions/file-size metadata appears when available, prototype suggestions remain selectable, lookup route opens. |
| iOS dev-client | Camera permission -> open OCR camera -> capture | Camera preview opens, captured image preview appears, prototype suggestions remain selectable, lookup route opens. |
| Android dev-client | Camera permission -> open OCR camera -> capture | Camera preview opens, captured image preview appears, prototype suggestions remain selectable, lookup route opens. |
| iOS + Android dev-client | Airplane mode capture-only run | Stage 2 capture and preview still work without external OCR/STT network calls. |

---

## Testing strategy (when implementation begins)
- Unit tests:
  - Parsing/normalization of transcript/OCR text into lookup queries.
  - Capture-preview metadata formatting for audio and image inputs.
- Current Stage 3 readiness tests:
  - `tests/ocrEngine.test.ts`: OCR text normalization, deterministic block/line output, lookup candidate extraction, unavailable-native-engine error.
  - `tests/recognition.test.ts`: speech/OCR prototype result creation and suggestion routing.
  - `tests/recognitionCapture.test.ts`: local audio/image capture preview metadata.
- Manual smoke (required):
  - iOS dev-client: record voice → transcript; camera OCR → result.
  - Android dev-client: same.
- Privacy checks:
  - Confirm no network calls are made during OCR/STT unless explicitly enabled.

---

## Risks
- Expo Go limitations: real OCR/STT likely needs dev-client.
- App size/performance: Vosk models / OCR libs can bloat.
- Accuracy varies by language/script; may need language hints based on selected `sourceLang`.

---

## Proposed acceptance criteria for this planning task
- A clear staged plan exists with decisions explicitly marked.
- The repo stays compliant with “no OCR for scanned PDFs” until OCR decision is accepted (still true).
- `docs/product-progress.md` reflects that this planning is actively in progress and will be marked done after review/approval.
