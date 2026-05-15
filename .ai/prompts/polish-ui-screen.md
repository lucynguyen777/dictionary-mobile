# Prompt: Polish UI Screen

## Use when
Use this to polish an existing Expo React Native screen, tab, sidebar, form, menu, or empty state.

## Context to read first
- `docs/product-progress.md`
- `.ai/agents/ui-polish.md`
- `.ai/skills/expo-react-native-ui-builder.md`
- target screen or component files
- shared style/theme files
- navigation files, if relevant

## Task
Polish the requested screen or feature so it is clearer, more usable, and safe on mobile and Expo web.

## Rules
- Reuse existing components and styles before creating new ones.
- Keep layouts mobile-safe and Expo web-safe.
- Prevent text overflow and action overlap.
- Include clear empty, loading, error, disabled, and destructive states where relevant.
- Keep Vietnamese UI copy consistent.
- Do not add backend behavior.
- Do not introduce new dependencies unless necessary.
- Do not change data models unless required.
- Do not break existing navigation.

## Output
- UI changes made.
- Files changed.
- Screenshots or manual test notes if applicable.
- Verification result.
- Suggested commit message.

## Stop conditions
- Stop if the requested polish depends on an unbuilt backend or integration.
- Stop if a visual change requires product decision on copy, legal, privacy, or data behavior.
- Stop if verification fails and the fix is outside the UI scope.
