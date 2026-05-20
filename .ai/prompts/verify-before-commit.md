# Prompt: Verify Before Commit

## Use when
Use this before creating a commit or when the user asks whether the current working tree is safe to commit.

## Context to read first
- `.ai/agents/verifier.md`
- `.ai/skills/verification-and-commit.md`
- `.ai/skills/app-feature-testing.md` when a user-facing feature changed
- `git status --short`
- changed files and diff
- `docs/product-progress.md`
- `package.json`

## Task
Verify the current working tree, check checklist consistency, and decide whether the changes are ready to commit.

## Rules
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `npm test` when data logic, parser logic, adapters, stores, or tested behavior changed.
- For user-facing features, verify functional flow, interruption handling, data integrity, UI/UX, performance basics, and compatibility coverage.
- Browser testing and temporary screenshots under `tmp/app-testing/` are allowed for Expo web smoke and visual comparison.
- Check that `docs/product-progress.md` matches the code.
- Confirm `Next Work Queue` remains valid.
- Identify unrelated changes and risky files.
- Do not suggest committing if required checks fail.

## Output
- Changed files.
- Verification results.
- App-testing evidence when applicable.
- Checklist consistency result.
- Unresolved risks.
- Suggested commit message.
- Clear commit readiness decision.

## Stop conditions
- Stop if typecheck fails.
- Stop if lint fails.
- Stop if tests fail for in-scope changes.
- Stop if checklist says DONE but code is incomplete.
- Stop if unrelated risky changes are present.
