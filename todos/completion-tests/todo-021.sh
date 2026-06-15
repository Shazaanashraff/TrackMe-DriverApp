#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
S=$(ls src/screens/LoginScreen.* | head -1)
grep -q 'useLogin' "$S"
grep -q 'InlineError' "$S"
! grep -Eq '(^|[^a-zA-Z])api\.|fetch\(' "$S"
npx jest LoginScreen
npm run typecheck
npm run lint
echo "COMPLETION OK: todo-021"
