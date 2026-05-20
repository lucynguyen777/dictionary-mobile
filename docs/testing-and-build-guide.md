# Testing And Build Guide

This is the human-facing QA guide for Dictionary Mobile. Use it with `docs/product-progress.md` before marking roadmap work done. The short agent-facing rules remain in `.ai/context/verification-rules.md`.

## Required Verification Matrix

| Change type | Required automated checks | Focused checks |
| --- | --- | --- |
| Documentation only | `npx tsc --noEmit`, `npm run lint` unless blocked | `git diff --check`, link/command review |
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
- Use descriptive screenshot names, for example `word-mobile-empty.png`, `reader-desktop-loaded.png`, or `library-after-import.png`.
- Screenshots and browser artifacts are short-term evidence and must not be committed unless a task explicitly asks for fixture assets.
- Report screenshot paths in the verification summary only when they remain useful for handoff or comparison.

## Unit Test Guide

Existing unit tests live in `tests/`:

- `adapterRegistry.test.ts`: language adapter registration, supported/blocked routing, adapter availability.
- `dictionaryApi.test.ts`: dictionary lookup, morphology, local fixtures, related words, source behavior.
- `languageNormalization.test.ts`: locale-specific casing and normalization helpers.
- `libraryStore.test.ts`: folders, saved words, export metadata, flashcard/library behavior.
- `nativePdfGate.test.ts`: PDF platform gate behavior.
- `profileStore.test.ts`: local profile, notification, privacy state.
- `readerImport.test.ts`: TXT/HTML/DOCX/EPUB/PDF import parsing and gates.

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

Known caveats:

- User data is local-first unless an accepted backend/cloud decision exists.
- PDF import is controlled by documented platform gates and fixture evidence.
- Expo Go cannot validate native-only behavior that requires a development build.
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
