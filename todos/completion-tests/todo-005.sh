#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/lib/errors.ts
grep -q 'class AppError' src/lib/errors.ts
grep -q 'normalizeError' src/lib/errors.ts
grep -q 'userMessage' src/lib/errors.ts
grep -q 'permission' src/lib/errors.ts
grep -q 'tracking' src/lib/errors.ts
test -f src/lib/__tests__/errors.test.ts
grep -qi 'permission' src/lib/__tests__/errors.test.ts
npx jest src/lib/__tests__/errors.test.ts
echo "COMPLETION OK: todo-005"
