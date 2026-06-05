# Chandra Reader OCR Production Wiring

This is the v1.3.8 Reader OCR production wiring note. It keeps the existing Reader/PDF/OCR architecture and only fixes the production request boundary between Reader import and the standalone Chandra service.

## Runtime Boundary

- Digital PDFs still run through the existing PDF text parser first.
- Digital PDFs are never sent to Chandra.
- Image-based/scanned PDFs route to Chandra only when `EXPO_PUBLIC_CHANDRA_OCR_URL` is configured.
- If the endpoint is missing, Reader import keeps the existing clear error: scanned PDFs need a Chandra OCR backend.
- Camera OCR stays separate and remains MLKit/dev-client gated.

## Request Contract

The app sends scanned PDFs to:

```text
POST {EXPO_PUBLIC_CHANDRA_OCR_URL}/ocr/pdf
Content-Type: application/json
Accept: application/json
```

Body:

```json
{
  "fileBase64": "BASE64_PDF_BYTES",
  "fileName": "scan.pdf"
}
```

The backend service in `backend/chandra-service/` expects this JSON shape through its `OcrRequest` model. Earlier raw-PDF-byte POST behavior is not compatible with that service and is no longer used.

## Size And Failure Behavior

- Reader keeps the app-level 50MB import limit before OCR.
- The Chandra service has its own `CHANDRA_MAX_INPUT_BYTES` limit. Set it high enough for the intended scanned-PDF smoke, or keep smaller files for beta.
- Backend `413` becomes a file-size-specific user error.
- Other provider failures stay explicit and do not create empty Reader documents.

## Smoke Checklist

1. Configure `EXPO_PUBLIC_CHANDRA_OCR_URL` in an uncommitted local env or Vercel env.
2. Confirm `GET /health` on the Chandra service returns OK.
3. Import a digital PDF: it should use the existing parser and must not call Chandra.
4. Import a scanned/image-only PDF: it should call `/ocr/pdf`, create normal Reader text, then support highlight, lookup, save word, note, and flashcard.
5. Import while endpoint is missing: copy should say Chandra/OCR backend is required.
6. Import an oversized file: app-side 50MB guard or backend `413` should show a size-specific error.
