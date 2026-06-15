#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/components/ui/Skeleton.tsx
grep -rqi 'skeleton' src/features src/screens
npx jest Skeleton 2>/dev/null || npm run test:unit
echo "COMPLETION OK: todo-074"
