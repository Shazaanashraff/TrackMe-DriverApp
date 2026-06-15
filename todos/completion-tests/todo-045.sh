#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
ls src/hooks/earnings/__tests__/* >/dev/null 2>&1
grep -rq 'invalidateQueries' src/hooks/earnings/__tests__
npx jest src/hooks/earnings
echo "COMPLETION OK: todo-045"
