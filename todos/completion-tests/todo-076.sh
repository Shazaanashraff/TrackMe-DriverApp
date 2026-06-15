#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
grep -rqiE 'lazy|import\(' src/navigation
test -f docs/perf-notes.md
npm run typecheck
echo "COMPLETION OK: todo-076"
