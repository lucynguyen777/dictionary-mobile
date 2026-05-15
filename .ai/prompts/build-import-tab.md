# Prompt: Build Import Tab

## Use when
Use this for the roadmap task to polish the Import frontend tab or improve local dataset import configuration before final confirmation.

## Context to read first
- `docs/product-progress.md`
- `.ai/agents/import-export-builder.md`
- `.ai/skills/import-export-feature-builder.md`
- `.ai/skills/expo-react-native-ui-builder.md`
- `data/csvImport.ts`
- folder storage and flashcard generation logic
- existing import UI

## Task
Build or polish the Import tab with dataset source chooser, mapping preview, validation summary, destination folder chooser, and flashcard generation checklist.

## Rules
- Reuse existing CSV and TSV import logic.
- Preview data before final import.
- Validate empty rows, duplicate words, missing key fields, unsupported fields, and unsupported formats.
- Support new-folder and existing-folder destination choices where existing data APIs allow it.
- Support existing flashcard card types only.
- Do not add backend, cloud sync, Google Sheets, or fake import support.
- Keep Vietnamese UI copy consistent.

## Output
- Implementation summary.
- Changed files.
- Verification results.
- Product progress update needed.
- Suggested commit message.

## Stop conditions
- Stop if the requested source format is unsupported and no parser decision exists.
- Stop if folder or flashcard APIs cannot support the requested behavior without a broader data-model change.
- Stop if verification fails and the fix is outside the import task scope.
