# Current Product State

## Source Of Truth
Use `docs/product-progress.md` as the canonical roadmap and checklist.

## Completed Or Existing Areas
- Dictionary lookup for English, Vietnamese, and French baselines.
- Adapter registry with `en`, `vi`, `fr`, `minhqnd`, and `wiktapi` adapters.
- Local library with folders, saved words, notes, tags, favorites, folder colors, color notes, duplicate folder, folder sorting/view modes, and folder share/export actions.
- Flashcards with card types, review states, and SM-2 scheduling fields.
- CSV/TSV import with row/column orientation, custom field mapping, primary field, preview, validation, tags, and duplicate handling.
- Export formats: CSV, Excel-compatible `.xls`, Anki TSV, and full local JSON backup.
- Reader for TXT/HTML imported local content.
- Reader settings for font size, font family, and background color.
- Profile store with local profile, language, level, goal, timezone, daily goal, and app lock fields.
- Privacy/support UI shells and local data reset/export flows.
- Advanced Export tab polish with folder selection, CSV/Excel/Anki text actions, blocked Google Sheets state, and per-session export status/history.
- Polished profile settings sidebar with compact navigation rows, safer text truncation, section headers, disabled coming-soon actions, and destructive styling.
- Local notification preferences persisted in the profile store with privacy sidebar controls for daily reminders, review reminders, weekly summaries, and reminder time.

## Current Queue Notes
`docs/product-progress.md` currently includes `Next Work Queue` items for:
- EPUB Reader import prototype with spine/chapter HTML extraction while PDF remains disabled.
- Language selector and bilingual English-Vietnamese flow stabilization.
- Spanish monolingual baseline planning.
- Malay monolingual baseline planning.
- Swahili monolingual baseline planning.

If DONE items appear in `Next Work Queue`, use `product-progress-manager` to clean the queue before starting new implementation.

## In Progress Or Partial
- Advanced frontend tabs exist as shells/polish targets.
- Reader DOCX import has a Mammoth-to-HTML prototype; EPUB/PDF parser implementation remains incomplete.
- Future language expansion is planned but must be adapter-first and source/licensing aware.

## Blocked
- Auth and account identity.
- Backend architecture.
- Cloud sync and encrypted backup.
- Google Sheets export.
- Speech scoring.
- Real-time AI chatbot.
- Production translation.
- Etymology/conjugation data sources.
- Offline dictionary bundles.
