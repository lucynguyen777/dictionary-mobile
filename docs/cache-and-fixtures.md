# Cache policy & canonical fixtures

Short note describing how we treat runtime crawl caches and how to create small, deterministic fixtures for tests and parser development.

## Policy

- Runtime caches and per-run logs produced by local crawling are generated artifacts and should NOT be committed to the repository by default.
- Ignore paths (recommended):

  - `data/wiktionary-cache/`
  - `data/wiktionary-bulk-runs/`

- Keep small, curated canonical fixtures in `tests/fixtures/wiktionary/` for deterministic unit tests and parser development.

## How to create a canonical fixture

1. Produce a single cached parse with the crawler (example):

```bash
node scripts/wiktionary-crawler.mjs en book
```

2. Inspect the cached output:

```bash
cat data/wiktionary-cache/en/book.json | jq .
```

3. Sanitize runtime metadata and save as a fixture:

```bash
mkdir -p tests/fixtures/wiktionary/en
jq 'del(.fetchedAt, .runId, ._meta)' \
  data/wiktionary-cache/en/book.json \
  > tests/fixtures/wiktionary/en/book.json
```

4. Add and commit the fixture (small, representative only):

```bash
git add tests/fixtures/wiktionary/en/book.json
git commit -m "test(fixtures): add canonical wiktionary fixture en/book"
git push
```

## If runtime caches were accidentally committed

```bash
git rm --cached -r data/wiktionary-cache data/wiktionary-bulk-runs
git commit -m "chore: remove runtime wiktionary caches from index"
git push
```

## Notes

- Keep fixtures focused and small — they should exercise parser code paths, not be full dumps of cache data.
- Update fixtures deliberately when parser behavior changes; prefer adding targeted fixtures over large file changes.
