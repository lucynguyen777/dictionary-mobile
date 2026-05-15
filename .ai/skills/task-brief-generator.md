# Skill: Task Brief Generator

## Use when
Use this when turning a product queue item, bug, vague feature request, or user-selected goal into an implementation-ready task for a specialist agent.

## Context to read first
- `.ai/agents/orchestrator.md`
- `.ai/skills/blocked-task-gatekeeper.md`
- `docs/product-progress.md`
- relevant `.ai/agents/*.md` specialist file
- relevant `.ai/prompts/*.md` prompt file
- known blockers from `.ai/context/blocked-decisions.md` and `.docs/decisions/`

## Workflow
1. Restate the task as one concrete outcome.
2. Identify the smallest shippable slice.
3. Name the correct specialist agent and supporting skill.
4. List files to inspect first.
5. Define acceptance criteria as observable behavior.
6. Name verification commands and manual smoke checks.
7. Call out blocked decisions before implementation begins.
8. Keep the brief short enough to paste into an agent prompt.

## Rules
- Do not include hidden assumptions as requirements.
- Do not turn a focused task into a broad refactor.
- Do not assign backend, auth, cloud sync, AI, speech scoring, translation API, or licensed data work unless unblocked.
- Do not omit stop conditions for risky tasks.

## Output
```md
Task:
Specialist:
Supporting skill:
Context:
Likely files:
Acceptance criteria:
Verification:
Blocked or out of scope:
Stop conditions:
```

## Stop conditions
- Stop if the task is too vague to define acceptance criteria.
- Stop if the selected task is already DONE.
- Stop if the selected task is BLOCKED and no safe placeholder or decision-doc work was requested.
