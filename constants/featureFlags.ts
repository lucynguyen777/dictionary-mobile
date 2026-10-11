// Build-time switches. Expo inlines EXPO_PUBLIC_* only for direct property access.
//
// Voice search and camera OCR stay muted in production until they pass the dev-client smoke on real
// devices (docs/dev-client-smoke-matrix.md). The EAS `development` profiles turn this on.
export const NATIVE_RECOGNITION_ENABLED = process.env.EXPO_PUBLIC_ENABLE_NATIVE_RECOGNITION === 'true';

// Native PDF import runs pdf.js in a hidden WebView; same smoke gate as above.
export const NATIVE_PDF_IMPORT_ENABLED = process.env.EXPO_PUBLIC_READER_ENABLE_NATIVE_PDF === 'true';
