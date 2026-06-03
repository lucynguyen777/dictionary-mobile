# Chandra OCR Integration Audit

## Scope
This audit covers adding Chandra OCR for image-based PDFs, scanned books, research papers, and lecture slides. It does not replace the existing camera OCR path, which remains MLKit-oriented and dev-client gated.

Reference checked: `https://github.com/datalab-to/chandra`. Chandra OCR 2 converts images and PDFs into structured Markdown/HTML/JSON, supports 90+ languages, and exposes CLI/local/vLLM inference modes. Its code is Apache-2.0, while model weights have separate OpenRAIL-style commercial constraints that must be reviewed before production use.

## Current OCR Architecture
- `data/ocrEngine.ts` owns the OCR boundary. The app already has `OcrEngine`, `OcrEngineResult`, `OcrTextBlock`, `OcrTextLine`, normalized bounding boxes, deterministic fixture output, lookup candidate extraction, and `OcrEngineUnavailableError`.
- `data/ocr.ts` is a thin convenience layer over the engine boundary. It runs a supplied engine or deterministic fixture and exports the stable OCR types.
- `data/recognition.ts` converts OCR results into `RecognitionPrototypeResult` so the Word screen can show selected OCR lines/tokens without importing native OCR packages.
- `data/recognitionCapture.ts` owns local capture preview metadata for camera/library images and microphone recordings.
- Existing OCR tests cover normalization, deterministic block/line output, candidate extraction, unavailable-native behavior, and recognition suggestions.

## Existing Contracts
- OCR input is currently `{ imageUri, languageCode }`.
- OCR output must be `OcrEngineResult`:
  - `text`
  - `languageCode`
  - optional `imageUri`
  - `blocks[]` and nested `lines[]`
  - optional confidence and bounding boxes
  - `engine: 'deterministic-fixture' | 'native'`
- Any provider must sit behind this contract. Screens should not import Chandra, MLKit, vLLM, or service-specific types directly.

## Existing Reader Pipeline
- `app/reader.tsx` uses `DocumentPicker`, identifies the import format with `getReaderImportFormat()`, then calls `extractReaderDocument()` for DOCX/EPUB/PDF or `extractReaderText()` for TXT/HTML.
- Imported content is stored through `importReaderText()` from `data/readerStore.ts`.
- Once imported, Reader tokenization/highlight flows already support:
  - selecting text,
  - lookup routing,
  - saving words/phrases,
  - quick notes,
  - flashcard creation.
- Therefore Chandra output should become normal Reader text/Markdown-derived text before entering `importReaderText()`.

## Existing PDF Import Pipeline
- `data/readerImport.ts` has a PDF.js-style parser behind `READER_ENABLE_PDF=true` and `EXPO_OS=web`.
- Digital PDFs are parsed with `extractPdfReaderText()`.
- `extractPdfReaderDocument()` wraps parser output into `{ title, content, sourceFormat: 'pdf' }`.
- Image-only/scanned PDFs currently produce empty text and throw the standard empty-document error.
- `tests/readerImport.test.ts` already has digital, empty, and scanned-image fixtures.

## Integration Points
- Add Chandra as an OCR provider adapter under `data/providers/` while preserving `OcrEngine`.
- Add an OCR provider registry so MLKit and Chandra can be selected by config without changing UI code.
- Add a PDF classification step in `data/readerImport.ts`:
  - run the existing digital parser first;
  - if text exists, classify as digital and do not OCR;
  - if text is empty and an OCR parser is supplied, classify as image-based/scanned and convert Chandra Markdown/text to normal Reader content;
  - if no OCR parser is supplied, keep the existing empty-document failure.
- Keep `app/reader.tsx` unchanged for now unless a later module explicitly wires mobile/web networking and privacy copy.
- Create `backend/chandra-service/` as a standalone service with `/ocr/image` and `/ocr/pdf`, but do not connect it to the mobile app in this module.

## Refactoring Risks
- Contract drift: adding PDF-specific interfaces to `OcrEngine` would fork the architecture. Mitigation: keep Chandra image OCR on `OcrEngine` and pass document OCR through Reader import parser hooks.
- Accidental cloud upload: scanned PDFs can contain sensitive notes or research documents. Mitigation: no default mobile networking; Chandra OCR must be explicitly injected/configured later with privacy and auth gates.
- Digital PDF regression: OCRing digital PDFs would be slower and less accurate for selectable text. Mitigation: always run existing PDF text extraction first and only call OCR when it returns empty text.
- DoS/memory risk: PDFs/images can be large. Mitigation: keep the existing 10MB Reader import cap and add backend service request-size limits/timeouts.
- Licensing risk: Chandra code and model weights have different licenses. Mitigation: keep service setup documented and require model-license review before production.
- Reader feature duplication: adding special scanned-PDF Reader UI would risk breaking highlight/save/flashcard parity. Mitigation: Chandra output enters the same Reader document model as existing imports.
