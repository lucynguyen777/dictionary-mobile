# Skill: Expo React Native UI Builder

## Use when
Use this when building or polishing screens, tabs, controls, forms, menus, empty states, or local-first workflows in this Expo Router React Native app.

## Context to read first
- `.ai/agents/ui-polish.md`
- `.ai/skills/app-feature-testing.md` when validating finished UI behavior
- `docs/product-progress.md`
- target route in `app/`
- shared components in `components/app`, `components/ui`, and feature folders
- theme tokens in `constants/theme.ts`
- related data APIs in `data/`

## Workflow
1. Inspect the existing screen and nearby components before editing.
2. Reuse `Screen`, `SectionTitle`, themed text/view helpers, icons, and existing feature components where they fit.
3. Keep layouts safe for portrait mobile and Expo web.
4. Add empty, loading, disabled, destructive, and error states when the flow needs them.
5. Keep copy concise and consistent with surrounding Vietnamese UI.
6. Use local state or existing stores for UI behavior.
7. Run typecheck and lint after code edits.
8. For user-facing changes, run or request app testing for functional flow, UI/UX, performance basics, and compatibility coverage.

## Rules
- Do not add new dependencies without a strong reason.
- Do not introduce backend, auth, sync, OAuth, AI, or production integration assumptions.
- Do not change shared data models for visual-only work.
- Do not hide blocked features; show honest disabled or coming-soon states.
- Avoid decorative UI that reduces scanability or causes overlap.

## Output
- UI change summary.
- Changed files.
- States handled: empty, loading, error, disabled, destructive.
- Mobile/web layout notes.
- App-testing coverage and screenshot paths when used.
- Verification results or skipped-check reason.

## Stop conditions
- Stop if the requested UI requires unresolved backend or legal behavior.
- Stop if copy or legal/privacy text needs product approval.
- Stop if fixing layout requires a data-model change outside the task scope.
