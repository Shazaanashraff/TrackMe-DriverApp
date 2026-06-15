#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
ls .eslintrc* >/dev/null 2>&1
grep -q '"lint"' package.json
grep -Eq 'no-restricted-(imports|syntax)|fetch|watchPositionAsync' .eslintrc* 2>/dev/null
npm run lint
echo "COMPLETION OK: todo-003"
