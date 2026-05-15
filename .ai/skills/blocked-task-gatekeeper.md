# Skill: Blocked Task Gatekeeper

## Use when
Use this before implementing work that may depend on unresolved backend, privacy, legal, licensing, AI, auth, cloud sync, OAuth, speech, translation, or third-party integration decisions.

## Context to read first
- `.ai/agents/orchestrator.md`
- `.ai/prompts/create-decision-doc.md`
- `.ai/context/blocked-decisions.md`
- `.docs/decisions/`
- `docs/product-progress.md`

## Blocked categories
- Auth and account identity
- Backend architecture
- Cloud sync and encrypted backup
- Google Sheets OAuth or API writes
- Speech scoring and phoneme alignment
- Real-time AI chatbot behavior
- Production translation API usage
- Etymology or conjugation data sources
- Licensed offline dictionary bundles

## Workflow
1. Compare the requested task with the blocked categories.
2. Check whether a matching decision doc exists in `.docs/decisions/`.
3. Treat `Proposed` decisions as still blocked unless the user explicitly says to proceed.
4. If blocked, identify the exact missing decision.
5. Offer only safe work: decision doc, placeholder UI, typed contract, or requirements capture.
6. If unblocked, state the accepted decision or local assumption and continue.

## Rules
- Do not fake production behavior.
- Do not invent credentials, APIs, licenses, data sources, pricing, or privacy guarantees.
- Do not store sensitive user data in a new place without a decision.
- Do not present placeholder UI as a working integration.
- Do not downgrade `[!] BLOCKED` roadmap items without an accepted decision.

## Output
- Blocked or unblocked status.
- Missing decision name.
- Safe next action.
- Decision doc path to create or update.
- Tasks that remain blocked.

## Stop conditions
- Stop implementation if the decision doc is missing or only `Proposed`.
- Stop if legal, vendor pricing, privacy, or license facts need external verification.
- Stop if the user asks to implement production behavior before accepting a decision.
