# Prompt: Create Decision Doc

## Use when
Use this when a roadmap item is blocked by auth, backend, API, legal data, licensing, cost, privacy, infrastructure, or third-party integration decisions.

## Context to read first
- `docs/product-progress.md`
- `.ai/skills/blocked-task-gatekeeper.md`
- `.docs/decisions/` decision records, if present
- relevant code interfaces, if they already exist

## Task
Create or update a decision document for the requested topic using the project decision format.

## Rules
- Do not implement production code.
- Do not fake unavailable services.
- Prefer local-first architecture unless the feature truly requires backend behavior.
- Include realistic options and consequences.
- List the exact roadmap tasks the decision would unblock.
- Keep `Status` as `Proposed` unless the user explicitly accepts or rejects an option.

## Output
- Decision document path.
- Decision summary.
- Options considered.
- Recommendation or chosen option.
- Tasks unblocked.
- Remaining open questions.

## Stop conditions
- Stop if the user asks to mark a decision `Accepted` without naming the chosen option.
- Stop if legal, pricing, or vendor terms must be verified and current source material is unavailable.
- Stop if implementation is requested before the decision is accepted.
