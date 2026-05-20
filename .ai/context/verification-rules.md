# Verification Rules

## Required Commands
Before marking implementation DONE, run:

```bash
npx tsc --noEmit
npx eslint . --no-cache
```

## Required Review

Check:

1. git status
2. changed files
3. docs/product-progress.md
4. task status
5. Next Work Queue
6. blocked task boundaries

## DONE Criteria

A task can be marked DONE only if:

* implementation exists
* basic behavior is verified
* typecheck passes
* lint passes
* checklist is updated

## IN PROGRESS Criteria

Use IN PROGRESS if:

* UI shell exists but behavior is incomplete
* implementation is partial
* verification fails
* some edge cases remain

## BLOCKED Criteria

Use BLOCKED if task requires:

* backend
* auth
* OAuth
* paid/external API
* licensed dictionary source
* speech/phoneme engine
* production AI cost control

## Commit Message Format

Prefer:

```txt
feat(area): short summary
fix(area): short summary
docs: update product progress
chore: update verification workflow