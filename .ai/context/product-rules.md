# Product Rules

## Progress Rule
Before starting any task:
1. Read docs/product-progress.md.
2. Check that the task status is correct.
3. Do not start tasks marked BLOCKED.
4. Do not keep DONE tasks inside the active Next Work Queue.
5. Keep Next Work Queue to maximum 5 active tasks.

## Implementation Rule
Prefer small, complete, verifiable changes.

Do not make unrelated refactors unless required.

## Verification Rule
Before marking a task DONE, run:

```bash
npx tsc --noEmit
npx eslint . --no-cache
```

If verification fails, the task must not be marked DONE.

## Documentation Rule

After implementation:

1. Update docs/product-progress.md.
2. Sync checklist status with code reality.
3. Update Next Work Queue if needed.
4. Suggest a commit message.

## Blocked Task Rule

Do not implement real behavior for features that require unresolved backend, auth, API, OAuth, speech, AI, or licensing decisions.

For BLOCKED tasks, only create:

* decision docs
* frontend placeholder UI
* interface contracts
* implementation plans