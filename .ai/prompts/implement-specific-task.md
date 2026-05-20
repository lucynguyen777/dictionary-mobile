# Prompt: Implement Specific Task

## Use when
Use this when the user provides one specific roadmap task, bug, or feature request to implement.

## Context to read first
- `docs/product-progress.md`
- `.ai/agents/orchestrator.md`
- `.ai/agents/code-builder.md`
- `.ai/skills/task-brief-generator.md`
- `.ai/skills/blocked-task-gatekeeper.md`
- `.ai/skills/app-feature-testing.md` for user-facing feature verification
- files related to the requested feature
- existing components before creating new ones

## Task
Implement the requested task in the smallest complete slice that satisfies its acceptance criteria.

## Rules
- Confirm where the task appears in `docs/product-progress.md` when it is a roadmap item.
- If the task is DONE, report that it appears already completed.
- If the task is BLOCKED, create or update a decision note instead of implementing production behavior.
- If the task is TODO or IN PROGRESS, implement the smallest safe version.
- Reuse existing architecture and components.
- Avoid broad unrelated refactors.
- Do not modify unrelated checklist sections.
- Do not mark DONE unless the implementation is real and verified.
- For user-facing work, include app-testing coverage or a clear skipped-check reason in the result.

## Output
- Implementation summary.
- Changed files.
- Verification result.
- App-testing coverage when applicable.
- Product progress update.
- Suggested commit message.

## Stop conditions
- Stop if the task is blocked by auth, backend, OAuth, licensing, speech scoring, AI cost control, or translation API decisions.
- Stop if implementation would require overwriting unrelated user changes.
- Stop if acceptance criteria are unclear enough that implementation would be guesswork.
