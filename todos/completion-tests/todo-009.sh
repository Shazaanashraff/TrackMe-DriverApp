#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/helpers/earnings.ts
test -f src/helpers/__tests__/earnings.test.ts
grep -qi 'payout\|empty' src/helpers/__tests__/earnings.test.ts
npx jest earnings
npm run typecheck
echo "COMPLETION OK: todo-009"
