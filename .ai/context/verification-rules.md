# Verification Rules

Detailed human-facing QA, unit test, build, E2E, and release guidance lives in `docs/testing-and-build-guide.md`.

Use `.ai/skills/app-feature-testing.md` for post-feature app testing on user-facing work.

## Required For Code Changes
Run:

```bash
git diff --check
npx tsc --noEmit
npm run lint
```

## Required When Data Logic Changes
Also run the closest focused offline suite first, then the full suite when shared behavior changed:

```bash
npm test -- --run tests/dictionaryApi.test.ts # dictionary/language changes
npm test -- --run tests/readerImport.test.ts  # reader parser/file gate changes
npm test -- --run tests/libraryStore.test.ts  # library persistence changes
npm test -- --run
```

This applies when changing:
- `data/csvImport.ts`
- `data/readerImport.ts`
- `data/adapterRegistry.ts`
- `data/dictionaryApi.ts`
- `data/localLexicon.ts`
- `data/morphology.ts`
- stores in `data/*Store.ts`
- behavior covered by `tests/`

For dictionary/language changes, prefer offline fixture coverage for exact lookup, morphology fallback, missing results, and related words before any live source smoke.

## Required When A User-Facing Feature Changes
Also perform the smallest practical app test that covers:
- functional app flow, interruption handling, and data integrity
- UI/UX layout, display, and usability
- performance basics for loading, repeated actions, network, and offline assumptions
- compatibility across Expo web plus target native platform or documented browser/device viewports

Use Playwright when browser UI artifact evidence is needed:

```bash
npm run test:e2e
npm run test:e2e:branch
```

Use Maestro only after a native app is installed on a simulator/device and `MAESTRO_APP_ID` is set:

```bash
export MAESTRO_APP_ID=<ios-or-android-app-id>
npm run test:native:maestro
```

For Expo Go native smoke, start Expo, set the deep link, then use the platform script:

```bash
export EXPO_GO_WORD_URL=<expo-go-url-for-/word?word=articulate&sourceLang=en&targetLang=en>
npm run test:native:maestro:expo-go:ios
npm run test:native:maestro:expo-go:android
```

Browser-based Expo web testing is allowed. Temporary screenshots and generated browser artifacts must stay in ignored paths such as `tmp/app-testing/`, `artifacts/ui-tests/`, `playwright-report/`, and `test-results/` unless explicitly requested as fixtures.

## Documentation-Only Changes
For `.ai`, `docs`, or markdown-only edits, prefer:

```bash
git diff --check
npx tsc --noEmit
npm run lint
```

Document any blocker clearly if a check cannot run.

## Before Marking DONE
Confirm:
- acceptance criteria are implemented
- blocked behavior was not faked
- `docs/product-progress.md` matches code reality
- `Next Work Queue` has at most 5 items
- failed or skipped checks are documented

## Before Commit & Push (Security Risk & Vulnerability Check)
Confirm:
- **Security Check**: Actively check for potential risks of the new/modified modules, especially security vulnerabilities and attack surfaces (e.g. plaintext keys, missing RLS policies, unvalidated inputs, rate-limiting/abuse holes, insecure local storage).
- **Resolution Plan**: List and explain the mitigations/solutions for all identified security or architectural risks. Do not suggest committing or pushing if there are unresolved high security risks.
- no unrelated changes were staged
- no secrets or generated noise were added
- decision docs are not treated as accepted unless their status says `Accepted`
