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

### Stage 2 — Real capture plumbing (still without OCR/STT engines)
- Implement:
  - Audio capture using `expo-av` (record audio file)
  - Image capture using `expo-image-picker` (select image) or `expo-camera` (camera preview)
- Still returns “not recognized yet” message.

Exit criteria:
- We can capture and store a local audio file and image and show preview.

### Stage 3 — Real on-device OCR (dev-client required)
- Integrate ML Kit OCR module (exact package TBD).
- Parse OCR result into:
  - full text
  - blocks/lines with bounding boxes
- UI: user taps a line/word to lookup.

Exit criteria:
- OCR returns Vietnamese/English text in basic tests.
- Works on at least one platform in dev-client.

### Stage 4 — Real on-device STT (dev-client required)
- Integrate STT module (native wrapper or Vosk).
- Return transcript + confidence/segments if possible.

Exit criteria:
- Speak a short phrase → transcript populates → lookup works.

---

## Library shortlist & decision points

### For Stage 1–2 (safe within current repo)
- `expo-av` (audio recording)
- `expo-image-picker` (image selection)
- `expo-camera` (optional; camera preview is more complex but better UX)

### For OCR Stage 3 (dev-client)
Decision needed:
- Pick **one** MLKit wrapper that is maintained and supports Expo dev-client workflows.

### For Voice Stage 4 (dev-client)
Decision needed:
- Pick native STT wrapper strategy:
  1) OS SpeechRecognizer wrappers (simpler, but variable offline behavior), or
  2) Vosk offline (heavy but privacy + offline).

---

## Testing strategy (when implementation begins)
- Unit tests:
  - Parsing/normalization of transcript/OCR text into lookup queries.
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