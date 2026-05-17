# Reader Import Parser Strategy

Status: selected strategy, implementation still guarded.

## Current Safe Support
- TXT: read as local plain text.
- HTML: sanitize script/style/svg content, preserve rough block breaks, and import as Reader text.

## Planned Structured Formats
- DOCX: use Mammoth to convert DOCX to clean semantic HTML, then reuse the existing HTML-to-text sanitizer. This favors study text over exact Word layout.
- EPUB: use epub.js or equivalent ZIP/spine extraction to read chapters in book order, sanitize chapter HTML, and merge text with clear boundaries.
- PDF: keep disabled until platform testing is done. Evaluate a staged extractor for Expo native/dev-client and Expo web fallback before enabling, because PDF text extraction behaves differently across platforms.

## Guardrails
- Keep PDF/DOCX/EPUB disabled until parser prototypes pass tests with small local samples.
- Do not send documents to a backend or external API.
- Add file size and empty-text guards before enabling any structured format.
- Preserve the current unsupported-format message path so Expo web and mobile fail safely.

## References Checked
- Mammoth npm package: DOCX to clean HTML, best with semantic styles.
- epubjs npm package: browser-oriented EPUB rendering/reading.
- PDF extraction options remain platform-sensitive for Expo; prototype before product enablement.
