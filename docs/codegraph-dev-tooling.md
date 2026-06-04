# CodeGraph Dev Tooling

CodeGraph is optional developer/agent tooling for local repo exploration. It is not an app feature and must not be bundled into Dictionary Mobile runtime code.

Source: https://github.com/colbymchenry/codegraph

## Recommended Use

- Use CodeGraph locally to reduce repeated repo exploration when planning modules.
- Keep generated local index/state out of commits.
- Continue using `docs/product-progress.md` as the release/task source of truth.

## Setup

```sh
codegraph init -i
```

Then connect the local MCP server from your development environment when useful. If CodeGraph is unavailable, continue with normal repo tools such as `rg`, tests, and the existing docs.

## Ignore Policy

`.codegraph/` is ignored because it is local generated state. Do not store secrets, provider keys, Supabase tokens, or production env values in CodeGraph notes/index files.
