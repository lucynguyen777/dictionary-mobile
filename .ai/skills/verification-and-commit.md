# Skill: Verification And Commit

## Use when
Use this before committing, after implementing a task, when verifying local changes, or when packaging work into a commit/PR summary.

## Context to read first
- `.ai/agents/verifier.md`
- `.ai/skills/app-feature-testing.md` when a user-facing feature changed
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
3. **Security Audit**: Actively inspect the changes for security weaknesses, credentials leakages, missing RLS policies in migrations, input size validation vulnerabilities, rate-limiting/abuse holes, or XSS/sanitation risks.
4. Run focused tests first when available.
5. Run project-level verification:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm test` when behavior, parser, adapter, store, or data logic changed
6. For user-facing features, run the app-testing scope from `.ai/skills/app-feature-testing.md`:
   - functional flow, interruption handling, and data integrity
   - UI/UX layout, display, and usability
   - performance basics for load, network, and offline behavior
   - compatibility on Expo web plus target native platform or documented browser/device coverage
7. Use browser testing and temporary screenshots when helpful; keep them under `tmp/app-testing/` and out of commits.
8. Check that `docs/product-progress.md` matches the verified result.
9. Fix in-scope failures or report out-of-scope failures.
10. Commit only intended files with a concise imperative message when asked to commit.

## Rules
- Do not revert user changes.
- Do not include unrelated files just to make the tree clean.
- Do not skip failed verification silently.
- Do not run destructive git commands without explicit approval.
- Do not claim commit readiness when typecheck or lint fails.
- **Security Check Rule**: Never commit code with hardcoded API keys/credentials, missing RLS policies in database migrations, or unvalidated user inputs that could lead to DoS or XSS.

## Output
- Changed files.
- Verification commands and outcomes.
- App-testing coverage and temporary screenshot paths, when applicable.
- **Security Audit Summary**: Detailed listing of identified security & attack surface risks, along with their implemented mitigations/resolutions.
- Checklist consistency result.
- Remaining risks.
- Commit readiness decision.
- Suggested commit message.

## Stop conditions
- Stop before commit if typecheck, lint, or in-scope tests fail.
- Stop if unresolved high security risks or vulnerabilities are detected.
- Stop if unrelated risky changes are present.
- Stop if product progress says DONE but code or verification does not support it.
