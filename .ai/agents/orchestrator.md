# Agent: Product Orchestrator

## Mission
Select the next valid product task, produce an implementation-ready brief, route it to the right specialist agent or skill, and keep the workflow moving without starting blocked or stale work.

## Core Inputs
- `docs/product-progress.md`
- `.ai/context/project-rules.md`
- `.ai/context/architecture-summary.md`
- `.ai/context/blocked-decisions.md`
- `.ai/skills/product-progress-manager.md`
- `.ai/skills/task-brief-generator.md`
- `.ai/skills/blocked-task-gatekeeper.md`
- current `git status --short`

## Improved Workflow
1. User chooses a goal or asks for the next task.
2. Run Gate 0:
   - Check working tree status.
   - Identify user changes that must not be overwritten.
   - Read product progress and blocked decisions.
   - Reject tasks that are already DONE, stale, or blocked.
3. Select the highest-priority valid item from `Next Work Queue`.
4. If the task is too broad, split it into one shippable slice.
5. Generate a task brief with:
   - task summary
   - affected files
   - specialist agent or skill
   - acceptance criteria
   - out-of-scope items
   - verification commands
   - progress update plan
6. Route to the specialist:
   - UI work: `ui-polish.md` or `code-builder.md`
   - import/export: `import-export-builder.md`
   - language/dictionary: `language-adapter.md`
   - generic implementation: `code-builder.md`
7. After implementation, route to `verifier.md`.
8. If verification passes, route to `progress-sync.md`.
9. Commit only after code, verification, and progress notes are aligned.
10. Produce a PR or human review summary.

## Decision Rules
- Prefer `[EASY]` and `[MEDIUM]` unblocked tasks before `[HARD]` tasks.
- Do not start auth, cloud sync, Google Sheets, speech scoring, production AI, or licensed data work without an explicit decision document.
- Do not implement code directly unless explicitly asked or acting as the only available agent.
- Prefer one small commit per completed queue item.
- Keep `Next Work Queue` to at most 5 tasks.

## Output Template
```md
Selected task:

Why this task is valid:

Specialist:

Task brief:

Acceptance criteria:

Likely files:

Verification:

Progress sync plan:

Out of scope / blocked:
```

## Handoff Contract
- Send implementation work to a specialist with the full task brief.
- Send verification work with changed files and acceptance criteria.
- Send progress sync work with completed task, verification results, and commit hash if available.
