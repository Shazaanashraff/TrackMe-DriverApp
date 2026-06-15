#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
ls src/hooks/auth/__tests__/* >/dev/null 2>&1
grep -rqiE 'role|driver' src/hooks/auth/__tests__
npx jest src/hooks/auth
echo "COMPLETION OK: todo-043"
