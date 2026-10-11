#!/bin/bash
# Installs npm dependencies so tsc, lint, and vitest work in Claude Code cloud sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Playwright uses the pre-installed Chromium in cloud containers.
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# npm install (not ci) reuses the cached node_modules between sessions.
npm install --no-audit --no-fund --loglevel=error
