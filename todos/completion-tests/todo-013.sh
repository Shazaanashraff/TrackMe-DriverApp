#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
for h in useLogin useRegister useLogout; do grep -rq "$h" src/hooks/auth; done
grep -rqi 'role\|driver' src/hooks/auth
ls src/hooks/auth/__tests__/* >/dev/null 2>&1
npx jest src/hooks/auth
npm run typecheck
echo "COMPLETION OK: todo-013"
