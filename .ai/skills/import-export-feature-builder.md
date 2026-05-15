# Skill: Import Export Feature Builder

## Trigger
Use this when changing import, export, backup, restore, CSV/TSV/XLS handling, Anki generation, or file picker/sharing flows.

## Inputs
- `data/csvImport.ts`
- `data/exportAllData.ts`
- `data/readerImport.ts`
- stores in `data/*Store.ts`
- UI screens that trigger import/export
- tests covering parser or export behavior

## Import Workflow
1. Preserve existing CSV and TSV behavior.
2. Parse with structured helpers rather than ad hoc splitting when quoted fields or delimiters matter.
3. Validate empty rows, duplicate words, missing primary fields, and unsupported formats.
4. Preserve field mapping and preview-before-import behavior when present.
5. Keep folder or collection destination explicit.
6. Report import counts and recoverable row errors.

## Export Workflow
1. Preserve CSV, Excel-compatible XLS, and Anki TSV behavior.
2. Keep Google Sheets blocked until OAuth and API decisions exist.
3. Use platform-safe file and sharing APIs.
4. Show success, cancellation, and unsupported-platform feedback.
5. Avoid leaking internal-only fields unless the export format expects them.

## Guardrails
- Do not silently drop rows.
- Do not fake Google Sheets sync.
- Do not couple import/export to UI-only state when a data helper belongs in `data/`.
- Do not break existing tests for dictionary API or reader import.

## Done Criteria
- Parser/export tests cover the changed behavior.
- Typecheck and lint pass or failures are documented.
- Manual smoke path is described for file picker/sharing changes.
