# Skill: Import Export Feature Builder

## Use when
Use this when changing import, export, backup, restore, CSV/TSV/XLS handling, Anki generation, file picker, sharing, import preview, mapping, validation, or export status flows.

## Context to read first
- `.ai/agents/import-export-builder.md`
- `.ai/skills/expo-react-native-ui-builder.md`
- `.ai/skills/blocked-task-gatekeeper.md`
- `data/csvImport.ts`
- `data/exportAllData.ts`
- `data/readerImport.ts`
- stores in `data/*Store.ts`
- UI screens that trigger import/export
- tests covering parser or export behavior

## Workflow
1. Inspect current parser/export helpers before editing UI.
2. Preserve existing CSV, TSV, Excel-compatible XLS, and Anki TSV behavior.
3. Parse with structured helpers when quoted fields or delimiters matter.
4. Validate empty rows, duplicate words, missing primary fields, unsupported fields, and unsupported formats.
5. Preserve mapping preview and preview-before-import behavior where present.
6. Keep destination folder or collection explicit.
7. Show import/export success, cancellation, recoverable errors, and unsupported-platform feedback.
8. Add tests when parser, export, or data behavior changes.

## Rules
- Do not silently drop rows.
- Do not fake Google Sheets sync or export.
- Do not add backend, cloud sync, or OAuth.
- Do not couple parsing/export logic to visual-only state.
- Do not leak internal-only fields unless the export format expects them.

## Output
- Import/export behavior summary.
- Formats supported and formats blocked.
- Validation behavior.
- Changed files.
- Tests and manual smoke path.
- Product progress update needed.

## Stop conditions
- Stop if requested format support lacks a parser or product decision.
- Stop if Google Sheets, cloud sync, or OAuth is required.
- Stop if data loss risk is discovered and cannot be resolved in scope.
