# Reader PDF Extraction Fixture Gate

## Status
PDF remains disabled. This gate defines the minimum fixture and platform evidence required before adding a PDF parser to `data/readerImport.ts`.

Implementation preparation now lives in `docs/reader-pdf-implementation-prep.md`.

## Current Reader Import State
- TXT, HTML, DOCX, and EPUB are enabled through local parsing paths.
- PDF is detected by `getReaderImportFormat()` but still routes to the unsupported-format message.
- `readerImportPlans.pdf.nextStep` must continue to say PDF is disabled until this gate is satisfied.
- Scanned PDFs are out of scope until an OCR decision exists.

## Required Fixtures
Use small local files committed only if licensing and file size are acceptable. If binary fixtures are too large or license-unclear, keep them outside the repo and document their checksums.

| Fixture | Purpose | Acceptance |
|---------|---------|------------|
| `digital-simple.pdf` | One-column digital text PDF | Extracts title/body text in reading order with no OCR dependency. |
| `digital-multiline.pdf` | Multi-paragraph text with line wraps | Preserves paragraph breaks well enough for Reader display. |
| `digital-columns.pdf` | Two-column or layout-heavy PDF | Either extracts readable text or returns a clear unsupported/layout warning. |
| `scanned-image.pdf` | Image-only scanned PDF | Must remain unsupported with OCR-required messaging. |
| `empty.pdf` | Valid PDF with no extractable text | Throws the existing empty-text error path. |
| `oversize.pdf` | Larger than 10MB | Throws the existing 10MB size-limit error before parsing. |

The small fixtures except `oversize.pdf` are committed in `tests/fixtures/reader-pdf/` and can be regenerated with `node scripts/create-reader-pdf-fixtures.mjs`.

## Platform Matrix
| Platform | Parser candidate | Required result before enabling |
|----------|------------------|---------------------------------|
| Expo dev-client native | `expo-pdf-text-extract` or equivalent native module | Digital fixtures pass locally; Expo Go unsupported state is explicit. |
| Expo web | PDF.js-style extraction | Digital fixtures pass without unacceptable bundle/performance cost. |
| Expo Go | None | PDF stays disabled if native module is required. |

## Parser Contract
A future PDF parser must return the same shape as existing structured imports:

```ts
type ReaderImportResult = {
  title: string;
  content: string;
  sourceFormat: 'pdf';
};
```

It must also preserve current guards:
- reject files larger than `MAX_READER_FILE_SIZE_BYTES`;
- reject empty extracted text with `Tài liệu trống hoặc không thể trích xuất văn bản hợp lệ.`;
- never send document content to a backend or external API;
- keep scanned/OCR flows blocked until the OCR product decision is accepted.

## Test Requirements
- Extend `tests/readerImport.test.ts` only after a parser implementation exists.
- Add fixture-driven tests for simple digital extraction, empty text, scanned unsupported behavior, and size limits.
- Keep existing TXT/HTML/DOCX/EPUB tests passing.

## Manual Smoke Path
1. Import each fixture through Reader on Expo web.
2. Import each fixture through a native dev-client build if using a native parser.
3. Confirm unsupported/error copy is visible for scanned, empty, oversized, or platform-blocked PDFs.
4. Confirm no PDF option appears as fully supported until both test and manual fixture evidence exist.

## Decision Gate
Do not implement or enable PDF extraction until:
- at least one digital PDF fixture is available for the target platform;
- parser behavior is deterministic enough for Reader text display;
- Expo Go/dev-client/web support boundaries are documented in UI copy;
- OCR remains explicitly blocked.
