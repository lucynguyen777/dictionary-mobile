# Prompt: Build Export Tab

## Use when
Use this for the roadmap task to polish the Export frontend tab or improve local export actions and status feedback.

## Context to read first
- `docs/product-progress.md`
- `.ai/agents/import-export-builder.md`
- `.ai/skills/import-export-feature-builder.md`
- `.ai/skills/expo-react-native-ui-builder.md`
- `data/exportAllData.ts`
- existing folder/library export UI

## Task
Build or polish the Export tab with CSV export, Excel-compatible XLS export, Anki text export, blocked Google Sheets state, and export history/status feedback.

## Rules
- Reuse existing export paths.
- Keep Google Sheets blocked until OAuth and Google API decisions exist.
- Show success, failure, cancellation, and unsupported-platform states.
- Keep copy consistent with the surrounding UI.
- Do not add backend, OAuth, or cloud sync.
- Do not break existing folder export menu behavior.

## Output
- Implementation summary.
- Changed files.
- Verification results.
- Product progress update needed.
- Suggested commit message.

## Stop conditions
- Stop if the task requires Google OAuth or backend export infrastructure.
- Stop if existing export helpers are too unclear to reuse safely.
- Stop if verification fails and the fix is outside the export task scope.
