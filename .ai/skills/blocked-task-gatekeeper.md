# Skill: Blocked Task Gatekeeper

## Trigger
Use this before implementing work that may depend on unresolved backend, privacy, legal, licensing, AI, auth, cloud sync, or third-party integration decisions.

## Blocked Categories
- Auth and account identity
- Cloud sync
- Google Sheets OAuth or API writes
- Speech scoring
- Real-time AI chatbot behavior
- Production multilingual translation
- Etymology data source
- Conjugation or inflection database source
- Licensed offline dictionary bundles

## Workflow
1. Compare the requested task with the blocked categories.
2. Check `.ai/context/blocked-decisions.md` if it exists.
3. If blocked, identify the exact missing decision.
4. Offer the safest allowed work: decision doc, placeholder UI, typed contract, or requirements capture.
5. If unblocked, state the assumption and continue.

## Allowed Work For Blocked Tasks
- Create or update a decision document.
- Create frontend placeholder UI with honest disabled/coming-soon states.
- Create mock-free interface contracts.
- Document requirements, risks, and acceptance criteria.

## Guardrails
- Do not fake production behavior.
- Do not invent credentials, APIs, licenses, or data sources.
- Do not store sensitive user data in a new place without a product decision.
- Do not present a placeholder as a working integration.

## Done Criteria
- Blocked work is stopped before implementation.
- The missing decision is named.
- The next allowed action is clear.
