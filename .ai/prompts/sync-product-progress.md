# Prompt: Sync Product Progress

## Use when
Use this after code changes, after commits, or when roadmap status and `Next Work Queue` have become stale.

## Context to read first
- `docs/product-progress.md`
- `.ai/agents/progress-sync.md`
- `.ai/skills/product-progress-manager.md`
- `git status --short`
- recent commits when commit hashes are needed
- changed files and verification output

## Task
Update `docs/product-progress.md` so it matches the current project state and verified implementation status.

## Rules
- Keep `Next Work Queue` to at most 5 tasks.
- Remove DONE tasks from active queue language.
- Keep unfinished roadmap items in their original sections.
- Do not delete blocked tasks.
- Add blocker explanations where needed.
- Update `Current Baseline` only when commit hashes are available.
- Do not claim code is implemented unless it was verified.

## Output
- Changed checklist items.
- Updated queue.
- Stale items removed.
- Blocked items preserved or clarified.
- Suggested commit message.

## Stop conditions
- Stop if code status and checklist status conflict and cannot be resolved from local files.
- Stop if a task should be marked DONE but verification failed.
- Stop if changing a BLOCKED item requires an accepted decision.
