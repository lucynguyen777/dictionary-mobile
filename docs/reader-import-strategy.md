# Reader Import Parser Strategy

Status: selected strategy; TXT/HTML/DOCX/EPUB prototypes are enabled, digital PDF remains guarded, and scanned PDF OCR now has a Chandra integration hook without mobile networking.

## Current Safe Support
- TXT: read as local plain text.
- HTML: sanitize script/style/svg content, preserve rough block breaks, and import as Reader text.
- DOCX: prototype enabled with Mammoth converting DOCX to semantic HTML before the existing sanitizer converts it into Reader text.
- EPUB: prototype enabled with local ZIP/OPF/spine parsing, chapter HTML extraction, and the existing sanitizer.

## Planned Structured Formats
- PDF: keep disabled by default until platform testing is done. Use the existing PDF.js-style web parser for digital PDFs behind the existing gate. Scanned/image-based PDFs can route through the injected Chandra OCR parser, but app networking remains unwired until a separate production privacy/auth/config module.
- Fixture gate: see `docs/reader-pdf-fixture-gate.md` before enabling any PDF parser.
- Implementation prep: repo-owned fixtures now live in `tests/fixtures/reader-pdf/`; the PDF.js-style parser prototype is covered by fixture tests and wired behind `READER_ENABLE_PDF=true` on Expo web, but PDF import remains disabled by default until Expo web manual smoke is verified.

## Guardrails
- Keep PDF disabled by default until parser prototypes pass tests with small local samples and manual browser smoke is verified.
- Do not send documents to a backend or external API unless a future production module explicitly wires the Chandra service with privacy/auth/config gates.
- Add file size and empty-text guards before enabling any structured format.
- Preserve the current unsupported-format message path so Expo web and mobile fail safely.
- Treat Expo Go as unsupported for PDF extraction if the prototype depends on a native module.

## References Checked
- Mammoth npm package: DOCX to clean HTML, best with semantic styles.
- epubjs npm package: browser-oriented EPUB rendering/reading.
- expo-pdf-text-extract: native PDF text extraction for Expo development builds; not suitable for Expo Go and not an OCR solution.
- PDF.js-style extraction remains the likely web fallback, but needs separate bundling/performance validation.
