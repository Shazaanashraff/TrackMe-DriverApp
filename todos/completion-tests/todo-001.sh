#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f tsconfig.json
grep -q '"allowJs"' tsconfig.json
grep -q '"strict"' tsconfig.json
grep -q '"typecheck"' package.json
npm run typecheck
echo "COMPLETION OK: todo-001"
