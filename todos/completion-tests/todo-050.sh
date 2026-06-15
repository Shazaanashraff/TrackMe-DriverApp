#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
ls src/test/integration/* >/dev/null 2>&1
grep -rq 'mockFetch' src/test/integration
grep -rq 'expectContract\|lastRequest' src/test/integration
grep -rq 'mockSocket' src/test/integration
npx jest int.test
echo "COMPLETION OK: todo-050"
