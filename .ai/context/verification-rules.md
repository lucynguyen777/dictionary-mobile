# Verification Rules

Detailed human-facing QA, unit test, build, and release guidance lives in `docs/testing-and-build-guide.md`.

Use `.ai/skills/app-feature-testing.md` for post-feature app testing on user-facing work.

## Required For Code Changes
Run:

```bash
npx tsc --noEmit
npm run lint
```

## Required When Data Logic Changes
Also run:

```bash
npm test -- --run
```

This applies when changing:
- `data/csvImport.ts`
- `data/readerImport.ts`
- `data/adapterRegistry.ts`
- `data/dictionaryApi.ts`
- stores in `data/*Store.ts`
- behavior covered by `tests/`

## Required When A User-Facing Feature Changes
Also perform the smallest practical app test that covers:
- functional app flow, interruption handling, and data integrity
- UI/UX layout, display, and usability
- performance basics for loading, repeated actions, network, and offline assumptions
- compatibility across Expo web plus target native platform or documented browser/device viewports

Browser-based Expo web testing is allowed. Temporary screenshots may be saved under `tmp/app-testing/<task-or-date>/` for short-term visual comparison, but must not be committed unless explicitly requested as fixtures.

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

## Before Commit
Confirm:
- no unrelated changes were staged
- no secrets or generated noise were added
- decision docs are not treated as accepted unless their status says `Accepted`
