# Prompt: Review Code Against Checklist

## Use when
Use this before commit, before push, during review, or when `docs/product-progress.md` may be out of sync with the codebase.

## Context to read first
- `docs/product-progress.md`
- `.ai/agents/verifier.md`
- `.ai/skills/product-progress-manager.md`
- `git status --short`
- recent commits
- relevant source files for any disputed checklist item

## Task
Review whether the codebase and recent commits match `docs/product-progress.md`, especially DONE, IN PROGRESS, TODO, BLOCKED, and `Next Work Queue` items.

## Rules
- Verify DONE items against real implementation, not UI labels alone.
- Keep BLOCKED items blocked unless a decision document exists.
- Keep `Next Work Queue` to at most 5 tasks.
- Do not rewrite roadmap sections unrelated to the mismatch.
- Do not mark code complete without verification evidence.
- Be explicit when code reality is uncertain.

## Output
- A table with `Area`, `Checklist status`, `Code reality`, and `Action needed`.
- Safe checklist updates.
- Risky mismatches.
- Suggested next task.
- Verification or inspection gaps.

## Stop conditions
- Stop if the requested review requires running unavailable external services.
- Stop if source files needed to validate a checklist item cannot be found.
- Stop if the checklist update would require a product decision.
