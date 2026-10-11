# Dev‑Client Smoke Test Matrix

Voice search and camera OCR are built and covered by automated tests, but they stay muted in production until this matrix passes on real devices. They are enabled only in builds with `EXPO_PUBLIC_ENABLE_NATIVE_RECOGNITION=true`, which the EAS `development` and `development-simulator` profiles set:

```bash
npm run build:ios:development      # or build:android:development
npm run start:dev-client
```

Automated coverage (no device needed):

- `tests/voiceSearch.test.ts`: permission granted/denied/denied-forever, unavailable engine, partial and final transcripts, silence, cancel, offline on-device request and offline errors.
- `tests/cameraOcrLookup.test.ts`: unavailable engine (camera never opens), cancel, denied permission, blank image, engine failure, word candidates.
- `e2e/native-recognition-flag.spec.js`: Expo web with the flag on; scripted Web Speech recognizer → lookup, no recognizer → honest message, OCR → "no on-device recognizer" on web. Run with `RECOGNITION_BASE_URL=<dev server started with the flag>`.

## Voice Search (`expo-speech-recognition`)

| Step | Action | Expected result |
|------|--------|----------------|
| 1 | Open **Word**, focus the search box, tap **Voice**. | Sheet opens; first time, the OS asks for microphone and speech-recognition permission. |
| 2 | Say "hello" (English) / "xin chào" (Vietnamese source). | Live transcript appears; on finish, word chips appear (whole phrase first). |
| 3 | Tap a chip. | Sheet closes and the word is looked up in the current source language. |
| 4 | Tap **Voice**, stay silent. | "Không nghe thấy giọng nói…" with **Nói lại**. |
| 5 | Deny permission, then retry; then deny permanently (Android "Don't ask again" / iOS Settings off). | First: "Cần quyền micro…". Permanently: message points to Settings. App stays usable. |
| 6 | Airplane mode, source language with an installed offline model (iOS: on-device dictation; Android: offline speech pack). | Recognition works on-device. |
| 7 | Airplane mode, language without an offline model. | Offline-specific message, no crash. |
| 8 | Tap **Đóng** while listening. | Recognition stops; no error shown; no lookup. |

## Camera OCR (`expo-image-picker` + MLKit)

| Step | Action | Expected result |
|------|--------|----------------|
| 1 | Tap **OCR** → **Chụp ảnh**. | Camera permission prompt (first time), camera opens. |
| 2 | Photograph printed text, crop to a line or word, confirm. | Spinner, then word chips from the recognized text. |
| 3 | Tap a chip. | Lookup runs for that word. |
| 4 | **Chọn ảnh** from the library with a screenshot of text. | Same as above. |
| 5 | Photo with no text. | "Không tìm thấy chữ trong ảnh…" |
| 6 | Cancel the camera / picker. | Back to the sheet, no message. |
| 7 | Deny camera or photo permission. | Permission message; permanently denied points to Settings. |
| 8 | Airplane mode. | OCR still works (MLKit runs on-device). |
| 9 | Non-Latin source (Japanese, Korean, Hindi). | Record result: the bundled MLKit model is Latin-script; other scripts may need additional MLKit models before enabling them. |

## Native PDF import (hidden WebView + pdf.js)

Enabled by `EXPO_PUBLIC_READER_ENABLE_NATIVE_PDF=true` (development profiles). The extraction page is covered in Chromium by `e2e/pdf-webview-extraction.spec.ts` and the bridge by `tests/pdfWebViewExtraction.test.ts`.

| Step | Action | Expected result |
|------|--------|----------------|
| 1 | Training → Reader library → import `tests/fixtures/reader-pdf/digital-simple.pdf` (copy to the device). | Document opens in Reader with its text. |
| 2 | Import a 20+ page digital PDF. | Text of all pages, no freeze; under 2 minutes. |
| 3 | First import with airplane mode on (pdf.js not yet cached). | "Cần kết nối mạng lần đầu để tải bộ đọc PDF…"; app stays usable. |
| 4 | Import a scanned PDF. | Routed to Chandra OCR when configured, otherwise the scanned-PDF message. |

## Sign-off

Record device model, OS version, build number and results per step. When every step passes on one iOS and one Android device, turn the flag on for `preview`/`production` in `eas.json` and update `docs/product-progress.md`.
