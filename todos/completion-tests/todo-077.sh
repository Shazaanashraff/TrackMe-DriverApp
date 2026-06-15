#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/lib/haptics.ts
grep -q 'expo-haptics' package.json
grep -rqi 'haptic' src/features src/hooks src/screens
npx jest haptics 2>/dev/null || npm run test:unit
echo "COMPLETION OK: todo-077"
