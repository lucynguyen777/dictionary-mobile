# Reader Import Parser Strategy

Status: selected strategy; TXT/HTML/DOCX/EPUB prototypes are enabled, PDF remains guarded.

## Current Safe Support
- TXT: read as local plain text.
- HTML: sanitize script/style/svg content, preserve rough block breaks, and import as Reader text.
- DOCX: prototype enabled with Mammoth converting DOCX to semantic HTML before the existing sanitizer converts it into Reader text.
- EPUB: prototype enabled with local ZIP/OPF/spine parsing, chapter HTML extraction, and the existing sanitizer.

## Planned Structured Formats
- PDF: keep disabled until platform testing is done. Use `expo-pdf-text-extract` only in an Expo dev-client/native prototype for digital PDFs, and evaluate a PDF.js-style web fallback separately. Do not support scanned PDFs without an OCR decision.
- Fixture gate: see `docs/reader-pdf-fixture-gate.md` before enabling any PDF parser.
- Implementation prep: repo-owned fixtures now live in `tests/fixtures/reader-pdf/`; the PDF.js-style parser prototype is covered by fixture tests, but PDF import remains disabled until Expo web manual smoke and unsupported native/Expo Go copy are verified.

## Guardrails
- Keep PDF disabled until parser prototypes pass tests with small local samples.
- Do not send documents to a backend or external API.
- Add file size and empty-text guards before enabling any structured format.
- Preserve the current unsupported-format message path so Expo web and mobile fail safely.
- Treat Expo Go as unsupported for PDF extraction if the prototype depends on a native module.

## References Checked
- Mammoth npm package: DOCX to clean HTML, best with semantic styles.
- epubjs npm package: browser-oriented EPUB rendering/reading.
- expo-pdf-text-extract: native PDF text extraction for Expo development builds; not suitable for Expo Go and not an OCR solution.
- PDF.js-style extraction remains the likely web fallback, but needs separate bundling/performance validation.
