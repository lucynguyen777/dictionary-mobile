# Skill: Verification And Commit

## Use when
Use this before committing, after implementing a task, when verifying local changes, or when packaging work into a commit/PR summary.

## Context to read first
- `.ai/agents/verifier.md`
- `.ai/prompts/verify-before-commit.md`
- `.ai/prompts/write-pr-summary.md`
- `git status --short`
- changed file diff
- task acceptance criteria
- `package.json`
- relevant tests
- `docs/product-progress.md`

## Workflow
1. Inspect the working tree and identify which changes belong to the task.
2. Review the diff for accidental edits, secrets, generated noise, and unrelated churn.
3. Run focused tests first when available.
4. Run project-level verification:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm test` when behavior, parser, adapter, store, or data logic changed
5. Check that `docs/product-progress.md` matches the verified result.
6. Fix in-scope failures or report out-of-scope failures.
7. Commit only intended files with a concise imperative message when asked to commit.

## Rules
- Do not revert user changes.
- Do not include unrelated files just to make the tree clean.
- Do not skip failed verification silently.
- Do not run destructive git commands without explicit approval.
- Do not claim commit readiness when typecheck or lint fails.

## Output
- Changed files.
- Verification commands and outcomes.
- Checklist consistency result.
- Remaining risks.
- Commit readiness decision.
- Suggested commit message.

## Stop conditions
- Stop before commit if typecheck, lint, or in-scope tests fail.
- Stop if unrelated risky changes are present.
- Stop if product progress says DONE but code or verification does not support it.
