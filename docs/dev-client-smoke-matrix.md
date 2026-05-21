# Dev‑Client Smoke Test Matrix

## Voice Search (STT) – Prototype

| Step | Action | Expected Result | Notes |
|------|--------|----------------|-------|
| 1 | Open the **Word** screen. | UI loads without errors. | |
| 2 | Tap **Voice** button. | Recognition modal opens, microphone permission requested if not granted. | |
| 3 | Speak a simple word (e.g., "hello"). | Status shows **recording**, then **processing**, and result text appears. | Verify language matches source language. |
| 4 | Press **Use Text** on the result. | Word entry updates to the recognized text and lookup triggers. | |
| 5 | Cancel the modal at any stage. | Modal closes, no side‑effects. | |

## OCR – Capture Preview

| Step | Action | Expected Result | Notes |
|------|--------|----------------|-------|
| 1 | Open the **Word** screen. | UI loads. | |
| 2 | Tap **OCR** button. | Camera preview appears. | |
| 3 | Capture a clear image of printed text. | Preview closes, OCR processing starts, result appears in the prototype modal. | |
| 4 | Press **Use Text** on OCR result. | Word entry updates with the OCR text and lookup runs. | |
| 5 | Cancel preview or modal. | No changes to the entry. | |

### General
- Verify that both flows work on **iOS**, **Android**, and **Expo web** (when PDF gate is enabled for OCR). 
- Record any permission prompts and ensure they can be granted.
- Log any crashes or unexpected UI states.

*This matrix is intended for manual execution by developers using the Expo dev‑client.*
