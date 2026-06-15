#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/context/__tests__/AuthContext.test.tsx
grep -q 'authenticatedRequest' src/context/__tests__/AuthContext.test.tsx
grep -qi 'refresh' src/context/__tests__/AuthContext.test.tsx
grep -qiE 'role|driver' src/context/__tests__/AuthContext.test.tsx
npx jest AuthContext
echo "COMPLETION OK: todo-042"
