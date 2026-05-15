# Prompt: Create Language Adapter Plan

## Use when
Use this before implementing support for a new language, script, morphology strategy, pronunciation model, or dictionary adapter.

## Context to read first
- `docs/product-progress.md`
- `.ai/agents/language-adapter.md`
- `.ai/skills/language-build-planner.md`
- `.ai/skills/dictionary-adapter-builder.md`
- `data/languages.ts`
- `data/adapterRegistry.ts`
- existing dictionary and morphology modules

## Task
Create an implementation plan for the requested language that separates unblocked adapter work from blocked source, licensing, or backend decisions.

## Rules
- Build monolingual lookup first.
- Do not build bilingual dictionary until a trustworthy lexical source exists.
- Do not use machine translation as dictionary data.
- Do not treat disputed macro-families as production taxonomy.
- Identify script, direction, segmentation, morphology, pronunciation, romanization, search, and UI implications.
- Name dictionary source candidates and license risks.

## Output
- Language analysis.
- Implementation phases.
- Required data fields.
- Adapter and registry changes.
- Tests needed.
- Blocked decisions.
- First safe task.

## Stop conditions
- Stop if no legal dictionary source candidate exists for the requested production scope.
- Stop if the task asks for licensed offline data without a licensing decision.
- Stop if the requested language behavior requires backend services not yet decided.
