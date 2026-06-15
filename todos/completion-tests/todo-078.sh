#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test "$(grep -rl 'accessibilityLabel' src/features | wc -l)" -ge 3
grep -rq 'accessibilityRole' src/features src/components
npm run lint
npm run test:unit
echo "COMPLETION OK: todo-078"
