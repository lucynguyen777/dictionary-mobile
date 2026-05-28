# Testing And Build Guide

This is the human-facing QA guide for Dictionary Mobile. Use it with `docs/product-progress.md` before marking roadmap work done. The short agent-facing rules remain in `.ai/context/verification-rules.md`.

## Testing Strategy

Dictionary Mobile uses an offline-first verification strategy. Routine checks should prefer deterministic local fixtures, TypeScript contracts, and Vitest suites over live network calls or device-only state. Browser and native smoke tests are used to confirm user-facing behavior after the stable offline checks pass.

Testing layers:

1. Static checks: whitespace, TypeScript, and lint.
2. Focused offline tests: run the closest Vitest suite for the changed behavior.
3. Full offline suite: run before marking shared data, parser, adapter, or store behavior DONE.
4. App smoke: use Expo web or the target native platform when UI, navigation, file picking, sharing, audio, permissions, or layout changed.
5. Optional UI artifact automation: use Playwright for Expo Web or Maestro/Detox for native only when the tooling is configured or the task explicitly asks to set it up.
6. Compatibility smoke: document browser viewport, Expo Go, emulator/simulator, or development-build coverage when native behavior matters.

Default policy:

- Keep routine tests offline and fixture-based.
- Do not require live APIs, OAuth, device permissions, or native-only state for normal verification.
- Promote temporary browser evidence to durable fixtures only when a task explicitly asks for it.
- Use UI/browser screenshots for short-term comparison, not as unstable visual baselines.
- Do not add additional E2E dependencies, npm scripts, browsers, Maestro flows, or Detox config as a side effect of routine feature work.

Reference practices:

- Expo unit testing: https://docs.expo.dev/develop/unit-testing/
- Expo Router testing: https://docs.expo.dev/router/reference/testing/
- React Native testing overview: https://reactnative.dev/docs/0.81/testing-overview
- Vitest testing practice: https://main.vitest.dev/guide/learn/testing-in-practice
- Playwright screenshots: https://playwright.dev/docs/screenshots

## First-time Setup

Before running tests for the first time in a new environment:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **For E2E tests, install Playwright browsers:**
   ```bash
   npx playwright install chromium
   # On Linux containers, if browser dependencies are missing:
   npx playwright install-deps chromium
   ```

3. **For native tests, install Maestro:**
   - Follow Maestro installation guide: https://maestro.mobile.dev/getting-started/installing-maestro
   - For Expo Go smoke, set `EXPO_GO_WORD_URL` and use the Expo Go scripts in the Native Mobile section below.

## Verification Ladder

Use this order unless the task has a more specific acceptance gate:

1. Review the diff and changed files.
2. Run `git diff --check`.
3. Run `npx tsc --noEmit`.
4. Run `npm run lint`.
5. Run a focused offline suite when available, for example `npm test -- --run tests/dictionaryApi.test.ts`.
6. Run `npm test -- --run` when shared data, parser, adapter, store, or covered behavior changed.
7. Run Expo web or native smoke only when user-facing behavior changed.
8. Run configured E2E/UI artifact tests only when the task requires browser/native evidence or the repo already has that tooling.
9. Record skipped checks and why.

Focused tests are enough for documentation-only changes and narrow isolated behavior. Full tests are required before marking DONE for shared behavior, local persistence, parser pipelines, dictionary adapters, or anything that affects multiple screens.

## When Tests Fail

When tests fail during verification:

1. **Review the failure output carefully:**
   - Read the error message and stack trace
   - Identify which test(s) failed and why
   - Check if the failure is in your changed code or existing code

2. **Determine if the failure is expected:**
   - If you intentionally changed behavior, update the tests to match
   - If tests are catching a real bug, fix your code
   - If tests are flaky or environment-dependent, investigate the root cause

3. **Fix and re-run:**
   - Make the necessary code or test changes
   - Re-run the focused test: `npm test -- --run tests/failing-test.test.ts`
   - Once passing, re-run the full suite: `npm test -- --run`

4. **Do not commit with failing tests:**
   - All tests must pass before committing
   - If you must commit with known issues, document them clearly in the commit message and create a follow-up task
   - Never skip or comment out failing tests to make them pass

5. **When stuck:**
   - Check if the test expectations are correct
   - Verify your changes didn't break assumptions in other parts of the codebase
   - Use `npm test -- tests/specific-test.test.ts` (without --run) for watch mode debugging
   - Add console.log or debugger statements to understand the failure

