# Product Rules

## Progress Rules
1. Read `docs/product-progress.md` before starting roadmap work.
2. Do not start tasks marked `[!] BLOCKED`.
3. Do not keep completed tasks as active `Next Work Queue` items.
4. Keep `Next Work Queue` to at most 5 items.
5. Mark work DONE only when implementation and verification support it.
6. Keep blocked items in the roadmap with their blocker named.
7. For user-facing features, include app testing evidence before marking DONE.

## Local-First Rules
- Assume user data is local unless an accepted backend/cloud decision exists.
- Use `data/storageAdapter.ts` and `data/storageAdapter.web.ts` patterns for persistence.
- Do not add remote persistence, auth, OAuth, sync, or server-side data storage without an accepted decision.

## Dictionary Rules
- Build monolingual lookup first for each language.
- Add bilingual lookup only after a trustworthy lexical source is selected.
- Never use machine translation as dictionary data.
- Do not package licensed offline data without a licensing decision.

## Implementation Rules
- Keep changes small, complete, and verifiable.
- Reuse existing routes, components, stores, and helpers before adding abstractions.
- Avoid unrelated refactors.
- Keep mobile and Expo web behavior safe.
- Keep Vietnamese UI copy consistent with nearby screens.
- After building a user-facing feature, verify the relevant functional, UI/UX, performance, and compatibility behavior from `.ai/skills/app-feature-testing.md`.

## Blocked Work
The following remain blocked until accepted decision docs exist:
- Auth provider
- Backend architecture
- Cloud sync
- Google Sheets OAuth/export
- Speech scoring engine
- AI chat cost control/backend proxy
- Translation API
- Dictionary source licensing
- Offline dictionary bundle
