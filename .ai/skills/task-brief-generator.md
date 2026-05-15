# Skill: Task Brief Generator

## Trigger
Use this when turning a product queue item, bug, or vague feature request into an implementation-ready task for another agent.

## Inputs
- selected queue item or user request
- relevant files, screens, and data modules
- known blockers from `.ai/context/blocked-decisions.md`
- acceptance criteria from product notes or issue text

## Workflow
1. Restate the task in one concrete outcome.
2. Identify the smallest code area likely to change.
3. List files to inspect first.
4. Define acceptance criteria as observable behavior.
5. Name verification commands and any manual smoke test.
6. Call out blocked decisions before implementation begins.
7. Keep the brief short enough to paste into an agent prompt.

## Brief Template
```md
Task:

Context:

Likely files:

Acceptance criteria:

Verification:

Blocked or out of scope:
```

## Guardrails
- Do not include hidden assumptions as requirements.
- Do not ask for a broad refactor when a focused patch is enough.
- Do not assign backend, auth, cloud sync, or licensed data work unless unblocked.

## Done Criteria
- The task can be implemented without further product interpretation.
- The expected behavior is testable.
- Out-of-scope work is explicit.