## Required Verification Matrix

| Change type | Required automated checks | Focused checks |
| --- | --- | --- |
| Documentation only | `git diff --check`, `npx tsc --noEmit`, `npm run lint` unless blocked | Link/command review |
| UI or copy | `npx tsc --noEmit`, `npm run lint` | Manual mobile and Expo web smoke for touched screens, screenshots when layout comparison helps |
| User-facing feature flow | `npx tsc --noEmit`, `npm run lint`, focused tests when available | Functional flow, interruption, data integrity, UI/UX, performance, compatibility smoke |
| Data stores or local persistence | `npx tsc --noEmit`, `npm run lint`, `npm test -- --run` | Relevant store test, reset/export/import path if changed |
| Dictionary adapter or language metadata | `npx tsc --noEmit`, `npm run lint`, `npm test -- --run` | `tests/dictionaryApi.test.ts`, `tests/adapterRegistry.test.ts`, normalization tests when applicable |
| Import/export parser | `npx tsc --noEmit`, `npm run lint`, `npm test -- --run` | Parser fixture tests and destination folder/export smoke |
| Reader parser or file gate | `npx tsc --noEmit`, `npm run lint`, `npm test -- --run` | `tests/readerImport.test.ts`, platform gate/manual fixture smoke |
| Profile/privacy/security UI | `npx tsc --noEmit`, `npm run lint`, `npm test -- --run` when store behavior changes | Profile store tests and local reset/export smoke |

Run focused tests first when a focused suite exists. Run the full suite before marking a shared behavior, parser, adapter, or store task as DONE.

## Post-Feature App Testing

After a new feature is built, choose the smallest practical app-testing scope that proves the feature works. Use `.ai/skills/app-feature-testing.md` for agent-facing workflow details.

### Functional Testing
- Validate the full app flow: entry point, navigation, success path, failure path, cancel/back behavior, and return-to-screen state.
- Check interruption handling where relevant: reload, tab switch, modal close, cancelled picker/share action, temporary offline mode, or retry after an error.
- Confirm data integrity after create, update, delete, import, export, reset, reload, and any persistence-sensitive action touched by the feature.
- Confirm local-first behavior is preserved unless an accepted decision explicitly changes it.

### UI/UX Testing
- Check layout and display on a narrow mobile viewport and an Expo web desktop viewport when practical.
- Confirm long text, Vietnamese copy, buttons, toolbars, tab bars, modals, and fixed actions do not overlap or clip.
- Validate usability basics: primary action is discoverable, destructive action needs confirmation, disabled states are visible, and blocked features do not look production-ready.
- Check loading, empty, success, error, disabled, and destructive-confirmation states touched by the feature.

### Performance Testing
- Watch screen load time, feature action latency, and repeated interaction responsiveness.
- Confirm loading indicators appear for slow operations and controls do not feel stuck.
- Test network and offline assumptions when a feature reads remote, cached, imported, or file-backed data.
- Do not make live network services mandatory for routine verification unless the task explicitly requires them.

### Compatibility Testing
- Cover Expo web plus the target native platform when tooling is available.
- For browser testing, cover one narrow mobile viewport and one desktop viewport.
- For native-sensitive behavior, state whether testing used Expo Go, Android emulator, iOS simulator, or a development build.
- Do not claim native compatibility from Expo web evidence alone.

### Browser And Screenshot Evidence
- Browser-based testing is allowed for Expo web smoke checks, responsive checks, app-flow verification, and visual comparison.
- Temporary screenshots may be saved under `tmp/app-testing/<task-or-date>/` while testing.
- When Playwright is configured for a task, browser artifacts may be saved under `artifacts/ui-tests/<branch-or-task>/`.
- Use descriptive screenshot names, for example `word-mobile-empty.png`, `reader-desktop-loaded.png`, or `library-after-import.png`.
- Screenshots and browser artifacts are short-term evidence and must not be committed unless a task explicitly asks for fixture assets.
- Report screenshot paths in the verification summary only when they remain useful for handoff or comparison.

### DOM And Media Artifacts

Browser automation tools may create temporary artifacts such as:

```txt
.tempmediaStorage/
dom_1779205896929.txt
trace.zip
screenshot-*.png
```

How to treat them:

