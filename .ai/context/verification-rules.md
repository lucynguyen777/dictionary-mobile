# Verification Rules

## Required For Code Changes
Run:

```bash
npx tsc --noEmit
npm run lint
```

## Required When Data Logic Changes
Also run:

```bash
npm test
```

This applies when changing:
- `data/csvImport.ts`
- `data/readerImport.ts`
- `data/adapterRegistry.ts`
- `data/dictionaryApi.ts`
- stores in `data/*Store.ts`
- behavior covered by `tests/`

## Documentation-Only Changes
For `.ai`, `.docs`, or markdown-only edits, typecheck/lint are optional unless the user asks for full verification. Still check `git status --short` and review diffs.

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
