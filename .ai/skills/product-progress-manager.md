# Skill: Product Progress Manager

## Use when
Use this when updating product status, choosing the next task, closing completed work, syncing `Next Work Queue`, or keeping `docs/product-progress.md` aligned with the actual codebase.

## Context to read first
- `.ai/agents/orchestrator.md`
- `.ai/agents/progress-sync.md`
- `.ai/prompts/sync-product-progress.md`
- `docs/product-progress.md`
- `git status --short`
- recent commits when commit hashes are needed
- changed files and verification results

## Workflow
1. Read the current progress document before editing it.
2. Compare checklist items with code, tests, verification output, and recent commits.
3. Move completed tasks out of active queue language.
4. Keep `Next Work Queue` to 5 items or fewer.
5. Mark blocked tasks with a specific blocker and decision doc path when possible.
6. Add only factual progress supported by code, tests, or committed files.
7. Suggest a commit message after the document matches the repo.

## Rules
- Do not mark a feature done because UI exists; confirm behavior exists.
- Do not invent dates, owners, milestones, decisions, or commit hashes.
- Do not leave stale active queue items after a task is finished.
- Do not rewrite unrelated product language.
- Do not unblock `[!] BLOCKED` tasks without an accepted decision.

## Output
- Checklist items changed.
- Queue items added, removed, or reordered.
- Blocked items preserved or clarified.
- Verification evidence used.
- Suggested commit message.

## Stop conditions
- Stop if code reality and checklist status conflict and cannot be resolved locally.
- Stop if a task should be marked DONE but verification failed.
- Stop if updating a blocked task requires a missing decision.
