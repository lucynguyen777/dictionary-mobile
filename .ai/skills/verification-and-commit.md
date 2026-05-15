# Skill: Verification And Commit

## Trigger
Use this before committing, after implementing a task, or when asked to verify and package local changes.

## Inputs
- `git status --short`
- changed file diff
- task acceptance criteria
- package scripts from `package.json`
- relevant tests

## Workflow
1. Inspect the working tree and identify which changes belong to the task.
2. Review the diff for accidental edits, secrets, generated noise, or unrelated churn.
3. Run focused tests first when available.
4. Run project-level verification:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm test` when behavior or data logic changed
5. Fix failures that are in scope.
6. Summarize verification results and remaining risk.
7. Commit only the intended files with a concise imperative message when asked to commit.

## Commit Message Rules
- Use an imperative subject.
- Keep the subject under 72 characters when practical.
- Mention the feature or fix, not the implementation trivia.

## Guardrails
- Do not revert user changes.
- Do not include unrelated files to make the tree clean.
- Do not skip failed verification silently.
- Do not run destructive git commands without explicit approval.

## Done Criteria
- Intended files are committed or clearly left uncommitted by request.
- Verification commands and outcomes are reported.
- Working tree status is known after commit.