- `dom_*.txt` files are DOM snapshots captured during a browser session.
- `.tempmediaStorage/*`, traces, screenshots, and browser recordings are short-term testing evidence, not source code.
- Do not copy artifacts from external AI/tool caches such as `.gemini/antigravity/brain/...` into this repo.
- Store intentional short-term repo-local evidence under `tmp/app-testing/<task-or-date>/`.
- Store intentional Playwright comparison evidence under `artifacts/ui-tests/<branch-or-task>/` when an E2E task asks for it.
- Do not commit these artifacts unless the task explicitly asks for durable fixtures under `tests/fixtures/`.

## Optional UI Artifact Workflow

Use this workflow for visual redesigns, high-risk layout changes, branch-to-branch UI comparisons, or tasks that explicitly ask for screenshot/video/trace evidence. Dictionary Mobile has Playwright configured for Expo Web artifact capture. Native Maestro coverage has a committed flow template but still requires a runnable native app and `MAESTRO_APP_ID`.

### Expo Web With Playwright

Expo Web plus Playwright is the fastest practical path for automated UI artifact capture in this project. It can open the app in an iPhone-sized browser viewport, click through a flow, assert visible text, capture screenshots, record video, save a trace, and write DOM/HTML plus visible-text snapshots.

Use Playwright when the task needs:

- branch comparison, for example `main` versus `feature/glassmorphism-word-ui`
- Word Detail, Reader, Library, Profile, or import/export flow screenshots
- DOM/HTML and visible-text snapshots for web-rendered layout debugging
- repeatable responsive checks on a narrow mobile browser viewport and a desktop viewport

Playwright is configured through `playwright.config.mjs` and the `e2e/` specs. Install browser binaries in a fresh environment before the first run:

```bash
npx playwright install chromium
npx playwright install-deps chromium # Linux containers only when browser deps are missing
```

Available commands:

```bash
npm run test:e2e
npm run test:e2e:branch
npm run test:e2e:headed
npm run test:e2e:report
```

Recommended artifact set:

```txt
artifacts/ui-tests/<branch-or-task>/<flow>/
  screenshot.png
  video.webm
  trace.zip
  page.dom.html
  visible-text.txt
```

Recommended branch-comparison process:

1. Confirm the worktree is clean or only contains the intended changes.
2. Run the same UI flow on `main` and save artifacts under `artifacts/ui-tests/main/<flow>/`.
3. Run the same UI flow on the feature branch and save artifacts under `artifacts/ui-tests/<feature-branch>/<flow>/`.
4. Compare layout consistency, visual hierarchy, mobile readability, tab visibility and alignment, missing or duplicated content, text wrapping, overflow, off-screen controls, and usability regressions.
5. Report a verdict: keep, revise, or reject the UI change, with affected screens and suggested fixes.

### Native Mobile With Maestro Or Detox

Use native E2E only when the behavior must be proven on iOS or Android rather than Expo Web: native navigation, file pickers, sharing, audio, permissions, offline device behavior, native performance, or simulator/device compatibility.

Native app tests do not have an HTML DOM. Collect native evidence instead:

- screenshots
- screen recordings
- accessibility labels and accessibility tree
- view hierarchy/UI tree when available
- simulator/device logs
- platform, OS version, device profile, and Expo Go versus development-build notes

Maestro is the preferred lightweight native smoke option for this project. The default template flow lives in `.maestro/word-detail.yml` and expects a native app id:

```bash
export MAESTRO_APP_ID=<ios-or-android-app-id>
npm run test:native:maestro
```

Expo Go smoke uses `.maestro/expo-go-word-detail.yml` and opens a deep link provided by `EXPO_GO_WORD_URL`:

```bash
export EXPO_GO_WORD_URL=<expo-go-url-for-/word?word=articulate&sourceLang=en&targetLang=en>
npm run test:native:maestro:expo-go:ios
npm run test:native:maestro:expo-go:android
```

**Getting MAESTRO_APP_ID:**

For Expo Go:
- iOS: `host.exp.Exponent`
- Android: `host.exp.exponent`

For development builds:
- Check `app.json` for your bundle identifier
- iOS: typically `com.yourcompany.yourapp` or the value in `ios.bundleIdentifier`
- Android: typically `com.yourcompany.yourapp` or the value in `android.package`

To find the app ID of an installed app:
- iOS: `xcrun simctl listapps booted` (lists all apps on booted simulator)
- Android: `adb shell pm list packages -3` (lists third-party packages)

Use the Maestro flow only after the app is installed on a simulator/device or Expo Go/development-build app id has been confirmed. Detox can be considered later when the project needs deeper React Native synchronization or heavier CI integration.

Development-build bundle identifiers remain deferred until a dev-build workflow is selected.

