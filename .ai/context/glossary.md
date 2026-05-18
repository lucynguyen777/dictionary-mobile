# Glossary

## Product Terms
- Local-first: user data is stored locally unless an accepted backend/cloud decision exists.
- Lookup: dictionary search for a word or phrase.
- Monolingual dictionary: source and definition language are the same.
- Bilingual dictionary: source language differs from target language.
- Adapter: language/source-specific lookup module registered in `data/adapterRegistry.ts`.
- Fallback adapter: generic dictionary API path used when a language has no explicit adapter.
- Saved word: vocabulary item saved into the local library.
- Folder: vocabulary collection containing saved word membership.
- Favorites folder: special folder id `favorites`.
- Flashcard: review card generated from saved words or imported rows.
- SM-2: spaced repetition scheduling algorithm used for flashcard review fields.

## Import Export Terms
- CSV: comma-separated import/export format.
- TSV: tab-separated format, including Anki text export.
- XLS: Excel-compatible HTML/table export with `.xls` extension.
- Mapping preview: UI for checking how columns map to import fields before import.
- Primary field: required import field used to identify a valid row.
- Destination folder: folder that imported vocabulary will be saved into.

## Reader Terms
- Reader document: local text document stored in reader state.
- Source format: Reader store value produced by import helpers; currently `txt`, `html`, `docx`, or `epub` in normal import flows. `pdf` is allowed only when the web PDF gate is explicitly enabled.
- Highlight: selected reader text used for lookup/save/flashcard creation.

## Decision Terms
- Proposed: decision exists but does not unblock production implementation.
- Accepted: decision has been chosen and can unblock scoped implementation.
- Blocked: task requires an accepted decision or external/legal resource.

## Common Files
- `docs/product-progress.md`: roadmap and progress checklist.
- `.docs/decisions/`: decision records.
- `.ai/agents/`: agent role specs.
- `.ai/skills/`: reusable project skill specs.
- `.ai/prompts/`: prompt templates.
- `.ai/context/`: compact project context for agents.
