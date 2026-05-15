# Prompt: Write PR Summary

## Use when
Use this after implementation and verification, before opening a PR or asking for human review.

## Context to read first
- `.ai/agents/orchestrator.md`
- `.ai/agents/verifier.md`
- `git diff`
- `git status --short`
- `docs/product-progress.md`
- verification output

## Task
Write a concise PR or human review summary that explains what changed, why it changed, how it was verified, and what risks remain.

## Rules
- Be honest about failed, skipped, or unavailable checks.
- Do not claim DONE unless `docs/product-progress.md` was updated appropriately.
- Mention blocked follow-ups separately.
- Keep the summary concise and reviewer-friendly.
- Do not include unrelated implementation details.

## Output
```md
## Summary
- ...

## Changes
- ...

## Verification
- [ ] npx tsc --noEmit
- [ ] npm run lint
- [ ] npm test, if applicable

## Product Progress
- ...

## Risks / Follow-up
- ...
```

## Stop conditions
- Stop if verification results are missing.
- Stop if changed files are unknown.
- Stop if product progress status conflicts with the claimed PR scope.