### Security And Privacy

Browser/Computer Use, internet access, traces, DOM snapshots, screenshots, videos, and native UI trees can expose local app state or user content. Keep them scoped to the tested route and task, avoid unrelated domains, avoid secrets and private user data, and leave artifacts in ignored temporary folders unless a task explicitly promotes sanitized fixtures into `tests/fixtures/`.

## Unit Test Guide

Existing unit tests live in `tests/`:

- `adapterRegistry.test.ts`: language adapter registration, supported/blocked routing, adapter availability.
- `dictionaryApi.test.ts`: dictionary lookup, morphology, local fixtures, related words, source behavior.
- `languageNormalization.test.ts`: locale-specific casing and normalization helpers.
- `libraryStore.test.ts`: folders, saved words, export metadata, flashcard/library behavior.
- `nativePdfGate.test.ts`: PDF platform gate behavior.
- `profileStore.test.ts`: local profile, notification, privacy state.
- `readerImport.test.ts`: TXT/HTML/DOCX/EPUB/PDF import parsing and gates.

### Offline Language Feature Tests

Language adapter and morphology checks should run offline through `tests/dictionaryApi.test.ts`. These tests use local fixtures and should not call live APIs, which keeps them fast and stable.

Typical pipeline:

```txt
fetchMonolingualMeaning(word, lang)
  -> language-specific fetch helper in data/dictionaryApi.ts
  -> getMorphologyCandidates(lang, word)
  -> language-specific morphology helper in data/morphology.ts
  -> findLocalDictionaryEntry(lang, candidate)
  -> fixture entry in data/localLexicon.ts
```

For each new language baseline or morphology slice, cover the smallest useful set:

| Test type | Example | Purpose |
| --- | --- | --- |
| Exact lookup | `fetchMonolingualMeaning('புத்தகம்', 'ta')` returns the same headword | Fixture and adapter registration are correct |
| Plural or suffix fallback | Telugu `పుస్తకాలు` resolves to `పుస్తకము` | Morphology stripping or canonical rewrite works |
| Case or oblique fallback | Telugu `పిల్లికి` resolves to `పిల్లి` | Nominal case handling works |
| Irregular fallback | Telugu `ఇంటిలో` resolves to `ఇల్లు` | Special-case lemma rules work |
| Related words | `fetchRelatedWords(word, lang)` returns fixture synonyms/antonyms | Local relation data is wired |
| Missing result | Unsupported or absent entry returns the intended fallback/null state | UI can distinguish missing data from crashes |

Focused commands:

```bash
npm test -- --run tests/dictionaryApi.test.ts
npm test -- tests/dictionaryApi.test.ts
npx tsc --noEmit
npm run lint
```

Use `npm test -- tests/dictionaryApi.test.ts` only for local watch-style iteration. Before marking a language task DONE, run the focused suite once with `--run`; run the full suite when shared dictionary behavior changed.

When adding or changing behavior:

- Add tests in the closest existing test file instead of creating a new suite by default.
- Name tests by behavior, not implementation detail.
- Keep fixtures deterministic and small.
- Keep runtime caches and crawl output out of version control.
- Do not write tests that require live network, API credentials, OAuth, native-only device state, or clock-sensitive remote data.
- For dictionary fixtures, include only tiny source-attributed entries and test exact lookup plus the intended fallback path.
- For parser fixtures, prefer repo-owned fixture files under `tests/fixtures/` and document how to regenerate them.

## Feature Test Process

### UI And Copy
- Check loading, empty, success, and error states for the touched screen.
- Smoke on a narrow mobile viewport and Expo web.
- Confirm long text wraps or truncates without overlap.
- Keep Vietnamese UI copy consistent with nearby screens.
- When using `DESIGN.md` as reference, adapt its tokens to app screens: 8px buttons/inputs, 12px cards, purple only for primary actions, warm neutral surfaces, and no marketing-page hero decoration in functional workflows.

### UI Refactor Feature Preservation
- Inventory the actions that existed before the visual change and confirm they remain reachable afterward.
- Check touched drawer, modal, tab, and action-menu sections still open and close.
- Verify empty, loading, error, success, disabled, and coming-soon states stay honest and do not imply blocked features are live.
- Confirm destructive actions still show confirmation and local-first/privacy copy remains accurate.
- Smoke narrow mobile and desktop Expo web for clipping, overlap, hidden controls, text overflow, and inaccessible fixed actions.
- For Profile changes specifically, verify settings drawer sections, auth shell, privacy/app lock, notifications, local export/reset, support/legal links, and offline pack install/delete controls still exist.

