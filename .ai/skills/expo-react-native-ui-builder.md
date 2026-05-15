# Skill: Expo React Native UI Builder

## Trigger
Use this when building or polishing screens, tabs, controls, empty states, or local-first flows in this Expo Router React Native app.

## Inputs
- target route in `app/`
- reusable components in `components/app`, `components/ui`, and feature folders
- theme tokens in `constants/theme.ts`
- related data APIs in `data/`
- current mobile and web behavior

## Workflow
1. Inspect the existing screen and nearby components before editing.
2. Reuse `Screen`, `SectionTitle`, themed text/view helpers, and existing feature components where they fit.
3. Keep layouts safe for portrait mobile and Expo web.
4. Add empty, loading, disabled, and error states when the workflow needs them.
5. Keep copy concise and consistent with existing app language.
6. Use local state or existing stores for UI behavior; avoid new persistence unless required.
7. Run typecheck and lint after changes when code was edited.

## UI Checklist
- Empty state is useful.
- Error state is recoverable.
- Buttons have clear disabled states.
- Text does not overflow on narrow screens.
- Touch targets are comfortable.
- Web spacing still scans well.
- Accessibility labels exist for icon-only actions.

## Guardrails
- Do not add new dependencies without a strong reason.
- Do not introduce backend assumptions.
- Do not change shared data models for visual-only work.
- Do not implement blocked production behavior; show placeholder UI only.

## Done Criteria
- The screen works on mobile and web assumptions.
- The implementation follows local component patterns.
- Verification commands or skipped-test reasons are reported.
