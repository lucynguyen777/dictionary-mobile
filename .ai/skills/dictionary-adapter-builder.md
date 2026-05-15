# Skill: Dictionary Adapter Builder

## Use when
Use this when adding or changing dictionary lookup adapters, local lexicon behavior, morphology helpers, search normalization, or language-specific lookup logic.

## Context to read first
- `.ai/agents/language-adapter.md`
- `.ai/skills/language-build-planner.md`
- `.ai/skills/blocked-task-gatekeeper.md`
- `data/adapterRegistry.ts`
- `data/dictionaryApi.ts`
- `data/dictionary.ts`
- `data/localLexicon.ts`
- `data/morphology.ts`
- `data/languages.ts`
- related tests in `tests/`

## Workflow
1. Read the adapter registry and existing adapter shape before editing.
2. Confirm the requested language or source is not blocked by licensing.
3. Keep adapter interfaces stable unless all callers and tests are updated.
4. Put language-specific normalization in an adapter or helper, not scattered across screens.
5. Return structured dictionary entries that match current UI expectations.
6. Handle empty input, no result, partial result, and unsupported language cases.
7. Add or update registry and lookup tests.

## Rules
- Build monolingual lookup first unless a trustworthy bilingual source is selected.
- Never use machine translation as dictionary data.
- Do not hardcode large lexical datasets directly into source files.
- Do not add production remote calls without privacy, quota, and offline decisions.
- Do not break existing adapters or fallback lookup behavior.

## Output
- Adapter change summary.
- Registered language/source ids.
- Normalization and morphology behavior.
- Tests added or updated.
- Blocked data or licensing decisions.

## Stop conditions
- Stop if no legal source exists for the requested production dictionary.
- Stop if the task requires a licensed offline bundle decision.
- Stop if changing the adapter contract would require broad unplanned rewrites.