### Data Stores And Local Persistence
- Verify create, update, delete, reload, and reset behavior.
- Confirm local-first assumptions remain intact.
- Add or update store tests when stored shape, migrations, counters, metadata, sync state, or export fields change.

### Dictionary Adapters
- Confirm language metadata and adapter registration match.
- Test exact lookup, morphology/normalization fallback, missing result behavior, and related words when supported.
- Keep monolingual lookup first. Do not add bilingual routes without a trusted lexical source.
- Do not use machine translation as dictionary data.

### Import And Export
- Test valid input, invalid input, empty input, duplicates, and mapping options.
- Verify destination folder behavior and generated flashcard choices.
- For exports, verify file content shape and unsupported platform behavior.

### Reader
- Test the changed file type or reader flow with fixture content.
- Verify file-size and empty-text gates where relevant.
- Keep PDF gated unless platform support and fixture evidence are explicitly documented.

### Profile, Privacy, And Security
- Verify local state persistence and reset behavior.
- Keep auth, backend, cloud sync, email/phone verification, and account deletion marked blocked until accepted decisions exist.
- Do not store sensitive user data in a new location without a decision.

### Documentation Only
- Confirm links, file paths, and commands are accurate.
- Prefer running `npx tsc --noEmit` and `npm run lint`; document any blocker.
- Run `git diff --check` before commit.

## Manual QA Checklist

Use this checklist when touched behavior is user-facing:

- App launches on Expo web or target platform.
- Main tab navigation still works.
- Dictionary search returns expected result, empty state, and error state.
- Language selector routes supported and unsupported pairs correctly.
- Library folder create/edit/delete/export flows still work if touched.
- Import preview, validation, and destination folder selection still work if touched.
- Reader import, text display, lookup, save, highlight, and flashcard creation still work if touched.
- Profile sidebar, privacy, support, local export, and local reset flows still work if touched.
- No obvious mobile/web overlap, clipped controls, or inaccessible fixed actions.

## Build And Run Guide

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npm start
```

Run platform targets:

```bash
npm run web
npm run android
npm run ios
```

Run verification:

```bash
npx tsc --noEmit
npm run lint
npm test -- --run
```

Run focused tests:

```bash
npm test -- --run tests/dictionaryApi.test.ts
npm test -- --run tests/readerImport.test.ts
```

Run Expo Web E2E artifact tests:

```bash
npm run test:e2e
npm run test:e2e:branch
npm run test:e2e:headed
npm run test:e2e:report
```

Run native Maestro smoke after setting the target app id and installing the app on a simulator/device:

```bash
export MAESTRO_APP_ID=<ios-or-android-app-id>
npm run test:native:maestro
```

Run Expo Go native smoke after starting Expo and setting the deep link:

```bash
export EXPO_GO_WORD_URL=<expo-go-url-for-/word?word=articulate&sourceLang=en&targetLang=en>
npm run test:native:maestro:expo-go:ios
npm run test:native:maestro:expo-go:android
```

Known caveats:

- User data is local-first unless an accepted backend/cloud decision exists.
- PDF import is controlled by documented platform gates and fixture evidence.
- Expo Go cannot validate native-only behavior that requires a development build.
- `expo-av` remains in use for current audio behavior; migration to `expo-audio` should be handled as a separate feature task.
- Remaining `npm audit` findings after safe fixes require major upgrades such as Expo SDK 55 or Vitest 4; do not run `npm audit fix --force` during routine feature work.
- External APIs, OAuth, auth, cloud sync, AI, speech scoring, and licensed offline bundles remain blocked until accepted decisions exist.

## Release And Commit Checklist

Before committing:

- Review `git status --short`.
- Review the diff for unrelated edits, generated files, secrets, and accidental fixture/cache additions.
- Run the required checks from the matrix.
- Confirm `docs/product-progress.md` matches code reality.
- Keep `Next Work Queue` to at most 5 items and, before code commits, at least 3 valid non-blocked items when available.
- Do not keep completed items in `Next Work Queue`.
- If a completed commit hash should be recorded, add it to `Current Baseline` in a follow-up checklist commit.

Before pushing:

- Check `git status --short`.
- Check the latest commit with `git log --oneline -1`.
- Reconfirm `docs/product-progress.md` is synchronized.
- After push, confirm `main` and `origin/main` are aligned and no local uncommitted changes remain.
