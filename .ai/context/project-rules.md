# Project Rules

This file is kept as a compatibility alias for older agent specs.

Use `.ai/context/product-rules.md` as the canonical rules file.

## Minimum Rules
1. Read `docs/product-progress.md` before roadmap work.
2. Do not start BLOCKED tasks.
3. Keep `Next Work Queue` to at most 5 items.
4. Prefer small, verifiable changes.
5. Before marking implementation DONE, run:
   - `npx tsc --noEmit`
   - `npm run lint`
6. Run `npm test` when data logic, parser logic, adapters, stores, or covered behavior changed.
