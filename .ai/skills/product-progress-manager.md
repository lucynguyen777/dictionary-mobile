# Skill: Product Progress Manager

## Trigger
Use this when updating product status, choosing the next task, closing completed work, or keeping `docs/product-progress.md` aligned with the actual codebase.

## Inputs
- `docs/product-progress.md`
- `git status --short`
- recent commits when relevant
- current task brief or implementation summary
- changed files and verification results

## Workflow
1. Read the current progress document before editing it.
2. Compare checklist items with the current codebase and tests.
3. Move completed tasks out of active queue language.
4. Keep `Next Work Queue` to 5 items or fewer.
5. Mark blocked tasks with a specific blocker and a clear allowed next action.
6. Add only factual progress that is supported by code, tests, or committed files.
7. Suggest a commit message after the document matches the repo.

## Guardrails
- Do not mark a feature done because UI exists; confirm behavior exists.
- Do not invent dates, owners, milestones, or backend decisions.
- Do not leave stale active queue items after a task is finished.
- Do not rewrite unrelated product language.

## Done Criteria
- Progress doc matches the current code state.
- Active queue is short, actionable, and unblocked where possible.
- Blocked items name the missing decision or dependency.
- Verification commands are recorded when they were run.
