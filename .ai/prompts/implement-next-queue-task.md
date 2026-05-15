# Prompt: Implement Next Queue Task

## Use when
Use this when the user wants the agent to pick and implement the next valid task from `docs/product-progress.md`.

## Context to read first
- `docs/product-progress.md`
- `.ai/agents/orchestrator.md`
- `.ai/skills/product-progress-manager.md`
- `.ai/skills/task-brief-generator.md`
- `.ai/skills/blocked-task-gatekeeper.md`
- `package.json`
- relevant source files for the selected task

## Task
Read the product progress file, select the highest-priority valid non-blocked task from `Next Work Queue`, create a short task brief and acceptance criteria, mark the task in progress when appropriate, implement it, verify it, and update product progress based on the real result.

## Rules
- Ignore tasks already marked DONE.
- Do not start BLOCKED tasks.
- Do not fake backend, auth, OAuth, speech scoring, AI chatbot, production translation, or licensed dictionary data.
- Do not introduce new dependencies unless necessary.
- Keep Vietnamese UI copy consistent.
- Keep mobile and Expo web layouts safe.
- Do not mark the task DONE if verification fails.

## Output
- Selected task and why it was valid.
- Implementation summary.
- Files changed.
- Checks run.
- Product progress updates.
- Remaining risks.
- Suggested commit message.

## Stop conditions
- Stop if every queue item is DONE or BLOCKED.
- Stop if the selected task requires a missing product decision.
- Stop if source files are too ambiguous to identify a safe implementation scope.
- Stop if verification fails and the next fix requires human decision.
