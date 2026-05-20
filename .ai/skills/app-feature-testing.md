# Skill: App Feature Testing

## Use when
Use this after building a new feature or changing a user-facing flow, before marking work DONE, syncing progress, or preparing a commit.

Trigger this skill for changes that touch navigation, screens, forms, local data, import/export, reader flows, dictionary lookup, profile/privacy, loading/error states, network/offline assumptions, or responsive layout.

For language adapter, dictionary lookup, local fixture, or morphology changes, use the offline language-testing workflow in `docs/testing-and-build-guide.md`.

## Context to read first
- `docs/testing-and-build-guide.md`
- `.ai/context/verification-rules.md`
- `.ai/context/ui-ux-guidelines.md`
- task acceptance criteria
- changed file diff
- target routes in `app/`
- relevant stores, adapters, and tests
- `package.json`

## Workflow
1. Select the smallest test scope that proves the feature works without broad manual retesting.
2. Run focused automated tests first when they exist.
3. Run required baseline checks:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm test -- --run` when data logic, parser logic, adapters, stores, or covered behavior changed
4. Start the app on Expo web or the requested platform when the feature is user-facing.
5. Test the feature against the four app-testing areas below.
6. Capture temporary screenshots when visual comparison helps prove layout, state, or responsive behavior.
7. Report commands, browser/platform coverage, screenshots kept, skipped areas, and remaining risk.

## App-Testing Areas

### Functional
- Verify the happy path and the most likely failure path.
- Validate app flow through navigation, back/cancel behavior, and return-to-screen state.
- Test interruption handling such as reload, tab switch, modal close, cancelled picker/share action, or temporary offline mode when relevant.
- Confirm data integrity after create, update, delete, reload, reset, import, export, or migration-sensitive actions.
- For dictionary language features, verify exact lookup, morphology fallback, missing result behavior, and related-word behavior through offline Vitest fixtures.

### UI/UX
- Check layout and display on a narrow mobile viewport and Expo web desktop when practical.
- Confirm text wraps or truncates cleanly and controls do not overlap.
- Check loading, empty, success, error, disabled, and destructive-confirmation states touched by the change.
- Confirm usability basics: primary action is reachable, destructive action is not accidental, and blocked features look disabled.

### Performance
- Watch initial screen load, feature action latency, and repeated interaction responsiveness.
- Check loading indicators for operations that may take noticeable time.
- Test network and offline assumptions when the feature reads remote or cached data.
- Do not treat live external services as required test infrastructure unless the task explicitly accepts that dependency.

### Compatibility
- Cover Expo web plus the target native platform when available.
- For browser testing, include a narrow mobile viewport and one desktop viewport.
- For native-sensitive behavior, document whether Expo Go, Android emulator, iOS simulator, or a development build was used.
- Do not claim native compatibility when only Expo web was tested.

## Browser And Screenshot Rules
- Browser-based testing is allowed for Expo web smoke checks, responsive checks, and state screenshots.
- Temporary screenshots may be saved under `tmp/app-testing/<task-or-date>/` for short-term comparison during the test session.
- DOM/media snapshots from browser tools are temporary testing artifacts only. Treat files such as `dom_*.txt`, `.tempmediaStorage/*`, screenshots, and traces as non-source evidence unless explicitly promoted into repo fixtures.
- Keep screenshot names descriptive, for example `word-mobile-empty.png` or `library-desktop-after-import.png`.
- Do not commit screenshots or browser artifacts unless a task explicitly asks for fixture assets.
- Clean up or leave a clear note about any temporary screenshots that remain useful for handoff.

## Output
- Automated checks and results.
- Browser/platforms tested.
- Functional, UI/UX, performance, and compatibility coverage.
- Screenshot paths kept temporarily, if any.
- Skipped checks with reason.
- Remaining risks or follow-up test gaps.

## Stop conditions
- Stop if the app cannot launch and the failure appears caused by the task.
- Stop if a data integrity issue is found in an in-scope flow.
- Stop if screenshots show overlap, clipped text, or unreachable actions in the changed feature.
- Stop if compatibility would require unavailable native tooling; report the gap instead of overstating coverage.
